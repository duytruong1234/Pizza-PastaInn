// Content-based Filtering Service — Thuật toán gợi ý món ăn tự xây dựng
// Sử dụng Cosine Similarity để so khớp vector sở thích khách với vector đặc trưng món ăn

import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

// ─── Định nghĩa các chiều vector đặc trưng ──────────────────────────────────

// Mỗi món ăn được biểu diễn bằng 1 vector gồm các nhóm feature:
// [category(5)] [taste(7)] [price(1)] [rating(1)] = 14 chiều

// Các nhóm thành phần (taste features)
// GĐ0 (11/10/2026): bỏ 'pepper' (khớp nhầm "Green Pepper", "Pepperoni" → 14/18 món bị gán cay sai) và 'tiêu';
// thêm 'chilli', 'tabasco' (Hot Pizza dùng "Chilli Powder", "Tabasco Sauce"); thêm 'saugage' (lỗi chính tả có
// trong dữ liệu Napolitan), 'wing'; thêm rau củ 'broccoli', 'carrot', 'cabbage', 'vegetable'.
const TASTE_KEYWORDS: Record<string, string[]> = {
  spicy:    ['chili', 'chilli', 'hot', 'spicy', 'tabasco', 'jalapeño', 'jalapeno', 'kim chi', 'cay', 'ớt'],
  cheesy:   ['cheese', 'mozzarella', 'phô mai', 'parmesan', 'parmersan', 'cheddar'],
  seafood:  ['tuna', 'shrimp', 'squid', 'fish', 'tôm', 'mực', 'cá', 'hải sản', 'salmon'],
  meat:     ['beef', 'pork', 'ham', 'pepperoni', 'bacon', 'sausage', 'saugage', 'chicken', 'wing', 'bò', 'heo', 'gà', 'xúc xích', 'beefsteak'],
  veggie:   ['mushroom', 'onion', 'olive', 'corn', 'tomato', 'broccoli', 'carrot', 'cabbage', 'vegetable', 'nấm', 'hành', 'ô liu', 'bắp', 'cà chua', 'green pepper', 'salad', 'lettuce'],
  sweet:    ['pineapple', 'honey', 'dứa', 'mật ong', 'bbq', 'teriyaki', 'hawaiian', 'sugar', 'ngọt', 'đường', 'juice', 'pepsi', '7 up', '7up', 'mirinda', 'sting', 'nước ngọt'],
  creamy:   ['cream', 'mayo', 'mayonnaise', 'kem', 'béchamel', 'alfredo', 'carbonara', 'pesto'],
};

// Cụm từ trung tính: bị che đi trước khi so khớp từ đơn để không sinh nhãn sai
// (vd "Tomato sauce" của Meat Spaghetti không làm món thành "rau củ"; "Olive Oil" chỉ là dầu trộn salad).
const NEUTRAL_PHRASES = ['tomato sauce', 'tomato souce', 'olive oil'];

// ─── So khớp từ khóa theo ranh giới từ (GĐ0) ────────────────────────────────

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const keywordRegexCache = new Map<string, RegExp>();
/** Regex khớp nguyên từ/cụm từ (Unicode): "ham" không khớp "hamburger", "cá" không khớp "các" */
function keywordRegex(kw: string, global = false): RegExp {
  const key = `${global ? 'g' : ''}|${kw}`;
  let re = keywordRegexCache.get(key);
  if (!re) {
    re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(kw.normalize('NFC').toLowerCase())}(?![\\p{L}\\p{N}])`, global ? 'giu' : 'iu');
    keywordRegexCache.set(key, re);
  }
  return re;
}

// Cụm nhiều từ (của mọi nhóm + cụm trung tính), dài trước — được che khi so khớp từ đơn
const MULTIWORD_PHRASES = [
  ...new Set([...Object.values(TASTE_KEYWORDS).flat().filter(k => k.includes(' ')), ...NEUTRAL_PHRASES]),
].sort((a, b) => b.length - a.length);

/**
 * Trả về các từ khóa khớp cho từng nhóm khẩu vị.
 * Cụm từ ("green pepper") được so trên văn bản gốc; từ đơn được so trên văn bản đã che các cụm từ,
 * nên "green pepper" không bao giờ bị tính thêm là "pepper".
 */
export function matchTasteKeywords(text: string): Record<string, string[]> {
  const original = (text || '').normalize('NFC').toLowerCase();
  let masked = original;
  for (const phrase of MULTIWORD_PHRASES) masked = masked.replace(keywordRegex(phrase, true), ' ');

  const result: Record<string, string[]> = {};
  for (const [taste, keywords] of Object.entries(TASTE_KEYWORDS)) {
    result[taste] = keywords.filter(kw => keywordRegex(kw).test(kw.includes(' ') ? original : masked));
  }
  return result;
}

// Chuẩn hóa tên danh mục tương ứng với CSDL
export function normalizeCategory(cat?: string | null): string | null {
  if (!cat) return null;
  const lower = cat.normalize('NFC').toLowerCase().trim();
  if (lower === 'combo' || /\bcombo\b/iu.test(lower)) return null;
  if (
    lower.includes('drink') ||
    lower.includes('nước') ||
    lower.includes('nuoc') ||
    lower.includes('đồ uống') ||
    lower.includes('do uong') ||
    lower.includes('bia') ||
    lower.includes('juice') ||
    lower.includes('soda') ||
    lower.includes('pepsi') ||
    lower.includes('sting') ||
    lower.includes('aquafina')
  ) {
    return 'Drink';
  }
  if (lower.includes('pizza')) return 'Pizza';
  if (
    lower.includes('spaghetti') ||
    lower.includes('pasta') ||
    /(?<![\p{L}\p{N}])(mì|mi\s*y)(?![\p{L}\p{N}])/iu.test(lower)
  ) {
    return 'Spaghetti';
  }
  if (
    lower.includes('gratin') ||
    lower.includes('grantin') ||
    lower.includes('risotto') ||
    lower.includes('forno') ||
    lower.includes('đút lò') ||
    /(?<![\p{L}\p{N}])(cơm|com(?:\s*y)?)(?![\p{L}\p{N}])/iu.test(lower)
  ) {
    return 'Gratin / Risotto';
  }
  if (lower.includes('salad') || lower.includes('side') || lower.includes('khai vị') || lower.includes('món phụ')) {
    return 'Salad / Side Dish';
  }
  return null;
}

// Tên các chiều trong vector (khớp chính xác với database)
const CATEGORIES = ['Pizza', 'Gratin / Risotto', 'Spaghetti', 'Salad / Side Dish', 'Drink'];
const TASTE_NAMES = Object.keys(TASTE_KEYWORDS); // spicy, cheesy, seafood, meat, veggie, sweet, creamy

// Tổng chiều vector = 5 (category) + 7 (taste) + 1 (price) + 1 (rating) = 14
const VECTOR_SIZE = CATEGORIES.length + TASTE_NAMES.length + 2;

// ─── Cache dữ liệu món ăn ───────────────────────────────────────────────────

export interface DishFeature {
  dish_id: number;
  dish_name: string;
  category: string;
  ingredient: string;
  image: string | null;
  min_price: number;
  max_price: number;
  avg_rating: number;
  review_count: number;
  dish_type: string;
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
  const normDishCat = normalizeCategory(dish.category);
  for (const cat of CATEGORIES) {
    vector.push(normDishCat === cat ? 1.0 : 0.0);
  }

  // 2. Taste features — Keyword matching theo ranh giới từ (7 chiều)
  const matched = matchTasteKeywords(`${dish.dish_name} ${dish.ingredient}`);
  for (const tasteName of TASTE_NAMES) {
    // Đếm số keyword khớp, normalize về [0, 1]
    const matchCount = matched[tasteName].length;
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
  const normUserCat = normalizeCategory(criteria.category);
  for (const cat of CATEGORIES) {
    if (normUserCat) {
      vector.push(normUserCat === cat ? 1.0 : 0.0);
    } else if (criteria.category) {
      // Fuzzy match tên category nếu normalizeCategory không nhận dạng được
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
 * Thuật toán 1: Lọc dựa trên nội dung (Content-Based Filtering)
 * Cơ sở học thuật:
 *   - Gerard Salton, Anita Wong, Chung-Shu Yang (1975), "A Vector Space Model for Automatic Indexing",
 *     Communications of the ACM, Vol. 18, No. 11, pp. 613–620.
 *   - Charu C. Aggarwal (2016), "Recommender Systems: The Textbook", Springer, Chapter 4.
 * Công thức gốc:
 *   sim(A, B) = cos(θ) = (A · B) / (||A|| × ||B||)
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
  dish_type: string;
  prices: any[];
  similarity_score: number;    // Diem Cosine Similarity
  match_reasons: string[];     // Ly do goi y
}

const EXCLUDED_DISH_IDS = new Set([62, 63, 64, 65]);

const AVOID_INGREDIENT_SYNONYMS: Record<string, string[]> = {
  'tôm': ['shrimp', 'srimp', 'tôm'],
  'mực': ['squid', 'mực'],
  'hải sản': ['shrimp', 'srimp', 'squid', 'tuna', 'seafood', 'fish', 'salmon', 'hải sản', 'tôm', 'mực', 'cá'],
  'cá': ['tuna', 'fish', 'salmon', 'cá'],
  'cá ngừ': ['tuna', 'cá ngừ'],
  'bò': ['beef', 'beefsteak', 'beefteak', 'bò'],
  'thịt bò': ['beef', 'beefsteak', 'beefteak', 'bò'],
  'gà': ['chicken', 'chiken', 'wing', 'gà'],
  'thịt gà': ['chicken', 'chiken', 'wing', 'gà'],
  'heo': ['pork', 'ham', 'bacon', 'heo'],
  'thịt nguội': ['ham', 'thịt nguội'],
  'xông khói': ['bacon', 'xông khói'],
  'ba rọi': ['bacon', 'ba rọi'],
  'xúc xích': ['pepperoni', 'sausage', 'saugage', 'gaugage', 'xúc xích'],
  'nấm': ['mushroom', 'mushrooms', 'nấm'],
  'hành': ['onion', 'hành'],
  'ớt chuông': ['green pepper', 'green paper', 'ớt chuông'],
  'ớt': ['chili', 'chilli', 'tabasco', 'jalapeno', 'jalapeño', 'kim chi', 'ớt'],
  'cay': ['chili', 'chilli', 'tabasco', 'jalapeno', 'jalapeño', 'kim chi', 'hot', 'spicy', 'cay'],
  'cà chua': ['tomato', 'tomatoes', 'cà chua'],
  'phô mai': ['cheese', 'mozzarella', 'parmesan', 'parmersan', 'cheddar', 'phô mai'],
  'dứa': ['pineapple', 'dứa'],
  'thơm': ['pineapple', 'thơm'],
  'ô liu': ['olive', 'olives', 'ô liu'],
  'khoai lang': ['sweet potato', 'khoai lang'],
  'khoai tây': ['potato', 'french fries', 'khoai tây'],
  'bắp': ['corn', 'bắp'],
  'ngô': ['corn', 'ngô'],
  'kem': ['cream', 'kem'],
  'sốt kem': ['cream', 'sốt kem'],
  'mayo': ['mayonnaise', 'mayo'],
  'mayonnaise': ['mayonnaise', 'mayo'],
};

function dishContainsAvoidTerm(dish: { dish_name: string; ingredient: string }, rawAvoid: string): boolean {
  const normAvoid = (rawAvoid || '').normalize('NFC').toLowerCase().trim();
  if (!normAvoid) return false;

  let text = `${dish.dish_name || ''} ${dish.ingredient || ''}`.normalize('NFC').toLowerCase();
  if (normAvoid === 'khoai tây' || normAvoid === 'potato') {
    text = text.replace(/sweet\s+potato/gi, ' ');
  }
  if (normAvoid === 'ớt') {
    text = text.replace(/ớt\s+chuông/giu, ' ').replace(/green\s+p(epper|aper)/gi, ' ');
  }

  const expanded = AVOID_INGREDIENT_SYNONYMS[normAvoid] || [normAvoid];
  return expanded.some(term => keywordRegex(term).test(text));
}

// ─── Load và vector hóa tất cả món ăn ───────────────────────────────────────

export async function loadDishFeatures(): Promise<DishFeature[]> {
  // Kiểm tra cache
  if (dishFeaturesCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return dishFeaturesCache;
  }

  // Load dishes từ database (loại trừ các mã món tặng kèm/vỏ Half-Half không bán lẻ)
  const rawDishes = await prisma.dish.findMany({
    where: { dish_status: true },
    include: {
      prices: { include: { size: true, crust: true } },
      category: true
    }
  });

  const dishes = rawDishes.filter(d => {
    if (EXCLUDED_DISH_IDS.has(d.dish_id)) return false;
    if ((d.dish_name || '').toLowerCase().includes('half')) return false;
    return d.prices.some(p => Number(p.dish_price) > 0);
  });

  // Load ratings theo dish_id (ánh xạ dish_name -> dish_id, chỉ đánh giá không bị ẩn)
  const rawRatings = await prisma.reviewItemRating.findMany({
    where: { review: { is_visible: { not: false } } },
    select: { dish_name: true, rating_star: true },
  });
  const dishNameMap = new Map<string, number>();
  for (const d of dishes) {
    if (d.dish_name) dishNameMap.set(d.dish_name.trim().toLowerCase(), d.dish_id);
  }
  const ratingAgg = new Map<number, { sum: number; count: number }>();
  for (const r of rawRatings) {
    const did = dishNameMap.get((r.dish_name || '').trim().toLowerCase());
    if (!did) continue;
    const cur = ratingAgg.get(did) || { sum: 0, count: 0 };
    cur.sum += Number(r.rating_star) || 0;
    cur.count += 1;
    ratingAgg.set(did, cur);
  }
  const ratingMap = new Map<number, { avg: number; count: number }>(
    [...ratingAgg].map(([id, v]) => [id, { avg: v.count > 0 ? v.sum / v.count : 0, count: v.count }])
  );

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
    const sortedValidPrices = [...d.prices]
      .filter(p => Number(p.dish_price) > 0)
      .sort((a, b) => Number(a.dish_price) - Number(b.dish_price));
    const priceValues = sortedValidPrices.map(p => Number(p.dish_price));
    const minP = priceValues.length > 0 ? priceValues[0] : 0;
    const maxP = priceValues.length > 0 ? priceValues[priceValues.length - 1] : 0;
    const avgP = priceValues.length > 0 ? priceValues.reduce((a, b) => a + b, 0) / priceValues.length : 0;
    const rating = ratingMap.get(d.dish_id);

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
      dish_type: (d as any).dish_type || 'man',
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
      prices: sortedValidPrices.map((p: any) => ({
        dish_price_id: p.dish_price_id,
        size_id: p.size_id ?? null,
        crust_id: p.crust_id ?? null,
        size_name: p.size?.size_name || '',
        crust_name: p.crust?.crust_name || '',
        dish_price: Number(p.dish_price)
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

  // Bước 2.5: Lọc cứng theo Danh mục (nếu khách yêu cầu danh mục cụ thể)
  if (criteria.category) {
    const targetCat = normalizeCategory(criteria.category);
    if (targetCat) {
      const catMatches = results.filter(r => normalizeCategory(r.dish.category) === targetCat);
      if (catMatches.length > 0) {
        results = catMatches;
      }
    }
  }

  // Bước 3: Lọc theo ngân sách (nếu có)
  if (criteria.max_budget) {
    results = results.filter(r => r.dish.min_price <= criteria.max_budget!);
  }

  // Bước 3.5: Lọc cứng các nhóm khẩu vị khách muốn tránh (avoid_tastes)
  if (criteria.avoid_tastes && criteria.avoid_tastes.length > 0) {
    results = results.filter(r => {
      const matched = matchTasteKeywords(`${r.dish.dish_name} ${r.dish.ingredient}`);
      return !criteria.avoid_tastes!.some(avoidTaste => (matched[avoidTaste] || []).length > 0);
    });
  }

  // Bước 4: Lọc theo thành phần không muốn (hỗ trợ song ngữ Việt - Anh)
  if (criteria.avoid_ingredients && criteria.avoid_ingredients.length > 0) {
    results = results.filter(r => {
      return !criteria.avoid_ingredients!.some(avoid => dishContainsAvoidTerm(r.dish, avoid));
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
    dish_type: r.dish.dish_type,
    prices: r.dish.prices,
    similarity_score: Math.round(r.score * 1000) / 1000,
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

  // Lý do category
  if (criteria.category) {
    const targetCat = normalizeCategory(criteria.category);
    if (targetCat && normalizeCategory(dish.category) === targetCat) {
      reasons.push(`Thuộc danh mục ${dish.category}`);
    }
  }

  // Lý do taste (cùng bộ so khớp theo ranh giới từ với vector)
  if (criteria.tastes) {
    const matched = matchTasteKeywords(`${dish.dish_name} ${dish.ingredient}`);
    for (const taste of criteria.tastes) {
      if ((matched[taste] || []).length > 0) {
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

  return reasons;
}

// ─── Gợi ý món tương tự (Item-Item Content-Based via Cosine Similarity) ─────

export async function getSimilarDishes(dishId: number, topN: number = 4): Promise<RecommendationResult[]> {
  const dishFeatures = await loadDishFeatures();
  const targetDish = dishFeatures.find(d => d.dish_id === dishId);

  if (!targetDish) return [];

  const results = dishFeatures
    .filter(d => {
      if (d.dish_id === dishId) return false;
      // Neu mon dang xem la mon chay, chi goi y mon chay
      if (targetDish.dish_type === 'chay' && d.dish_type !== 'chay') return false;
      return true;
    })
    .map(dish => {
      const score = cosineSimilarity(targetDish.vector, dish.vector);
      return { dish, score };
    })
    .filter(r => r.score >= 0.35);

  results.sort(
    (a, b) =>
      Math.round(b.score * 1000) - Math.round(a.score * 1000) ||
      b.dish.avg_rating - a.dish.avg_rating ||
      b.dish.review_count - a.dish.review_count
  );

  return results.slice(0, topN).map(r => ({
    dish_id: r.dish.dish_id,
    dish_name: r.dish.dish_name,
    category: r.dish.category,
    ingredient: r.dish.ingredient,
    image: r.dish.image,
    dish_type: r.dish.dish_type,
    prices: r.dish.prices,
    similarity_score: Math.round(r.score * 1000) / 1000,
    match_reasons: [`Cùng phong cách hương vị với ${targetDish.dish_name}`]
  }));
}

// ─── Gợi ý món chay tương tự (Vegetarian Alternatives via Cosine Similarity) ─────
export async function getVegetarianSimilarDishes(dishId: number, topN: number = 3): Promise<RecommendationResult[]> {
  const dishFeatures = await loadDishFeatures();
  const targetDish = dishFeatures.find(d => d.dish_id === dishId);

  if (!targetDish) return [];

  // Lọc chỉ lấy các món chay (khác món hiện tại, loại bỏ đồ uống)
  const vegResults = dishFeatures
    .filter(d => d.dish_id !== dishId && d.dish_type === 'chay' && normalizeCategory(d.category) !== 'Drink')
    .map(dish => {
      const score = cosineSimilarity(targetDish.vector, dish.vector);
      return { dish, score };
    })
    .filter(r => r.score >= 0.4);

  vegResults.sort(
    (a, b) =>
      Math.round(b.score * 1000) - Math.round(a.score * 1000) ||
      b.dish.avg_rating - a.dish.avg_rating ||
      b.dish.review_count - a.dish.review_count
  );

  return vegResults.slice(0, topN).map(r => ({
    dish_id: r.dish.dish_id,
    dish_name: r.dish.dish_name,
    category: r.dish.category,
    ingredient: r.dish.ingredient,
    image: r.dish.image,
    dish_type: r.dish.dish_type,
    prices: r.dish.prices,
    similarity_score: Math.round(r.score * 1000) / 1000,
    match_reasons: [`Món chay thanh đạm hợp vị ${targetDish.dish_name}`]
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
