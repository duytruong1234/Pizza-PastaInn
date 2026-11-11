import prisma from '../lib/prisma';
import { normalizeCategory, getSimilarDishes } from './contentBasedService';

const EXCLUDED_DISH_IDS = new Set([62, 63, 64, 65]);
const COMBO_ONLY_BREAD_IDS = new Set([62, 63, 64]);

function formatSortedPrices(prices?: any[]) {
  if (!Array.isArray(prices)) return [];
  return [...prices]
    .filter((p) => Number(p?.dish_price) > 0)
    .sort((a, b) => Number(a.dish_price) - Number(b.dish_price))
    .map((p) => ({
      dish_price_id: p.dish_price_id,
      size_id: p.size_id ?? null,
      crust_id: p.crust_id ?? null,
      size_name: p.size?.size_name || '',
      crust_name: p.crust?.crust_name || '',
      dish_price: Number(p.dish_price),
    }));
}

// Lấy danh sách món phổ biến nhất
export const getPopularDishes = async (limit = 10, categoryName?: string) => {
  // Query order_items và join với dish_price, dish, combo, halves (chỉ lấy đơn completed)
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: { order_status: 'completed' },
    },
    include: {
      dish_price: {
        include: {
          dish: {
            include: {
              prices: { include: { size: true, crust: true } },
              category: true,
            },
          },
        },
      },
      combo: true,
      halves: {
        include: {
          dish: {
            include: {
              prices: { include: { size: true, crust: true } },
              category: true,
            },
          },
        },
      },
    },
  });

  const itemsMap = new Map<string, any>();

  const upsertDishEntry = (dish: any, qtyToAdd: number) => {
    if (!dish || !dish.dish_status || EXCLUDED_DISH_IDS.has(dish.dish_id)) return;
    const sortedPrices = formatSortedPrices(dish.prices);
    if (sortedPrices.length === 0) return;
    const key = `dish_${dish.dish_id}`;
    if (!itemsMap.has(key)) {
      itemsMap.set(key, {
        dish_id: dish.dish_id,
        dish_name: dish.dish_name,
        image: dish.image || '',
        category: dish.category?.category_name || '',
        ingredient: dish.ingredient || '',
        dish_type: dish.dish_type || 'man',
        total_ordered: 0,
        type: 'dish',
        prices: sortedPrices,
      });
    }
    itemsMap.get(key).total_ordered += qtyToAdd;
  };

  for (const item of orderItems) {
    const qty = item.quantity || 1;

    if (item.is_half_half && item.halves && item.halves.length > 0) {
      for (const h of item.halves) {
        if (h.dish) upsertDishEntry(h.dish, qty);
      }
      continue;
    }

    if (item.dish_price?.dish) {
      upsertDishEntry(item.dish_price.dish, qty);
    } else if (item.combo && item.combo.is_active) {
      const id = item.combo.combo_id;
      const key = `combo_${id}`;
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          dish_id: id,
          dish_name: item.combo.combo_name,
          image: item.combo.image_combo || '',
          category: 'Combo',
          ingredient: item.combo.description || '',
          dish_type: 'man',
          total_ordered: 0,
          type: 'combo',
          prices: [{ dish_price: item.combo.combo_price }],
        });
      }
      itemsMap.get(key).total_ordered += qty;
    }
  }

  // Sort by total quantity descending
  let sortedItems = Array.from(itemsMap.values()).sort((a, b) => b.total_ordered - a.total_ordered);

  // Lọc theo danh mục nếu có
  if (categoryName) {
    const rawLower = categoryName.trim().toLowerCase();
    if (rawLower === 'combo') {
      sortedItems = sortedItems.filter((item) => item.type === 'combo');
    } else {
      const normCat = normalizeCategory(categoryName);
      sortedItems = sortedItems.filter((item) => {
        if (item.type === 'combo') return false;
        if (normCat) return normalizeCategory(item.category) === normCat;
        return (item.category || '').toLowerCase().includes(rawLower);
      });
    }
  }

  const finalItems = sortedItems.slice(0, limit);

  // Tính avg_rating từ review_item_ratings của các đánh giá hợp lệ
  const visibleReviews = await prisma.shopReview.findMany({
    where: { NOT: { is_visible: false } },
    select: { review_id: true },
  });
  const visibleReviewIds = visibleReviews.map((r) => r.review_id);

  const reviewRatings =
    visibleReviewIds.length > 0
      ? await prisma.reviewItemRating.groupBy({
          by: ['dish_name'],
          where: { review_id: { in: visibleReviewIds } },
          _avg: {
            rating_star: true,
          },
        })
      : [];

  const ratingMap = new Map<string, number>();
  reviewRatings.forEach((r) => {
    if (r.dish_name && r._avg.rating_star != null) {
      ratingMap.set(r.dish_name.trim().toLowerCase(), Number(Number(r._avg.rating_star).toFixed(1)));
    }
  });

  return finalItems.map((item) => ({
    ...item,
    image: item.image || null,
    avg_rating: ratingMap.get((item.dish_name || '').trim().toLowerCase()) || 0,
  }));
};

// Lấy danh sách món hay đặt lại của người dùng
export const getReorderFavorites = async (userId: number, limit = 6) => {
  const orders = await prisma.order.findMany({
    where: {
      user_id: userId,
      order_status: 'completed',
    },
    include: {
      items: {
        include: {
          dish_price: {
            include: {
              dish: {
                include: {
                  prices: { include: { size: true, crust: true } },
                  category: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  const map = new Map<number, any>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const dish = item.dish_price?.dish;
      if (!dish) return;
      const isHalfHalfShell = dish.dish_id === 65 || dish.dish_name?.toLowerCase().includes('half');
      // Bỏ món tặng kèm trong combo [62, 63, 64] và các món thường đã ngừng bán
      if (COMBO_ONLY_BREAD_IDS.has(dish.dish_id)) return;
      if (!isHalfHalfShell && !dish.dish_status) return;

      const sortedPrices = isHalfHalfShell ? dish.prices : formatSortedPrices(dish.prices);
      if (!isHalfHalfShell && sortedPrices.length === 0) return;

      const id = dish.dish_id;
      if (!map.has(id)) {
        map.set(id, {
          dish_id: id,
          dish_name: dish.dish_name,
          ingredient: dish.ingredient || '',
          dish_type: dish.dish_type || 'man',
          category: dish.category?.category_name || '',
          image: dish.image || '',
          is_half_half: isHalfHalfShell,
          order_count: 0,
          last_ordered: order.created_at,
          prices: sortedPrices,
        });
      }
      map.get(id).order_count += item.quantity || 1;

      const current = map.get(id);
      if (order.created_at && (!current.last_ordered || order.created_at > current.last_ordered)) {
        current.last_ordered = order.created_at;
      }
    });
  });

  const finalItems = Array.from(map.values())
    .sort((a, b) => b.order_count - a.order_count)
    .slice(0, limit);

  const needsFallback = finalItems.some(
    (item) => item.dish_name?.toLowerCase().includes('half') && !item.image
  );
  if (needsFallback) {
    const firstPizza = await prisma.dish.findFirst({
      where: {
        category: { category_name: { contains: 'Pizza', mode: 'insensitive' } },
        image: { not: null },
        dish_status: true,
        NOT: { dish_name: { contains: 'half', mode: 'insensitive' } },
      },
      select: { image: true },
    });
    if (firstPizza?.image) {
      finalItems.forEach((item) => {
        if (item.dish_name?.toLowerCase().includes('half') && !item.image) {
          item.image = firstPizza.image;
        }
      });
    }
  }

  return finalItems;
};

// Lấy danh sách món thường được đặt cùng (dự phòng khi chưa đủ ngưỡng số đơn gọi chung)
export const getFrequentlyOrderedTogether = async (dishIds: number[], limit = 4) => {
  const itemsWithTargetDishes = await prisma.orderItem.findMany({
    where: {
      order: { order_status: { not: 'cancelled' } },
      dish_price: {
        dish_id: { in: dishIds },
      },
    },
    select: { order_id: true },
  });

  const orderIds = [
    ...new Set(itemsWithTargetDishes.map((i) => i.order_id).filter((id): id is number => id !== null)),
  ];

  if (orderIds.length === 0) return [];

  const excludedIds = [...new Set([...dishIds, ...EXCLUDED_DISH_IDS])];

  const coOrderedItems = await prisma.orderItem.findMany({
    where: {
      order_id: { in: orderIds },
      order: { order_status: { not: 'cancelled' } },
      dish_price: {
        dish_id: { notIn: excludedIds },
        dish: { dish_status: true },
      },
    },
    include: {
      dish_price: {
        include: {
          dish: {
            include: {
              category: true,
              prices: { include: { size: true, crust: true } },
            },
          },
        },
      },
    },
  });

  const map = new Map<number, any>();

  coOrderedItems.forEach((item) => {
    const dp = item.dish_price;
    const dish = dp?.dish;
    if (!dish || !dp || !dish.dish_status || EXCLUDED_DISH_IDS.has(dish.dish_id)) return;
    const sortedPrices = formatSortedPrices(dish.prices);
    const baseVariant = sortedPrices[0];
    if (!baseVariant) return;

    const id = dish.dish_id;
    if (!map.has(id)) {
      map.set(id, {
        dish_id: id,
        dish_name: dish.dish_name,
        category: dish.category?.category_name || '',
        ingredient: dish.ingredient || '',
        dish_type: dish.dish_type || 'man',
        image: dish.image || '',
        co_order_count: 0,
        price: baseVariant.dish_price,
        dish_price_id: baseVariant.dish_price_id,
        prices: sortedPrices,
      });
    }
    map.get(id).co_order_count += item.quantity || 1;
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
    select: { review_id: true },
  });
  const visibleReviewIds = visibleReviews.map((r) => r.review_id);

  if (visibleReviewIds.length === 0) {
    return [];
  }

  const ratings = await prisma.reviewItemRating.groupBy({
    by: ['dish_name'],
    where: {
      review_id: { in: visibleReviewIds },
    },
    _avg: { rating_star: true },
    _count: { rating_star: true },
  });

  // Chỉ lấy món có đánh giá thực tế cao (>= 4.0 sao, tối thiểu 1 đánh giá)
  const filtered = ratings
    .filter((r) => (r._count.rating_star || 0) >= 1 && (r._avg.rating_star || 0) >= 4)
    .sort((a, b) => {
      const avgDiff = (b._avg.rating_star || 0) - (a._avg.rating_star || 0);
      if (avgDiff !== 0) return avgDiff;
      return (b._count.rating_star || 0) - (a._count.rating_star || 0);
    });

  const dishNames = filtered.map((r) => r.dish_name);
  if (dishNames.length === 0) {
    return [];
  }

  const normCat = categoryName ? normalizeCategory(categoryName) || categoryName : undefined;
  const dishWhere: any = {
    dish_name: { in: dishNames },
    dish_status: true,
    dish_id: { notIn: [...EXCLUDED_DISH_IDS] },
  };
  if (normCat) {
    dishWhere.category = { category_name: { contains: normCat, mode: 'insensitive' } };
  }

  const [dishes, combos] = await Promise.all([
    prisma.dish.findMany({
      where: dishWhere,
      include: {
        prices: { include: { size: true, crust: true } },
        category: true,
      },
    }),
    normCat && categoryName?.trim().toLowerCase() !== 'combo'
      ? Promise.resolve([])
      : prisma.combo.findMany({
          where: { combo_name: { in: dishNames }, is_active: true },
        }),
  ]);

  const itemMap = new Map<string, any>();
  dishes.forEach((d) => {
    const sortedPrices = formatSortedPrices(d.prices);
    if (sortedPrices.length === 0) return;
    itemMap.set(d.dish_name, {
      dish_id: d.dish_id,
      dish_name: d.dish_name,
      category: d.category?.category_name || '',
      ingredient: d.ingredient || '',
      dish_type: d.dish_type || 'man',
      image: d.image || null,
      type: 'dish',
      prices: sortedPrices,
    });
  });

  combos.forEach((c) =>
    itemMap.set(c.combo_name, {
      dish_id: c.combo_id,
      dish_name: c.combo_name,
      category: 'Combo',
      ingredient: c.description || '',
      dish_type: 'man',
      image: c.image_combo || null,
      type: 'combo',
      prices: [{ dish_price: c.combo_price }],
    })
  );

  const result: any[] = filtered
    .map((r) => {
      const item = itemMap.get(r.dish_name);
      if (!item) return null;
      return {
        dish_id: item.dish_id,
        dish_name: r.dish_name,
        category: item.category,
        ingredient: item.ingredient,
        dish_type: item.dish_type,
        image: item.image,
        avg_rating: Number(Number(r._avg.rating_star || 0).toFixed(1)),
        review_count: r._count.rating_star || 0,
        type: item.type,
        prices: item.prices,
      };
    })
    .filter(Boolean);

  return result.slice(0, limit);
};

// Goi y mon moi tuong tu dua tren lich su mua hang (mon lien quan va combo)
export const getHistoryBasedSuggestions = async (userId: number, limit = 6) => {
  const orders = await prisma.order.findMany({
    where: {
      user_id: userId,
      order_status: 'completed',
    },
    include: {
      items: {
        include: {
          dish_price: {
            include: {
              dish: {
                include: { category: true },
              },
            },
          },
          halves: {
            include: {
              dish: {
                include: { category: true },
              },
            },
          },
          combos: {
            include: {
              dish_price: {
                include: {
                  dish: {
                    include: { category: true },
                  },
                },
              },
              halves: {
                include: {
                  dish: {
                    include: { category: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const orderedDishIds = new Set<number>();
  const dishOrderCounts = new Map<number, number>();
  const dishNameMap = new Map<number, string>();
  const orderedFoodTypes: string[] = [];

  const recordOrderedDish = (dish: any, qty: number) => {
    if (!dish || EXCLUDED_DISH_IDS.has(dish.dish_id)) return;
    if (dish.dish_name?.toLowerCase().includes('half')) return;
    const dishId = dish.dish_id;
    orderedDishIds.add(dishId);
    const normCat = normalizeCategory(dish.category?.category_name);
    // Chỉ lấy món ăn (không lấy nước uống) làm mỏ neo khẩu vị chính
    if (normCat !== 'Drink') {
      dishOrderCounts.set(dishId, (dishOrderCounts.get(dishId) || 0) + qty);
      orderedFoodTypes.push(dish.dish_type || 'man');
    }
    if (dish.dish_name) {
      dishNameMap.set(dishId, dish.dish_name);
    }
  };

  for (const order of orders) {
    for (const item of order.items) {
      const qty = item.quantity || 1;
      if (item.is_half_half && item.halves?.length > 0) {
        for (const h of item.halves) {
          recordOrderedDish(h.dish, qty);
        }
      } else if (item.dish_price?.dish) {
        recordOrderedDish(item.dish_price.dish, qty);
      }

      if (item.combos?.length > 0) {
        for (const cSel of item.combos) {
          if (cSel.halves?.length > 0) {
            for (const h of cSel.halves) recordOrderedDish(h.dish, qty);
          } else if (cSel.dish_price?.dish) {
            recordOrderedDish(cSel.dish_price.dish, qty);
          }
        }
      }
    }
  }

  const isStrictlyVegUser =
    orderedFoodTypes.length > 0 && orderedFoodTypes.every((t) => t === 'chay');

  const topOrderedEntries = Array.from(dishOrderCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topOrderedDishes = topOrderedEntries.map((entry) => entry[0]);
  const maxAnchorOrders = topOrderedEntries[0]?.[1] || 1;

  let allSuggestions: any[] = [];

  // 1. Lay mon lien quan dua tren nguyen lieu & khau vi (Content-Based Cosine Similarity co trong so tan suat dat mon)
  for (const [dishId, anchorQty] of topOrderedEntries) {
    try {
      const anchorName = dishNameMap.get(dishId);
      const freqWeight = 0.88 + 0.12 * (anchorQty / maxAnchorOrders);
      const similarDishes = await getSimilarDishes(dishId, 10);
      allSuggestions = allSuggestions.concat(
        similarDishes
          .filter((s) => (!isStrictlyVegUser ? true : s.dish_type === 'chay'))
          .map((s) => ({
            ...s,
            similarity_score: Math.round(s.similarity_score * freqWeight * 1000) / 1000,
            match_reasons: anchorName ? [`Vì bạn đã đặt ${anchorName}`] : s.match_reasons,
          }))
      );
    } catch {
      // Ignore errors for individual dish
    }
  }

  const uniqueSuggestions = new Map<string, any>();
  for (const suggestion of allSuggestions) {
    if (!orderedDishIds.has(suggestion.dish_id)) {
      const key = `dish_${suggestion.dish_id}`;
      if (
        !uniqueSuggestions.has(key) ||
        suggestion.similarity_score > uniqueSuggestions.get(key).similarity_score
      ) {
        uniqueSuggestions.set(key, { ...suggestion, type: 'dish' });
      }
    }
  }

  // 2. Lay them Combo phu hop chua cac mon khach thich hoac mon tuong tu
  if (topOrderedDishes.length > 0) {
    const candidateDishIds = Array.from(
      new Set([
        ...topOrderedDishes,
        ...Array.from(uniqueSuggestions.values()).map((s) => s.dish_id),
      ])
    );
    const relatedCombos = await prisma.combo.findMany({
      where: {
        is_active: true,
        groups: {
          some: {
            combo_items: {
              some: {
                dish_price: {
                  dish_id: { in: candidateDishIds },
                },
              },
            },
          },
        },
      },
      include: {
        groups: {
          include: {
            combo_items: {
              include: {
                dish_price: {
                  include: {
                    dish: { include: { category: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    let addedCombos = 0;
    for (const combo of relatedCombos) {
      if (addedCombos >= 2) break;
      if (isStrictlyVegUser) {
        const vegCompatible = combo.groups.every((g) =>
          g.combo_items.some((ci) => {
            const d = ci.dish_price?.dish;
            if (!d) return false;
            const isDrink = normalizeCategory(d.category?.category_name || d.dish_name) === 'Drink';
            return d.dish_type === 'chay' || isDrink;
          })
        );
        if (!vegCompatible) continue;
      }

      uniqueSuggestions.set(`combo_${combo.combo_id}`, {
        dish_id: combo.combo_id,
        dish_name: combo.combo_name,
        category: 'Combo',
        ingredient: combo.description || '',
        image: combo.image_combo || null,
        dish_type: isStrictlyVegUser ? 'chay' : 'man',
        prices: [{ dish_price: combo.combo_price }],
        similarity_score: 0.92,
        type: 'combo',
        match_reasons: ['Combo tiết kiệm hợp khẩu vị của bạn'],
      });
      addedCombos++;
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

  const validCartIds = [
    ...new Set(dishIds.map(Number).filter((id) => !isNaN(id) && !EXCLUDED_DISH_IDS.has(id))),
  ];
  if (validCartIds.length === 0) return [];

  const [activeCombos, garlicBreadRef] = await Promise.all([
    prisma.combo.findMany({
      where: { is_active: true },
      include: {
        groups: {
          include: {
            combo_items: {
              include: {
                dish_price: {
                  include: {
                    dish: { include: { category: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.dish.findFirst({
      where: { dish_id: 44, dish_status: true },
      include: { prices: true },
    }),
  ]);

  // Giá bán lẻ chuẩn của 1 phần Bánh mì bơ tỏi (4 miếng = 49.000đ) để quy đổi phần tặng kèm trong Combo
  const retailGarlicBread4Pcs =
    garlicBreadRef?.prices?.find((p) => Number(p.dish_price) > 0)?.dish_price || 49000;

  const suggestions: any[] = [];

  for (const combo of activeCombos) {
    const matchedDishes: string[] = [];
    const matchedDishIds = new Set<number>();
    let matchedFoodCount = 0;

    for (const group of combo.groups) {
      for (const item of group.combo_items) {
        const dish = item.dish_price?.dish;
        if (!dish || EXCLUDED_DISH_IDS.has(dish.dish_id) || !dish.dish_status) continue;
        if (validCartIds.includes(dish.dish_id)) {
          if (!matchedDishIds.has(dish.dish_id)) {
            matchedDishIds.add(dish.dish_id);
            matchedDishes.push(dish.dish_name);
            const normCat = normalizeCategory(dish.category?.category_name || dish.dish_name);
            if (normCat !== 'Drink') {
              matchedFoodCount++;
            }
          }
        }
      }
    }

    // Phải khớp ít nhất 1 món ăn chính/phụ trong giỏ (hoặc khớp >= 2 món), tránh gợi ý Combo 735k khi giỏ chỉ có 1 lon nước ngọt
    if (matchedDishIds.size === 0) continue;
    if (matchedFoodCount === 0 && matchedDishIds.size < 2) continue;

    let totalBundlePrice = 0;
    const groupSummaries: string[] = [];

    for (const group of combo.groups) {
      groupSummaries.push(group.group_name);
      const gLower = group.group_name.toLowerCase();

      // Quy đổi giá trị bán lẻ thực tế của Bánh mì bơ tỏi đi kèm trong Combo (2 / 4 / 8 miếng)
      if (gLower.includes('garlic bread') || gLower.includes('garilc bread') || gLower.includes('gralic bread')) {
        if (/\b8\s*pieces\b/i.test(gLower)) {
          totalBundlePrice += retailGarlicBread4Pcs * 2;
        } else if (/\b2\s*pieces\b/i.test(gLower)) {
          totalBundlePrice += Math.round((retailGarlicBread4Pcs * 0.5) / 1000) * 1000;
        } else {
          totalBundlePrice += retailGarlicBread4Pcs;
        }
        continue;
      }

      const isFree = gLower.includes('free') || gLower.includes('tặng');
      if (isFree) continue;

      let selectCount = group.min_select || 1;
      // Xử lý nhóm "Choose Pepsi 4 can or 1 Pepsi 1,5L" (min_select = 1 nhưng phương án lon là 4 lon)
      const isFourCanOption = /\b4\s*can\b/i.test(gLower) && selectCount === 1;

      const matchedItem = group.combo_items.find(
        (i) =>
          i.dish_price?.dish &&
          validCartIds.includes(i.dish_price.dish.dish_id) &&
          (i.dish_price.dish_price || 0) > 0
      );

      if (matchedItem && matchedItem.dish_price?.dish_price) {
        const unitP = Number(matchedItem.dish_price.dish_price);
        const itemNameLower = (matchedItem.dish_price.dish?.dish_name || '').toLowerCase();
        const mult = isFourCanOption && !itemNameLower.includes('1,5') && !itemNameLower.includes('1.5') ? 4 : selectCount;
        totalBundlePrice += unitP * mult;
      } else {
        const validItemValues = group.combo_items
          .map((i) => {
            const p = Number(i.dish_price?.dish_price) || 0;
            if (p <= 0) return 0;
            const dName = (i.dish_price?.dish?.dish_name || '').toLowerCase();
            if (isFourCanOption && !dName.includes('1,5') && !dName.includes('1.5')) {
              return p * 4;
            }
            return p * selectCount;
          })
          .filter((v) => v > 0);

        if (validItemValues.length > 0) {
          const avgGroupTotal =
            validItemValues.reduce((a, b) => a + b, 0) / validItemValues.length;
          totalBundlePrice += Math.round(avgGroupTotal / 1000) * 1000;
        }
      }
    }

    const rawSavings = totalBundlePrice - combo.combo_price;
    if (rawSavings <= 0) continue;

    const savings = Math.round(rawSavings / 1000) * 1000;
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
      groups_summary: groupSummaries,
    });
  }

  // Nếu có combo khớp từ 2 món trở lên trong giỏ hàng, ưu tiên giữ các combo này
  const maxMatched = Math.max(...suggestions.map((s) => s.matched_count), 0);
  let filteredSuggestions = suggestions;
  if (maxMatched >= 2) {
    filteredSuggestions = suggestions.filter((s) => s.matched_count >= 2);
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
