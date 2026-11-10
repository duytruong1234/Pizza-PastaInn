import prisma from '../lib/prisma';
import { normalizeCategory, getSimilarDishes } from './contentBasedService';

// Lấy danh sách món phổ biến nhất
export const getPopularDishes = async (limit = 10, categoryName?: string) => {
  // Query order_items và join với dish_price, dish, combo (chỉ lấy đơn completed)
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: { order_status: 'completed' }
    },
    include: {
      dish_price: {
        include: {
          dish: {
            include: { prices: true, category: true }
          }
        }
      },
      combo: true
    }
  });

  const itemsMap = new Map<string, any>();
  
  for (const item of orderItems) {
    const qty = item.quantity || 1;
    let key = '';
    let name = '';
    let image = '';
    let type = '';
    let id: number | null = null;
    let prices: any[] = [];
    let category = '';
    let ingredient = '';
    
    if (item.dish_price?.dish) {
      id = item.dish_price.dish.dish_id;
      key = `dish_${id}`;
      name = item.dish_price.dish.dish_name;
      image = item.dish_price.dish.image || '';
      type = 'dish';
      prices = item.dish_price.dish.prices;
      category = item.dish_price.dish.category?.category_name || '';
      ingredient = item.dish_price.dish.ingredient || '';
    } else if (item.combo) {
      id = item.combo.combo_id;
      key = `combo_${id}`;
      name = item.combo.combo_name;
      image = item.combo.image_combo || '';
      type = 'combo';
      prices = [{ dish_price: item.combo.combo_price }];
      category = 'Combo';
      ingredient = item.combo.description || '';
    } else {
      continue;
    }
    
    if (!itemsMap.has(key)) {
      itemsMap.set(key, {
        dish_id: id,
        dish_name: name,
        image,
        category,
        ingredient,
        total_ordered: 0,
        type,
        prices
      });
    }
    
    const existing = itemsMap.get(key);
    existing.total_ordered += qty;
  }
  
  // Sort by total quantity descending
  let sortedItems = Array.from(itemsMap.values())
    .sort((a, b) => b.total_ordered - a.total_ordered);

  // Lọc theo danh mục nếu có
  if (categoryName) {
    const normCat = normalizeCategory(categoryName) || categoryName;
    const lowerCat = normCat.toLowerCase();
    sortedItems = sortedItems.filter(item => {
      const itemCat = normalizeCategory(item.category) || (item.category || '').toLowerCase();
      return itemCat.toLowerCase().includes(lowerCat) || lowerCat.includes(itemCat.toLowerCase());
    });
  }

  const finalItems = sortedItems.slice(0, limit);
    
  // Tính avg_rating từ review_item_ratings của các đánh giá hợp lệ
  const visibleReviews = await prisma.shopReview.findMany({
    where: { NOT: { is_visible: false } },
    select: { review_id: true }
  });
  const visibleReviewIds = visibleReviews.map(r => r.review_id);

  const reviewRatings = visibleReviewIds.length > 0
    ? await prisma.reviewItemRating.groupBy({
        by: ['dish_name'],
        where: { review_id: { in: visibleReviewIds } },
        _avg: {
          rating_star: true
        }
      })
    : [];
  
  const ratingMap = new Map();
  reviewRatings.forEach(r => {
    ratingMap.set(r.dish_name, r._avg.rating_star);
  });
  
  // Lấy ảnh pizza đầu tiên để làm fallback cho Half-Half
  let fallbackPizzaImage: string | null = null;
  const needsFallback = finalItems.some(item =>
    item.dish_name?.toLowerCase().includes('half') && !item.image
  );
  if (needsFallback) {
    const firstPizza = await prisma.dish.findFirst({
      where: {
        category: { category_name: { contains: 'Pizza', mode: 'insensitive' } },
        image: { not: null },
        dish_status: true,
        NOT: { dish_name: { contains: 'half', mode: 'insensitive' } }
      },
      select: { image: true }
    });
    fallbackPizzaImage = firstPizza?.image || null;
  }

  return finalItems.map(item => ({
    ...item,
    image: item.image || (item.dish_name?.toLowerCase().includes('half') ? fallbackPizzaImage : null),
    avg_rating: ratingMap.get(item.dish_name) || 0
  }));
};

// Lấy danh sách món hay đặt lại của người dùng
export const getReorderFavorites = async (userId: number, limit = 6) => {
  const orders = await prisma.order.findMany({
    where: {
      user_id: userId,
      order_status: 'completed'
    },
    include: {
      items: {
        include: {
          dish_price: {
            include: {
              dish: {
                include: { prices: true, category: true }
              }
            }
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });
  
  const map = new Map<number, any>();
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const dish = item.dish_price?.dish;
      if (dish) {
        const id = dish.dish_id;
        if (!map.has(id)) {
          map.set(id, {
            dish_id: id,
            dish_name: dish.dish_name,
            ingredient: dish.ingredient || '',
            dish_type: dish.dish_type || 'man',
            category: dish.category?.category_name || '',
            image: dish.image || '',
            order_count: 0,
            last_ordered: order.created_at,
            prices: dish.prices
          });
        }
        map.get(id).order_count += (item.quantity || 1);
        
        const current = map.get(id);
        if (order.created_at && (!current.last_ordered || order.created_at > current.last_ordered)) {
            current.last_ordered = order.created_at;
        }
      }
    });
  });
  
  const finalItems = Array.from(map.values())
    .sort((a, b) => b.order_count - a.order_count)
    .slice(0, limit);

  const needsFallback = finalItems.some(item =>
    item.dish_name?.toLowerCase().includes('half') && !item.image
  );
  if (needsFallback) {
    const firstPizza = await prisma.dish.findFirst({
      where: {
        category: { category_name: { contains: 'Pizza', mode: 'insensitive' } },
        image: { not: null },
        dish_status: true,
        NOT: { dish_name: { contains: 'half', mode: 'insensitive' } }
      },
      select: { image: true }
    });
    if (firstPizza?.image) {
      finalItems.forEach(item => {
        if (item.dish_name?.toLowerCase().includes('half') && !item.image) {
          item.image = firstPizza.image;
        }
      });
    }
  }

  return finalItems;
};

// Lấy danh sách món thường được đặt cùng
export const getFrequentlyOrderedTogether = async (dishIds: number[], limit = 4) => {
  const itemsWithTargetDishes = await prisma.orderItem.findMany({
    where: {
      dish_price: {
        dish_id: { in: dishIds }
      }
    },
    select: { order_id: true }
  });
  
  const orderIds = [...new Set(itemsWithTargetDishes.map(i => i.order_id).filter(id => id !== null))];
  
  if (orderIds.length === 0) return [];
  
  const coOrderedItems = await prisma.orderItem.findMany({
    where: {
      order_id: { in: orderIds as number[] },
      dish_price: {
        dish_id: { notIn: dishIds }
      }
    },
    include: {
      dish_price: {
        include: {
          dish: true
        }
      }
    }
  });
  
  const map = new Map<number, any>();
  
  coOrderedItems.forEach(item => {
    const dp = item.dish_price;
    const dish = dp?.dish;
    if (dish && dp) {
      const id = dish.dish_id;
      if (!map.has(id)) {
        map.set(id, {
          dish_id: id,
          dish_name: dish.dish_name,
          image: dish.image || '',
          co_order_count: 0,
          price: dp.dish_price,
          dish_price_id: dp.dish_price_id
        });
      }
      map.get(id).co_order_count += (item.quantity || 1);
    }
  });
  
  return Array.from(map.values())
    .sort((a, b) => b.co_order_count - a.co_order_count)
    .slice(0, limit);
};

// Lấy danh sách món được đánh giá cao nhất (Chỉ dùng dữ liệu đánh giá thực tế)
export const getTopRatedDishes = async (limit = 10, categoryName?: string) => {
  // Chỉ lấy từ các đánh giá hợp lệ (không bị ẩn)
  const visibleReviews = await prisma.shopReview.findMany({
    where: { NOT: { is_visible: false } },
    select: { review_id: true }
  });
  const visibleReviewIds = visibleReviews.map(r => r.review_id);

  if (visibleReviewIds.length === 0) {
    return [];
  }

  const ratings = await prisma.reviewItemRating.groupBy({
    by: ['dish_name'],
    where: {
      review_id: { in: visibleReviewIds }
    },
    _avg: { rating_star: true },
    _count: { rating_star: true }
  });
  
  // Chỉ lấy món có đánh giá thực tế (tối thiểu 1 đánh giá)
  const filtered = ratings
    .filter(r => (r._count.rating_star || 0) >= 1)
    .sort((a, b) => {
      const avgDiff = (b._avg.rating_star || 0) - (a._avg.rating_star || 0);
      if (avgDiff !== 0) return avgDiff;
      return (b._count.rating_star || 0) - (a._count.rating_star || 0);
    });
    
  const dishNames = filtered.map(r => r.dish_name);
  if (dishNames.length === 0) {
    return [];
  }
  
  const normCat = categoryName ? (normalizeCategory(categoryName) || categoryName) : undefined;
  const dishWhere: any = { dish_name: { in: dishNames }, dish_status: true };
  if (normCat) {
    dishWhere.category = { category_name: { contains: normCat, mode: 'insensitive' } };
  }

  const [dishes, combos] = await Promise.all([
    prisma.dish.findMany({
      where: dishWhere,
      include: { prices: true, category: true }
    }),
    prisma.combo.findMany({
      where: { combo_name: { in: dishNames }, is_active: true }
    })
  ]);
  
  const itemMap = new Map<string, any>();
  dishes.forEach(d => itemMap.set(d.dish_name, {
    dish_id: d.dish_id,
    dish_name: d.dish_name,
    category: d.category?.category_name || '',
    ingredient: d.ingredient || '',
    image: d.image || null,
    type: 'dish',
    prices: d.prices || []
  }));

  combos.forEach(c => itemMap.set(c.combo_name, {
    dish_id: c.combo_id,
    dish_name: c.combo_name,
    category: 'Combo',
    ingredient: c.description || '',
    image: c.image_combo || null,
    type: 'combo',
    prices: [{ dish_price: c.combo_price }]
  }));
  
  let result: any[] = filtered.map(r => {
    const item = itemMap.get(r.dish_name);
    if (!item) return null;
    return {
      dish_id: item.dish_id,
      dish_name: r.dish_name,
      category: item.category,
      ingredient: item.ingredient,
      image: item.image,
      avg_rating: Number(Number(r._avg.rating_star || 0).toFixed(1)),
      review_count: r._count.rating_star || 0,
      type: item.type,
      prices: item.prices
    };
  }).filter(Boolean);

  // Chỉ lấy theo limit từ dữ liệu thực tế
  const topRatedResult = result.slice(0, limit);

  // Fallback ảnh pizza cho Half-Half (nếu món thật là half-half mà chưa có ảnh)
  const halfHalfNoImage = topRatedResult.some((r: any) =>
    r.dish_name?.toLowerCase().includes('half') && !r.image
  );
  if (halfHalfNoImage) {
    const firstPizza = await prisma.dish.findFirst({
      where: {
        category: { category_name: { contains: 'Pizza', mode: 'insensitive' } },
        image: { not: null },
        dish_status: true,
        NOT: { dish_name: { contains: 'half', mode: 'insensitive' } }
      },
      select: { image: true }
    });
    topRatedResult.forEach((r: any) => {
      if (r.dish_name?.toLowerCase().includes('half') && !r.image) {
        r.image = firstPizza?.image || null;
      }
    });
  }

  return topRatedResult;
};

// Goi y mon moi tuong tu dua tren lich su mua hang (mon lien quan va combo)
export const getHistoryBasedSuggestions = async (userId: number, limit = 6) => {
  const orders = await prisma.order.findMany({
    where: {
      user_id: userId,
      order_status: 'completed'
    },
    include: {
      items: {
        include: {
          dish_price: true
        }
      }
    }
  });

  const orderedDishIds = new Set<number>();
  const dishOrderCounts = new Map<number, number>();

  for (const order of orders) {
    for (const item of order.items) {
      if (item.dish_price?.dish_id) {
        const dishId = item.dish_price.dish_id;
        orderedDishIds.add(dishId);
        dishOrderCounts.set(dishId, (dishOrderCounts.get(dishId) || 0) + (item.quantity || 1));
      }
    }
  }

  const topOrderedDishes = Array.from(dishOrderCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  let allSuggestions: any[] = [];
  
  // 1. Lay mon lien quan dua tren nguyen lieu & khau vi
  for (const dishId of topOrderedDishes) {
    try {
      const similarDishes = await getSimilarDishes(dishId, 10);
      allSuggestions = allSuggestions.concat(similarDishes);
    } catch (e) {
      // Ignore errors for individual dish
    }
  }

  const uniqueSuggestions = new Map<string, any>();
  for (const suggestion of allSuggestions) {
    if (!orderedDishIds.has(suggestion.dish_id)) {
      const key = `dish_${suggestion.dish_id}`;
      if (!uniqueSuggestions.has(key) || suggestion.similarity_score > uniqueSuggestions.get(key).similarity_score) {
        uniqueSuggestions.set(key, { ...suggestion, type: 'dish' });
      }
    }
  }

  // 2. Lay them Combo phu hop chua cac mon khach thich hoac mon tuong tu
  if (topOrderedDishes.length > 0) {
    const candidateDishIds = Array.from(new Set([...topOrderedDishes, ...Array.from(uniqueSuggestions.values()).map(s => s.dish_id)]));
    const relatedCombos = await prisma.combo.findMany({
      where: {
        is_active: true,
        groups: {
          some: {
            combo_items: {
              some: {
                dish_price: {
                  dish_id: { in: candidateDishIds }
                }
              }
            }
          }
        }
      },
      take: 2
    });

    for (const combo of relatedCombos) {
      uniqueSuggestions.set(`combo_${combo.combo_id}`, {
        dish_id: combo.combo_id,
        dish_name: combo.combo_name,
        category: 'Combo',
        ingredient: combo.description || '',
        image: combo.image_combo || null,
        dish_type: 'man',
        prices: [{ dish_price: combo.combo_price }],
        similarity_score: 0.95,
        type: 'combo',
        match_reasons: ['Combo ưu đãi chứa món tương tự khẩu vị bạn']
      });
    }
  }

  const finalSuggestions = Array.from(uniqueSuggestions.values())
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);

  return finalSuggestions;
};

// Goi y combo dua tren gio hang
export const suggestCombosForCart = async (dishIds: number[]) => {
  if (!dishIds || dishIds.length === 0) return [];

  const activeCombos = await prisma.combo.findMany({
    where: { is_active: true },
    include: {
      groups: {
        include: {
          combo_items: {
            include: {
              dish_price: {
                include: {
                  dish: true
                }
              }
            }
          }
        }
      }
    }
  });

  const suggestions: any[] = [];

  for (const combo of activeCombos) {
    const matchedDishes: string[] = [];
    const matchedDishIds = new Set<number>();

    for (const group of combo.groups) {
      for (const item of group.combo_items) {
        const dish = item.dish_price?.dish;
        if (dish && dishIds.includes(dish.dish_id)) {
          if (!matchedDishIds.has(dish.dish_id)) {
            matchedDishIds.add(dish.dish_id);
            matchedDishes.push(dish.dish_name);
          }
        }
      }
    }

    // Phải có ít nhất 1 món trong giỏ khớp với combo
    if (matchedDishIds.size === 0) continue;

    let totalBundlePrice = 0;
    const groupSummaries: string[] = [];

    for (const group of combo.groups) {
      groupSummaries.push(group.group_name);
      const selectCount = group.min_select || 1;
      const isFree = group.group_name.toLowerCase().includes('free') || group.group_name.toLowerCase().includes('tặng');
      if (isFree) continue;

      // Tìm xem giỏ hàng có món nào thuộc group này không
      const matchedItem = group.combo_items.find(
        i => i.dish_price?.dish && dishIds.includes(i.dish_price.dish.dish_id) && (i.dish_price.dish_price || 0) > 0
      );

      let pricePerItem = 0;
      if (matchedItem && matchedItem.dish_price?.dish_price) {
        pricePerItem = matchedItem.dish_price.dish_price;
      } else {
        const validPrices = group.combo_items
          .map(i => i.dish_price?.dish_price || 0)
          .filter(p => p > 0);
        if (validPrices.length > 0) {
          const avg = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
          pricePerItem = Math.round(avg / 1000) * 1000;
        }
      }

      totalBundlePrice += pricePerItem * selectCount;
    }

    const rawSavings = totalBundlePrice - combo.combo_price;
    const savings = Math.round((rawSavings > 0 ? rawSavings : Math.round(combo.combo_price * 0.15)) / 1000) * 1000;
    const displayIndividual = Math.round((combo.combo_price + savings) / 1000) * 1000;

    suggestions.push({
      combo_id: combo.combo_id,
      combo_name: combo.combo_name,
      combo_price: combo.combo_price,
      image_combo: combo.image_combo,
      description: combo.description || groupSummaries.join(', '),
      matched_dishes: matchedDishes,
      matched_count: matchedDishIds.size,
      individual_price: displayIndividual,
      savings: savings,
      groups_summary: groupSummaries
    });
  }

  // Nếu có combo khớp từ 2 món trở lên trong giỏ hàng, ưu tiên giữ các combo này
  const maxMatched = Math.max(...suggestions.map(s => s.matched_count), 0);
  let filteredSuggestions = suggestions;
  if (maxMatched >= 2) {
    filteredSuggestions = suggestions.filter(s => s.matched_count >= 2);
  }

  // Sắp xếp: Ưu tiên số món trùng khớp giảm dần, sau đó mức tiết kiệm giảm dần
  filteredSuggestions.sort((a, b) => {
    if (b.matched_count !== a.matched_count) {
      return b.matched_count - a.matched_count;
    }
    return b.savings - a.savings;
  });

  return filteredSuggestions.slice(0, 3);
};

