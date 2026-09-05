// Content-based Filtering Service — Thuật toán gợi ý món ăn tự xây dựng
// Sử dụng Cosine Similarity để so khớp vector sở thích khách với vector đặc trưng món ăn

import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

// ─── Định nghĩa các chiều vector đặc trưng ──────────────────────────────────

// Mỗi món ăn được biểu diễn bằng 1 vector gồm các nhóm feature:
// [category(5)] [taste(7)] [price(1)] [rating(1)] = 14 chiều

// Các nhóm thành phần (taste features)
const TASTE_KEYWORDS: Record<string, string[]> = {
  spicy:    ['chili', 'hot', 'pepper', 'spicy', 'cay', 'ớt', 'tiêu', 'jalapeño'],
  cheesy:   ['cheese', 'mozzarella', 'phô mai', 'parmesan', 'cheddar'],
  seafood:  ['tuna', 'shrimp', 'squid', 'fish', 'tôm', 'mực', 'cá', 'hải sản', 'salmon'],
  meat:     ['beef', 'pork', 'ham', 'pepperoni', 'bacon', 'sausage', 'chicken', 'bò', 'heo', 'gà', 'xúc xích', 'beefsteak'],
  veggie:   ['mushroom', 'onion', 'olive', 'corn', 'tomato', 'nấm', 'hành', 'ô liu', 'bắp', 'cà chua', 'green pepper', 'salad', 'lettuce'],
  sweet:    ['pineapple', 'honey', 'dứa', 'mật ong', 'bbq', 'teriyaki', 'hawaiian', 'kim chi'],
  creamy:   ['cream', 'mayo', 'mayonnaise', 'kem', 'béchamel', 'alfredo', 'carbonara', 'pesto'],
};

// Tên các chiều trong vector
const CATEGORIES = ['Pizza', 'Gratin/Risotto', 'Spaghetti', 'Salad/Side Dish', 'Drink'];
const TASTE_NAMES = Object.keys(TASTE_KEYWORDS); // spicy, cheesy, seafood, meat, veggie, sweet, creamy

// Tổng chiều vector = 5 (category) + 7 (taste) + 1 (price) + 1 (rating) = 14
const VECTOR_SIZE = CATEGORIES.length + TASTE_NAMES.length + 2;

// ─── Cache dữ liệu món ăn ───────────────────────────────────────────────────

interface DishFeature {
  dish_id: number;
  dish_name: string;
  category: string;
  ingredient: string;
  image: string | null;
  min_price: number;
  max_price: number;
  avg_rating: number;
  review_count: number;
  vector: number[];
  prices: any[];
}

let dishFeaturesCache: DishFeature[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // Cache 5 phút

// ─── Hàm vector hóa ─────────────────────────────────────────────────────────

/**
 * Tạo vector đặc trưng cho 1 món ăn
 * Vector = [category_onehot(5), taste_features(7), normalized_price(1), normalized_rating(1)]
 */
function buildDishVector(
  dish: { category: string; ingredient: string; dish_name: string },
  dishPrice: number,
  globalMinPrice: number,
  globalMaxPrice: number,
  avgRating: number
): number[] {
  const vector: number[] = [];

  // 1. Category — One-hot encoding (5 chiều)
  for (const cat of CATEGORIES) {
    vector.push(dish.category === cat ? 1.0 : 0.0);
  }

  // 2. Taste features — Keyword matching (7 chiều)
  const textLower = `${dish.dish_name} ${dish.ingredient}`.toLowerCase();
  for (const tasteName of TASTE_NAMES) {
    const keywords = TASTE_KEYWORDS[tasteName];
    // Đếm số keyword khớp, normalize về [0, 1]
    const matchCount = keywords.filter(kw => textLower.includes(kw.toLowerCase())).length;
    vector.push(Math.min(matchCount / 2, 1.0)); // Tối đa 1.0
  }

  // 3. Normalized price (1 chiều) — Min-Max Normalization đảo ngược: Giá thấp = 1.0, giá cao = 0.0
  const priceRange = globalMaxPrice - globalMinPrice;
  const normalizedPrice = priceRange > 0
    ? 1.0 - (dishPrice - globalMinPrice) / priceRange
    : 0.5;
  vector.push(Math.max(0, Math.min(1, normalizedPrice)));

  // 4. Normalized rating (1 chiều)
  vector.push(avgRating / 5.0); // Rating 0-5 → 0-1

  return vector;
}

/**
 * Tạo vector sở thích của khách hàng từ tiêu chí đã trích xuất
 */
export function buildUserPreferenceVector(criteria: UserCriteria): number[] {
  const vector: number[] = [];

  // 1. Category preference (5 chiều)
  for (const cat of CATEGORIES) {
    if (criteria.category) {
      // Fuzzy match tên category
      const catLower = cat.toLowerCase();
      const prefLower = criteria.category.toLowerCase();
      vector.push(catLower.includes(prefLower) || prefLower.includes(catLower) ? 1.0 : 0.0);
    } else {
      vector.push(0.2); // Không có ưu tiên → weight đều
    }
  }

  // 2. Taste preferences (7 chiều)
  for (const tasteName of TASTE_NAMES) {
    if (criteria.tastes && criteria.tastes.includes(tasteName)) {
      vector.push(1.0); // Khách muốn taste này
    } else if (criteria.avoid_tastes && criteria.avoid_tastes.includes(tasteName)) {
      vector.push(0.0); // Khách KHÔNG muốn taste này
    } else {
      vector.push(0.1); // Trung tính
    }
  }

  // 3. Price preference (1 chiều)
  if (criteria.max_budget) {
    // Budget thấp → muốn giá rẻ → weight cao cho normalized_price
    vector.push(criteria.max_budget <= 200000 ? 0.9 : criteria.max_budget <= 300000 ? 0.5 : 0.2);
  } else {
    vector.push(0.3); // Không quan tâm giá
  }

  // 4. Rating preference (1 chiều) — luôn ưu tiên món ngon
  vector.push(0.7);

  return vector;
}

// ─── Cosine Similarity ──────────────────────────────────────────────────────

/**
 * Tính Cosine Similarity giữa 2 vector
 * Công thức: cos(θ) = (A·B) / (|A| × |B|)
 * Kết quả: -1 (ngược chiều) đến 1 (cùng chiều)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

// ─── Tiêu chí sở thích khách hàng ───────────────────────────────────────────

export interface UserCriteria {
  tastes?: string[];           // ['spicy', 'cheesy', 'meat']
  avoid_tastes?: string[];     // ['seafood']
  category?: string;           // 'pizza', 'spaghetti', 'gratin'
  max_budget?: number;         // 200000
  avoid_ingredients?: string[];// ['tôm', 'hải sản']
  keywords?: string[];         // từ khóa thêm
}

// ─── Kết quả gợi ý ──────────────────────────────────────────────────────────

export interface RecommendationResult {
  dish_id: number;
  dish_name: string;
  category: string;
  ingredient: string;
  image: string | null;
  prices: any[];
  similarity_score: number;    // Điểm Cosine Similarity
  match_reasons: string[];     // Lý do gợi ý
}

// ─── Load và vector hóa tất cả món ăn ───────────────────────────────────────

async function loadDishFeatures(): Promise<DishFeature[]> {
  // Kiểm tra cache
  if (dishFeaturesCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return dishFeaturesCache;
  }

  // Load dishes từ database
  const dishes = await prisma.dish.findMany({
    where: { dish_status: true },
    include: {
      prices: { include: { size: true, crust: true } },
      category: true
    }
  });

  // Load ratings
  const ratings = await prisma.reviewItemRating.groupBy({
    by: ['dish_name'],
    _avg: { rating_star: true },
    _count: { rating_star: true }
  });
  const ratingMap = new Map(ratings.map(r => [r.dish_name, {
    avg: r._avg.rating_star || 0,
    count: r._count.rating_star || 0
  }]));

  // Tìm min/max price toàn bộ menu để normalize
  let globalMinPrice = Infinity;
  let globalMaxPrice = 0;
  for (const d of dishes) {
    for (const p of d.prices) {
      const price = Number(p.dish_price);
      if (price > 0) {
        globalMinPrice = Math.min(globalMinPrice, price);
        globalMaxPrice = Math.max(globalMaxPrice, price);
      }
    }
  }

  // Vector hóa từng món
  dishFeaturesCache = dishes.map(d => {
    const priceValues = d.prices.map(p => Number(p.dish_price)).filter(p => p > 0);
    const minP = priceValues.length > 0 ? Math.min(...priceValues) : 0;
    const maxP = priceValues.length > 0 ? Math.max(...priceValues) : 0;
    const avgP = priceValues.length > 0 ? priceValues.reduce((a, b) => a + b, 0) / priceValues.length : 0;
    const rating = ratingMap.get(d.dish_name);

    return {
      dish_id: d.dish_id,
      dish_name: d.dish_name || '',
      category: d.category?.category_name || '',
      ingredient: d.ingredient || '',
      image: d.image || null,
      min_price: minP,
      max_price: maxP,
      avg_rating: rating?.avg || 0,
      review_count: rating?.count || 0,
      vector: buildDishVector(
        {
          category: d.category?.category_name || '',
          ingredient: d.ingredient || '',
          dish_name: d.dish_name || ''
        },
        avgP || minP,
        globalMinPrice,
        globalMaxPrice,
        rating?.avg || 0
      ),
      prices: d.prices.map((p: any) => ({
        dish_price_id: p.dish_price_id,
        size_name: p.size?.size_name || '',
        crust_name: p.crust?.crust_name || '',
        dish_price: p.dish_price
      }))
    };
  });

  cacheTimestamp = Date.now();
  logger.info(`Content-based: Đã vector hóa ${dishFeaturesCache.length} món ăn (${VECTOR_SIZE} chiều)`);

  return dishFeaturesCache;
}

// ─── Hàm chính: Gợi ý món ăn bằng Content-based Filtering ──────────────────

/**
 * Nhận tiêu chí sở thích từ AI → So khớp vector → Trả danh sách xếp hạng
 */
export async function recommendByContentBased(
  criteria: UserCriteria,
  topN: number = 5
): Promise<RecommendationResult[]> {
  const dishFeatures = await loadDishFeatures();

  // Bước 1: Tạo vector sở thích khách hàng
  const userVector = buildUserPreferenceVector(criteria);

  // Bước 2: Tính Cosine Similarity cho từng món
  let results = dishFeatures.map(dish => {
    const score = cosineSimilarity(userVector, dish.vector);
    return { dish, score };
  });

  // Bước 3: Lọc theo ngân sách (nếu có)
  if (criteria.max_budget) {
    results = results.filter(r => r.dish.min_price <= criteria.max_budget!);
  }

  // Bước 4: Lọc theo thành phần không muốn (nếu có)
  if (criteria.avoid_ingredients && criteria.avoid_ingredients.length > 0) {
    results = results.filter(r => {
      const ingLower = r.dish.ingredient.toLowerCase();
      return !criteria.avoid_ingredients!.some(avoid => ingLower.includes(avoid.toLowerCase()));
    });
  }

  // Bước 5: Sắp xếp theo điểm giảm dần, lấy top N
  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, topN);

  // Bước 6: Tạo lý do gợi ý cho từng món
  return topResults.map(r => ({
    dish_id: r.dish.dish_id,
    dish_name: r.dish.dish_name,
    category: r.dish.category,
    ingredient: r.dish.ingredient,
    image: r.dish.image,
    prices: r.dish.prices,
    similarity_score: Math.round(r.score * 1000) / 1000, // Làm tròn 3 chữ số
    match_reasons: generateMatchReasons(r.dish, criteria, r.score)
  }));
}

// ─── Tạo lý do gợi ý ───────────────────────────────────────────────────────

function generateMatchReasons(
  dish: DishFeature,
  criteria: UserCriteria,
  score: number
): string[] {
  const reasons: string[] = [];
  const ingLower = `${dish.dish_name} ${dish.ingredient}`.toLowerCase();

  // Lý do category
  if (criteria.category) {
    const catLower = dish.category.toLowerCase();
    if (catLower.includes(criteria.category.toLowerCase())) {
      reasons.push(`Thuộc danh mục ${dish.category}`);
    }
  }

  // Lý do taste
  if (criteria.tastes) {
    for (const taste of criteria.tastes) {
      const keywords = TASTE_KEYWORDS[taste] || [];
      if (keywords.some(kw => ingLower.includes(kw.toLowerCase()))) {
        const tasteVi: Record<string, string> = {
          spicy: 'cay', cheesy: 'phô mai', seafood: 'hải sản',
          meat: 'thịt', veggie: 'rau củ', sweet: 'ngọt', creamy: 'béo'
        };
        reasons.push(`Phù hợp khẩu vị: ${tasteVi[taste] || taste}`);
      }
    }
  }

  // Lý do giá
  if (criteria.max_budget && dish.min_price <= criteria.max_budget) {
    reasons.push(`Giá từ ${dish.min_price.toLocaleString('vi-VN')}đ — trong ngân sách`);
  }

  // Lý do rating
  if (dish.avg_rating >= 4) {
    reasons.push(`Đánh giá cao: ${dish.avg_rating.toFixed(1)}/5 sao (${dish.review_count} đánh giá)`);
  }

  // Điểm tương đồng
  reasons.push(`Độ phù hợp: ${(score * 100).toFixed(1)}%`);

  return reasons;
}

// ─── Gợi ý món tương tự (Item-Item Content-Based via Cosine Similarity) ─────

export async function getSimilarDishes(dishId: number, topN: number = 4): Promise<RecommendationResult[]> {
  const dishFeatures = await loadDishFeatures();
  const targetDish = dishFeatures.find(d => d.dish_id === dishId);

  if (!targetDish) return [];

  const results = dishFeatures
    .filter(d => d.dish_id !== dishId)
    .map(dish => {
      const score = cosineSimilarity(targetDish.vector, dish.vector);
      return { dish, score };
    });

  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topN).map(r => ({
    dish_id: r.dish.dish_id,
    dish_name: r.dish.dish_name,
    category: r.dish.category,
    ingredient: r.dish.ingredient,
    image: r.dish.image,
    prices: r.dish.prices,
    similarity_score: Math.round(r.score * 1000) / 1000,
    match_reasons: [
      `Tương đồng với ${targetDish.dish_name}`,
      `Độ tương đồng đặc trưng: ${(r.score * 100).toFixed(1)}%`
    ]
  }));
}

// ─── Export thông tin vector để debug/hiển thị ────────────────────────────────

export function getVectorDimensions(): string[] {
  return [
    ...CATEGORIES.map(c => `category:${c}`),
    ...TASTE_NAMES.map(t => `taste:${t}`),
    'price:normalized',
    'rating:normalized'
  ];
}

export { VECTOR_SIZE, CATEGORIES, TASTE_NAMES, TASTE_KEYWORDS };
