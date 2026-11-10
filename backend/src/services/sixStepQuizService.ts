// Chức năng "LỰA CHỌN PHÙ HỢP CHO BẠN" — Bộ lọc 5 bước (Câu 1 -> Câu 5) + Chấm điểm phần trăm phù hợp (Câu 6)
// Nguyên tắc:
//   - Không tự chọn mặc định cho khách; câu nào khách không chọn thì mặc định KHÔNG LỌC ở câu đó.
//   - Câu 1: Ăn chay / Ăn mặn / Cả 2 đều được -> Lọc theo cột dishes.dish_type (nếu không chọn -> không lọc)
//   - Câu 2: Dị ứng nguyên liệu (10 nguyên liệu) -> Lọc theo cột dishes.ingredient (nếu không chọn -> không lọc)
//   - Câu 3: Ăn được cay không (Có / Không) -> Lọc "Chili, Dry Chilli, Chilli Powder, Tabasco Sauce" (nếu không chọn -> không lọc)
//   - Câu 4: Số người dùng bữa -> Lọc Size L/R & Combo (nếu không chọn -> không lọc)
//   - Câu 5: Lựa chọn món ăn -> Lọc danh mục (nếu không chọn -> không lọc)
//   - Câu 6: Nguyên liệu yêu thích -> Ẩn nguyên liệu dị ứng Câu 2, chỉ hiện nguyên liệu thuộc danh mục Câu 5.
//            Nếu khách chọn M nguyên liệu và món chứa k nguyên liệu trong số đó -> đạt (k / M) * 100% (VD: 2/2 = 100%, 1/2 = 50%).
//            Nếu khách không chọn gì hoặc chọn tất cả -> đạt 100%.

import { z } from 'zod';
import prisma from '../lib/prisma';
import { normalizeCategory } from './contentBasedService';

export interface PriceVariant {
  dish_price_id: string;
  size_name: string;
  crust_name: string;
  price: number;
}

// ─── 1. Định nghĩa 12 nguyên liệu chuẩn ─────────────────────────────────────

export type IngredientKey =
  | 'seafood'
  | 'beef'
  | 'chicken'
  | 'sausage'
  | 'sweet_potato'
  | 'potato'
  | 'olive'
  | 'mushroom'
  | 'green_pepper'
  | 'tomato'
  | 'ham_bacon'
  | 'cheese';

export interface IngredientDef {
  key: IngredientKey;
  label: string;
  db_keywords_label: string;
  in_allergy_list: boolean;
  is_meat: boolean;
  matches: (dishName: string, ingredientText: string) => boolean;
}

const stripSweetPotato = (text: string) => text.replace(/sweet\s+potato/gi, ' ');

export const INGREDIENT_DEFS: IngredientDef[] = [
  {
    key: 'seafood',
    label: 'Hải sản (Tôm, Mực)',
    db_keywords_label: 'Shrimp, Squid',
    in_allergy_list: true,
    is_meat: true,
    matches: (_name, ing) => /\b(shrimp|srimp|squid|tuna|seafood|fish|salmon)\b/i.test(ing),
  },
  {
    key: 'beef',
    label: 'Thịt bò',
    db_keywords_label: 'Beef, Beefsteak',
    in_allergy_list: true,
    is_meat: true,
    matches: (_name, ing) => /\b(beef|beefsteak|beefteak)\b/i.test(ing),
  },
  {
    key: 'chicken',
    label: 'Thịt gà',
    db_keywords_label: 'Chicken',
    in_allergy_list: true,
    is_meat: true,
    matches: (name, ing) => /\b(chicken|chiken|wing)\b/i.test(`${name} ${ing}`),
  },
  {
    key: 'sausage',
    label: 'Xúc xích (Pepperoni, Sausage)',
    db_keywords_label: 'Pepperoni, Saugage',
    in_allergy_list: true,
    is_meat: true,
    matches: (_name, ing) => /\b(pepperoni|sausage|saugage|gaugage)\b/i.test(ing),
  },
  {
    key: 'sweet_potato',
    label: 'Khoai lang',
    db_keywords_label: 'Sweet potato',
    in_allergy_list: true,
    is_meat: false,
    matches: (_name, ing) => /\bsweet\s+potato\b/i.test(ing),
  },
  {
    key: 'potato',
    label: 'Khoai tây',
    db_keywords_label: 'Potato',
    in_allergy_list: true,
    is_meat: false,
    matches: (name, ing) => /\bpotato\b/i.test(stripSweetPotato(ing)) || /\bfrench\s+fries\b/i.test(name),
  },
  {
    key: 'olive',
    label: 'Trái Olive',
    db_keywords_label: 'Olive',
    in_allergy_list: true,
    is_meat: false,
    matches: (_name, ing) => /\b(olive|olives)\b/i.test(ing),
  },
  {
    key: 'mushroom',
    label: 'Nấm',
    db_keywords_label: 'Mushroom',
    in_allergy_list: true,
    is_meat: false,
    matches: (_name, ing) => /\b(mushroom|mushrooms)\b/i.test(ing),
  },
  {
    key: 'green_pepper',
    label: 'Ớt chuông xanh',
    db_keywords_label: 'Green pepper',
    in_allergy_list: true,
    is_meat: false,
    matches: (_name, ing) => /\bgreen\s+p(epper|aper)\b/i.test(ing),
  },
  {
    key: 'tomato',
    label: 'Cà chua',
    db_keywords_label: 'Tomato',
    in_allergy_list: true,
    is_meat: false,
    matches: (_name, ing) => /\b(tomato|tomatoes)\b/i.test(ing),
  },
  {
    key: 'ham_bacon',
    label: 'Thịt nguội / Ba rọi xông khói',
    db_keywords_label: 'Ham, Bacon',
    in_allergy_list: false,
    is_meat: true,
    matches: (_name, ing) => /\b(ham|bacon)\b/i.test(ing),
  },
  {
    key: 'cheese',
    label: 'Phô mai',
    db_keywords_label: 'Mozzarella, Parmesan',
    in_allergy_list: false,
    is_meat: false,
    matches: (name, ing) => /\b(cheese|mozzarella|parmesan|cheddar)\b/i.test(`${name} ${ing}`),
  },
];

export const INGREDIENT_KEYS = INGREDIENT_DEFS.map(d => d.key) as [IngredientKey, ...IngredientKey[]];
export const INGREDIENT_BY_KEY = new Map<IngredientKey, IngredientDef>(INGREDIENT_DEFS.map(d => [d.key, d]));

/**
 * Kiểm tra món ăn có chứa thành phần cay theo đúng Câu 3:
 * "Chili, Dry Chilli, Chilli Powder, Tabasco Sauce"
 */
export function hasSpicyIngredient(ingredientText: string | null | undefined): boolean {
  if (!ingredientText) return false;
  return /\b(chili|chilli|dry\s+chilli|chilli\s+powder|chili\s+powder|tabasco(\s+sauce)?|jalapeno|kim\s*chi)\b/i.test(
    ingredientText
  );
}

/**
 * Trích xuất danh sách các mã nguyên liệu có trong món ăn
 */
export function extractDishIngredients(dishName: string, ingredientText: string | null | undefined): IngredientKey[] {
  const ing = ingredientText || '';
  const name = dishName || '';
  const matched: IngredientKey[] = [];
  for (const def of INGREDIENT_DEFS) {
    if (def.matches(name, ing)) {
      matched.push(def.key);
    }
  }
  return matched;
}

// ─── 2. Định nghĩa các lựa chọn Câu 1 -> Câu 6 ──────────────────────────────

export const DIET_OPTIONS = {
  chay: 'Ăn chay',
  man: 'Ăn mặn',
  both: 'Cả 2 đều được',
} as const;
export type DietOption = keyof typeof DIET_OPTIONS;

export const SPICY_OPTIONS = {
  yes: 'Có',
  no: 'Không',
} as const;
export type SpicyOption = keyof typeof SPICY_OPTIONS;

export const SIX_STEP_PEOPLE_OPTIONS = {
  '1':   { label: 'Một mình',      disallowPizzaSize: 'Large' as const,   disallowAllCombos: true,  disallowComboPizzaSize: 'Large' as const },
  '2':   { label: '2 người',       disallowPizzaSize: 'Large' as const,   disallowAllCombos: false, disallowComboPizzaSize: 'Large' as const },
  '3-4': { label: '3–4 người',     disallowPizzaSize: null,               disallowAllCombos: false, disallowComboPizzaSize: null },
  '5-6': { label: '5–6 người',     disallowPizzaSize: 'Regular' as const, disallowAllCombos: false, disallowComboPizzaSize: 'Regular' as const },
  '6+':  { label: 'Trên 6 người',  disallowPizzaSize: 'Regular' as const, disallowAllCombos: false, disallowComboPizzaSize: 'Regular' as const },
} as const;
export type SixStepPeopleKey = keyof typeof SIX_STEP_PEOPLE_OPTIONS;

export const CATEGORY_OPTIONS = {
  'Pizza': 'Pizza',
  'Spaghetti': 'Mì Ý',
  'Gratin / Risotto': 'Cơm Ý đút lò',
  'Salad / Side Dish': 'Salad',
  'Combo': 'Combo',
} as const;
export type CategoryOptionKey = keyof typeof CATEGORY_OPTIONS;
export const CATEGORY_OPTION_KEYS = Object.keys(CATEGORY_OPTIONS) as [CategoryOptionKey, ...CategoryOptionKey[]];

// ─── 3. Schema kiểm tra dữ liệu đầu vào (Cho phép null / trống khi khách không chọn) ───

export const sixStepQuizRequestSchema = z.object({
  answers: z.object({
    diet: z.enum(['chay', 'man', 'both']).nullable().optional().default(null),
    allergies: z.array(z.enum(INGREDIENT_KEYS)).optional().default([]),
    spicy: z.enum(['yes', 'no']).nullable().optional().default(null),
    people: z.enum(['1', '2', '3-4', '5-6', '6+']).nullable().optional().default(null),
    categories: z.array(z.union([z.enum(CATEGORY_OPTION_KEYS), z.literal('any')])).optional().default([]),
    ingredients: z.array(z.enum(INGREDIENT_KEYS)).optional().default([]),
  }),
  source: z.string().max(30).optional(),
});

export type SixStepQuizRequest = z.infer<typeof sixStepQuizRequestSchema>;

// ─── 4. Kiểu dữ liệu sản phẩm ứng viên (Món lẻ + Combo) ─────────────────────

export interface SixStepCandidate {
  id: string;
  item_type: 'dish' | 'combo';
  dish_id: number;
  dish_name: string;
  category: CategoryOptionKey;
  category_label: string;
  dish_type: 'chay' | 'man';
  image: string | null;
  ingredient: string;
  is_spicy: boolean;
  ingredients: IngredientKey[];
  variants: PriceVariant[];
  selected_variant: PriceVariant;
}

export interface SixStepScoredItem {
  rank: number;
  item_type: 'dish' | 'combo';
  dish: {
    dish_id: number;
    dish_name: string;
    category: string;
    category_label: string;
    dish_type: string;
    image: string | null;
    ingredient: string;
  };
  variant: PriceVariant;
  all_variants: PriceVariant[];
  matched_ingredients_count: number;
  matched_ingredient_labels: string[];
  total_available_ingredients: number;
  selected_ingredients_count: number;
  /** Phần trăm phù hợp hiển thị cho khách (VD: 100%, 50%) */
  match_percent: number;
  reasons: string[];
}

export interface FilterTrace {
  initial_count: number;
  after_q1_diet: number;
  after_q2_allergy: number;
  after_q3_spicy: number;
  after_q4_people: number;
  after_q5_category: number;
  after_q6_ingredients: number;
}

export interface SixStepQuizResponse {
  mode: 'six_step';
  answers: SixStepQuizRequest['answers'];
  available_ingredients: {
    key: IngredientKey;
    label: string;
  }[];
  filter_trace: FilterTrace;
  candidates_count: number;
  top: SixStepScoredItem[];
  items: SixStepScoredItem[];
  notices: string[];
}

// ─── 5. Nạp dữ liệu từ CSDL (Dishes + Combos) ───────────────────────────────

export async function loadSixStepCandidates(): Promise<{
  dishes: SixStepCandidate[];
  combos: {
    combo_id: number;
    combo_name: string;
    combo_price: number;
    description: string;
    image_combo: string | null;
    has_pizza_large: boolean;
    has_pizza_regular: boolean;
    group_dishes: {
      group_name: string;
      dishes: { dish_id: number; dish_name: string; dish_type: string; ingredient: string; is_spicy: boolean; ingredients: IngredientKey[] }[];
    }[];
  }[];
}> {
  const [rawDishes, rawCombos] = await Promise.all([
    prisma.dish.findMany({
      where: { dish_status: true },
      include: {
        category: true,
        prices: { include: { size: true, crust: true } },
      },
      orderBy: { dish_id: 'asc' },
    }),
    prisma.combo.findMany({
      where: { is_active: true },
      include: {
        groups: {
          include: {
            combo_items: {
              include: {
                dish_price: {
                  include: {
                    dish: true,
                    size: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { combo_id: 'asc' },
    }),
  ]);

  const dishes: SixStepCandidate[] = [];
  for (const d of rawDishes) {
    if (d.dish_name?.toLowerCase().includes('half-half')) continue;
    const normCat = normalizeCategory(d.category?.category_name);
    if (!normCat || normCat === 'Drink') continue;
    const catKey = normCat as CategoryOptionKey;

    const variants: PriceVariant[] = (d.prices || [])
      .map(p => ({
        dish_price_id: String(p.dish_price_id),
        size_name: p.size?.size_name || 'Standard',
        crust_name: p.crust?.crust_name || 'None',
        price: Number(p.dish_price) || 0,
      }))
      .filter(v => v.price > 0)
      .sort((a, b) => a.price - b.price || a.dish_price_id.localeCompare(b.dish_price_id));

    if (variants.length === 0) continue;

    const ingText = d.ingredient || '';
    const ingredients = extractDishIngredients(d.dish_name, ingText);
    const isSpicy = hasSpicyIngredient(ingText);
    const dishType: 'chay' | 'man' = d.dish_type === 'chay' ? 'chay' : 'man';

    dishes.push({
      id: `dish_${d.dish_id}`,
      item_type: 'dish',
      dish_id: d.dish_id,
      dish_name: d.dish_name,
      category: catKey,
      category_label: CATEGORY_OPTIONS[catKey] || catKey,
      dish_type: dishType,
      image: d.image || null,
      ingredient: ingText,
      is_spicy: isSpicy,
      ingredients,
      variants,
      selected_variant: variants[0],
    });
  }

  const combos = rawCombos.map(c => {
    const desc = `${c.combo_name} ${c.description || ''} ${c.groups.map(g => g.group_name).join(' ')}`;
    let hasPizzaLarge = /\bpizza\s+large\b|\blarge\s+size\b/i.test(desc);
    let hasPizzaRegular = /\bpizza\s+regular\b|\bregular\s+size\b/i.test(desc);

    const groupDishes = c.groups.map(g => {
      const dsMap = new Map<number, { dish_id: number; dish_name: string; dish_type: string; ingredient: string; is_spicy: boolean; ingredients: IngredientKey[] }>();
      for (const ci of g.combo_items) {
        const dp = ci.dish_price;
        const dish = dp?.dish;
        if (!dish) continue;
        if (dp?.size?.size_name === 'Large' && dish.dish_name.toLowerCase().includes('pizza')) hasPizzaLarge = true;
        if (dp?.size?.size_name === 'Regular' && dish.dish_name.toLowerCase().includes('pizza')) hasPizzaRegular = true;
        if (!dsMap.has(dish.dish_id)) {
          const ing = dish.ingredient || '';
          dsMap.set(dish.dish_id, {
            dish_id: dish.dish_id,
            dish_name: dish.dish_name,
            dish_type: dish.dish_type || 'man',
            ingredient: ing,
            is_spicy: hasSpicyIngredient(ing),
            ingredients: extractDishIngredients(dish.dish_name, ing),
          });
        }
      }
      return {
        group_name: g.group_name,
        dishes: [...dsMap.values()],
      };
    });

    return {
      combo_id: c.combo_id,
      combo_name: c.combo_name,
      combo_price: c.combo_price,
      description: c.description || '',
      image_combo: c.image_combo || null,
      has_pizza_large: hasPizzaLarge,
      has_pizza_regular: hasPizzaRegular,
      group_dishes: groupDishes,
    };
  });

  return { dishes, combos };
}

// ─── 6. Thực thi bộ lọc Câu 1 -> Câu 5 & Tính phần trăm phù hợp Câu 6 ────────

export async function runSixStepQuiz(req: SixStepQuizRequest): Promise<SixStepQuizResponse> {
  const { answers } = req;
  const notices: string[] = [];

  const { dishes: allDishes, combos: rawCombos } = await loadSixStepCandidates();

  const buildComboCandidates = (
    dietFilter: DietOption | null | undefined,
    allergySet: Set<IngredientKey>,
    spicyFilter: SpicyOption | null | undefined
  ): SixStepCandidate[] => {
    const out: SixStepCandidate[] = [];
    for (const c of rawCombos) {
      let validCombo = true;
      const unionIngredients = new Set<IngredientKey>();
      let anySpicy = false;
      let allVegPossible = true;
      let anyMeatPossible = false;

      for (const g of c.group_dishes) {
        if (g.dishes.length === 0) continue;
        const validGroupDishes = g.dishes.filter(d => {
          const isDrinkOrBread = !d.ingredient || d.ingredient === 'null';
          if (dietFilter === 'chay' && d.dish_type !== 'chay' && !d.dish_name.toLowerCase().includes('pepsi')) {
            return false;
          }
          if (!isDrinkOrBread) {
            if (d.ingredients.some(k => allergySet.has(k))) return false;
            if (spicyFilter === 'no' && d.is_spicy) return false;
          }
          return true;
        });

        if (validGroupDishes.length === 0) {
          validCombo = false;
          break;
        }

        if (!validGroupDishes.some(d => d.dish_type === 'chay' || d.dish_name.toLowerCase().includes('pepsi'))) {
          allVegPossible = false;
        }
        if (validGroupDishes.some(d => d.dish_type === 'man' && !d.dish_name.toLowerCase().includes('pepsi'))) {
          anyMeatPossible = true;
        }

        for (const vd of validGroupDishes) {
          vd.ingredients.forEach(k => unionIngredients.add(k));
          if (vd.is_spicy) anySpicy = true;
        }
      }

      if (!validCombo) continue;
      if (dietFilter === 'chay' && !allVegPossible) continue;
      if (dietFilter === 'man' && !anyMeatPossible) continue;

      const v: PriceVariant = {
        dish_price_id: `combo_${c.combo_id}`,
        size_name: c.has_pizza_large ? 'Large' : c.has_pizza_regular ? 'Regular' : 'Combo',
        crust_name: 'Trọn gói',
        price: c.combo_price,
      };

      out.push({
        id: `combo_${c.combo_id}`,
        item_type: 'combo',
        dish_id: c.combo_id,
        dish_name: c.combo_name,
        category: 'Combo',
        category_label: 'Combo',
        dish_type: allVegPossible && dietFilter === 'chay' ? 'chay' : 'man',
        image: c.image_combo,
        ingredient: c.description,
        is_spicy: anySpicy,
        ingredients: [...unionIngredients],
        variants: [v],
        selected_variant: v,
      });
    }
    return out;
  };

  const initialCount = allDishes.length + rawCombos.length;

  // ── BƯỚC LỌC CÂU 1: Chay / Mặn (Nếu không chọn -> không lọc) ──────────────
  const afterQ1Dishes = allDishes.filter(d => {
    if (answers.diet === 'chay') return d.dish_type === 'chay';
    if (answers.diet === 'man') return d.dish_type === 'man';
    return true;
  });
  const afterQ1Combos = buildComboCandidates(answers.diet, new Set(), null);
  const afterQ1Count = afterQ1Dishes.length + afterQ1Combos.length;

  // ── BƯỚC LỌC CÂU 2: Dị ứng nguyên liệu (Nếu không chọn -> không lọc) ──────
  const allergySet = new Set<IngredientKey>(answers.allergies || []);
  const afterQ2Dishes = afterQ1Dishes.filter(d => !d.ingredients.some(k => allergySet.has(k)));
  const afterQ2Combos = buildComboCandidates(answers.diet, allergySet, null);
  const afterQ2Count = afterQ2Dishes.length + afterQ2Combos.length;

  // ── BƯỚC LỌC CÂU 3: Ăn được cay không (Nếu không chọn -> không lọc) ───────
  const afterQ3Dishes = afterQ2Dishes.filter(d => (answers.spicy === 'no' ? !d.is_spicy : true));
  const afterQ3Combos = buildComboCandidates(answers.diet, allergySet, answers.spicy);
  const afterQ3Count = afterQ3Dishes.length + afterQ3Combos.length;

  // ── BƯỚC LỌC CÂU 4: Số người dùng bữa (Nếu không chọn -> không lọc) ───────
  const peoplePlan = answers.people ? SIX_STEP_PEOPLE_OPTIONS[answers.people] : null;
  const afterQ4Dishes: SixStepCandidate[] = [];
  for (const d of afterQ3Dishes) {
    if (d.category === 'Pizza' && peoplePlan) {
      const keptVariants = d.variants.filter(v => {
        if (peoplePlan.disallowPizzaSize === 'Large' && v.size_name === 'Large') return false;
        if (peoplePlan.disallowPizzaSize === 'Regular' && v.size_name === 'Regular') return false;
        return true;
      });
      if (keptVariants.length === 0) continue;
      const preferredVariant =
        answers.people === '3-4'
          ? keptVariants.find(v => v.size_name === 'Large') || keptVariants[0]
          : keptVariants[0];
      afterQ4Dishes.push({
        ...d,
        variants: keptVariants,
        selected_variant: preferredVariant,
      });
    } else {
      afterQ4Dishes.push(d);
    }
  }

  const afterQ4Combos = afterQ3Combos.filter(c => {
    if (!peoplePlan) return true;
    if (peoplePlan.disallowAllCombos) return false;
    const raw = rawCombos.find(rc => rc.combo_id === c.dish_id);
    if (!raw) return false;
    if (peoplePlan.disallowComboPizzaSize === 'Large' && raw.has_pizza_large) return false;
    if (peoplePlan.disallowComboPizzaSize === 'Regular' && raw.has_pizza_regular && !raw.has_pizza_large) return false;
    return true;
  });
  const afterQ4Count = afterQ4Dishes.length + afterQ4Combos.length;

  // ── BƯỚC LỌC CÂU 5: Lựa chọn danh mục món ăn (Nếu không chọn -> không lọc) ──
  const rawCats = answers.categories || [];
  const isAnyCategory = rawCats.length === 0 || rawCats.includes('any');
  const selectedCats = new Set<CategoryOptionKey>(
    isAnyCategory ? CATEGORY_OPTION_KEYS : (rawCats.filter(c => c !== 'any') as CategoryOptionKey[])
  );

  if (selectedCats.has('Combo') && !isAnyCategory && peoplePlan?.disallowAllCombos) {
    notices.push('Bạn chọn đi 1 mình nên các gói Combo lớn đã được lược bỏ để vừa khẩu phần.');
  }

  const afterQ5Candidates = [...afterQ4Dishes, ...afterQ4Combos].filter(item => selectedCats.has(item.category));
  const afterQ5Count = afterQ5Candidates.length;

  // ── XÁC ĐỊNH DANH SÁCH NGUYÊN LIỆU KHẢ DỤNG Ở CÂU 6 ────────────────────────
  const presentInQ5 = new Set<IngredientKey>();
  const categoryPoolForIngredients = [...afterQ3Dishes, ...afterQ3Combos].filter(item => selectedCats.has(item.category));
  for (const item of categoryPoolForIngredients) {
    item.ingredients.forEach(k => presentInQ5.add(k));
  }

  const availableIngredientDefs = INGREDIENT_DEFS.filter(def => {
    if (allergySet.has(def.key)) return false;
    if (answers.diet === 'chay' && def.is_meat) return false;
    return presentInQ5.has(def.key);
  });

  const availableKeySet = new Set<IngredientKey>(availableIngredientDefs.map(d => d.key));
  const totalAvailableN = availableIngredientDefs.length;

  const validSelectedIngredients = [...new Set((answers.ingredients || []).filter(k => availableKeySet.has(k)))];
  const selectedM = validSelectedIngredients.length;
  const selectedSet = new Set<IngredientKey>(validSelectedIngredients);

  // ── BƯỚC CHẤM ĐIỂM CÂU 6 & QUY RA PHẦN TRĂM (%) ───────────────────────────
  // - Nếu khách không chọn nguyên liệu nào (selectedM === 0) hoặc chọn tất cả (selectedM === totalAvailableN):
  //   Tất cả các món đã lọc từ Câu 1–5 đều đạt 100%.
  // - Nếu khách chọn M nguyên liệu (selectedM > 0):
  //   Chỉ giữ lại món có chứa ít nhất 1 nguyên liệu đã chọn (k >= 1).
  //   Phần trăm phù hợp = (k / M) * 100% (VD: chọn 2 nguyên liệu, món có cả 2 -> 100%, món có 1 -> 50%).
  const isDefaultOrAll100 = totalAvailableN === 0 || selectedM === 0 || selectedM === totalAvailableN;

  const afterQ6Candidates = isDefaultOrAll100
    ? afterQ5Candidates
    : afterQ5Candidates.filter(item => item.ingredients.some(k => selectedSet.has(k)));

  const afterQ6Count = afterQ6Candidates.length;

  if (afterQ6Count === 0 && afterQ5Count > 0 && !isDefaultOrAll100) {
    notices.push('Chưa có món nào trong nhóm bạn chọn chứa nguyên liệu này. Bạn thử chọn thêm nguyên liệu khác nhé.');
  } else if (afterQ5Count === 0) {
    notices.push('Chưa tìm thấy món thỏa mãn tất cả lựa chọn của bạn. Bạn thử bớt điều kiện lọc nhé.');
  }

  const scoredItems: SixStepScoredItem[] = afterQ6Candidates.map(item => {
    const matchedKeys = isDefaultOrAll100
      ? item.ingredients.filter(k => availableKeySet.has(k))
      : item.ingredients.filter(k => selectedSet.has(k));

    // Tính tỷ lệ phù hợp: nếu khách chọn M nguyên liệu, món khớp k nguyên liệu thì đạt (k / M) * 100%
    const matchPercent = isDefaultOrAll100
      ? 100
      : selectedM > 0
        ? Math.round((matchedKeys.length / selectedM) * 100)
        : 100;

    const matchedLabels = matchedKeys.map(k => INGREDIENT_BY_KEY.get(k)?.label || k);
    const reasons: string[] = [];

    if (item.item_type === 'combo') {
      reasons.push('Bạn có thể tự do lựa chọn các món ăn trong Combo theo sở thích của mình.');
    } else {
      if (!isDefaultOrAll100 && matchedLabels.length > 0) {
        reasons.push(`Có thành phần bạn thích: ${matchedLabels.join(', ')}`);
      }

      if (item.category === 'Pizza' && peoplePlan) {
        reasons.push(`Cỡ bánh phù hợp cho ${peoplePlan.label}: Size ${item.selected_variant.size_name}`);
      } else {
        reasons.push(`${item.category_label} · ${item.dish_type === 'chay' ? 'Món chay' : 'Món mặn'}`);
      }
    }

    return {
      rank: 0,
      item_type: item.item_type,
      dish: {
        dish_id: item.dish_id,
        dish_name: item.dish_name,
        category: item.category,
        category_label: item.category_label,
        dish_type: item.dish_type,
        image: item.image,
        ingredient: item.ingredient,
      },
      variant: item.selected_variant,
      all_variants: item.variants,
      matched_ingredients_count: matchedKeys.length,
      matched_ingredient_labels: matchedLabels,
      total_available_ingredients: totalAvailableN,
      selected_ingredients_count: selectedM,
      match_percent: matchPercent,
      reasons,
    };
  });

  // Sắp xếp theo % phù hợp giảm dần -> Số nguyên liệu khớp giảm dần -> Mã món tăng dần
  scoredItems.sort(
    (a, b) =>
      b.match_percent - a.match_percent ||
      b.matched_ingredients_count - a.matched_ingredients_count ||
      a.dish.dish_id - b.dish.dish_id
  );

  scoredItems.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  const filterTrace: FilterTrace = {
    initial_count: initialCount,
    after_q1_diet: afterQ1Count,
    after_q2_allergy: afterQ2Count,
    after_q3_spicy: afterQ3Count,
    after_q4_people: afterQ4Count,
    after_q5_category: afterQ5Count,
    after_q6_ingredients: afterQ6Count,
  };

  return {
    mode: 'six_step',
    answers,
    available_ingredients: availableIngredientDefs.map(d => ({
      key: d.key,
      label: d.label,
    })),
    filter_trace: filterTrace,
    candidates_count: scoredItems.length,
    top: scoredItems.slice(0, 3),
    items: scoredItems,
    notices,
  };
}
