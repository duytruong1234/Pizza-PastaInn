'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft, Sparkles, Check, ShoppingCart, RotateCcw, TriangleAlert, LoaderCircle } from 'lucide-react';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';
import { useRecommendationStore, recHeaders } from '@/store/recommendationStore';
import ComboModal from './ComboModal';

// ─── Định nghĩa dữ liệu 6 câu hỏi ──────────────────────────────────────────

type DietKey = 'chay' | 'man' | 'both';
type SpicyKey = 'yes' | 'no';
type PeopleKey = '1' | '2' | '3-4' | '5-6' | '6+';
type CategoryKey = 'Pizza' | 'Spaghetti' | 'Gratin / Risotto' | 'Salad / Side Dish' | 'Combo' | 'any';
type IngredientKey =
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

interface IngredientOption {
  key: IngredientKey;
  label: string;
  labelEn: string;
  in_allergy_list: boolean;
  is_meat: boolean;
  categories: CategoryKey[];
}

const ALL_INGREDIENTS: IngredientOption[] = [
  {
    key: 'seafood',
    label: 'Hải sản (Tôm, Mực)',
    labelEn: 'Seafood (Shrimp, Squid)',
    in_allergy_list: true,
    is_meat: true,
    categories: ['Pizza', 'Spaghetti', 'Gratin / Risotto', 'Combo'],
  },
  {
    key: 'beef',
    label: 'Thịt bò',
    labelEn: 'Beef',
    in_allergy_list: true,
    is_meat: true,
    categories: ['Pizza', 'Spaghetti', 'Gratin / Risotto', 'Salad / Side Dish', 'Combo'],
  },
  {
    key: 'chicken',
    label: 'Thịt gà',
    labelEn: 'Chicken',
    in_allergy_list: true,
    is_meat: true,
    categories: ['Pizza', 'Spaghetti', 'Gratin / Risotto', 'Salad / Side Dish', 'Combo'],
  },
  {
    key: 'sausage',
    label: 'Xúc xích',
    labelEn: 'Sausage',
    in_allergy_list: true,
    is_meat: true,
    categories: ['Pizza', 'Spaghetti', 'Salad / Side Dish', 'Combo'],
  },
  {
    key: 'sweet_potato',
    label: 'Khoai lang',
    labelEn: 'Sweet Potato',
    in_allergy_list: true,
    is_meat: false,
    categories: ['Pizza', 'Combo'],
  },
  {
    key: 'potato',
    label: 'Khoai tây',
    labelEn: 'Potato',
    in_allergy_list: true,
    is_meat: false,
    categories: ['Pizza', 'Salad / Side Dish', 'Combo'],
  },
  {
    key: 'olive',
    label: 'Trái Olive',
    labelEn: 'Olive',
    in_allergy_list: true,
    is_meat: false,
    categories: ['Pizza', 'Salad / Side Dish', 'Combo'],
  },
  {
    key: 'mushroom',
    label: 'Nấm',
    labelEn: 'Mushroom',
    in_allergy_list: true,
    is_meat: false,
    categories: ['Pizza', 'Spaghetti', 'Gratin / Risotto', 'Salad / Side Dish', 'Combo'],
  },
  {
    key: 'green_pepper',
    label: 'Ớt chuông xanh',
    labelEn: 'Green Pepper',
    in_allergy_list: true,
    is_meat: false,
    categories: ['Pizza', 'Combo'],
  },
  {
    key: 'tomato',
    label: 'Cà chua',
    labelEn: 'Tomato',
    in_allergy_list: true,
    is_meat: false,
    categories: ['Pizza', 'Spaghetti', 'Gratin / Risotto', 'Salad / Side Dish', 'Combo'],
  },
  {
    key: 'ham_bacon',
    label: 'Thịt nguội / Ba rọi xông khói',
    labelEn: 'Ham / Bacon',
    in_allergy_list: false,
    is_meat: true,
    categories: ['Pizza', 'Spaghetti', 'Gratin / Risotto', 'Salad / Side Dish', 'Combo'],
  },
  {
    key: 'cheese',
    label: 'Phô mai',
    labelEn: 'Cheese',
    in_allergy_list: false,
    is_meat: false,
    categories: ['Pizza', 'Spaghetti', 'Gratin / Risotto', 'Salad / Side Dish', 'Combo'],
  },
];

const ALLERGY_INGREDIENTS = ALL_INGREDIENTS.filter(i => i.in_allergy_list);

const DIET_CHOICES: { value: DietKey; label: string; labelEn: string }[] = [
  { value: 'chay', label: 'Ăn chay', labelEn: 'Vegetarian' },
  { value: 'man', label: 'Ăn mặn', labelEn: 'Savory / Meat' },
  { value: 'both', label: 'Cả 2 đều được', labelEn: 'Either is fine' },
];

const SPICY_CHOICES: { value: SpicyKey; label: string; labelEn: string }[] = [
  { value: 'yes', label: 'Có', labelEn: 'Yes' },
  { value: 'no', label: 'Không', labelEn: 'No' },
];

const PEOPLE_CHOICES: { value: PeopleKey; label: string; labelEn: string }[] = [
  { value: '1', label: 'Một mình', labelEn: 'Just me (1 person)' },
  { value: '2', label: '2 người', labelEn: '2 people' },
  { value: '3-4', label: '3–4 người', labelEn: '3–4 people' },
  { value: '5-6', label: '5–6 người', labelEn: '5–6 people' },
  { value: '6+', label: 'Trên 6 người', labelEn: 'More than 6 people' },
];

const CATEGORY_CHOICES: { value: CategoryKey; label: string; labelEn: string }[] = [
  { value: 'Pizza', label: 'Pizza', labelEn: 'Pizza' },
  { value: 'Spaghetti', label: 'Mì Ý', labelEn: 'Spaghetti' },
  { value: 'Gratin / Risotto', label: 'Cơm Ý đút lò', labelEn: 'Baked Gratin & Risotto' },
  { value: 'Salad / Side Dish', label: 'Salad', labelEn: 'Salad & Side Dishes' },
  { value: 'Combo', label: 'Combo', labelEn: 'Combo' },
  { value: 'any', label: 'Không có lựa chọn cụ thể', labelEn: 'No specific preference' },
];

// ─── Kiểu dữ liệu trả về từ Backend ─────────────────────────────────────────

type Variant = { dish_price_id: string; size_name: string; crust_name: string; price: number };
type DishInfo = {
  dish_id: number;
  dish_name: string;
  category: string;
  category_label?: string;
  dish_type: string;
  image: string | null;
  ingredient: string;
};

type ScoredItem = {
  rank: number;
  item_type?: 'dish' | 'combo';
  dish: DishInfo;
  variant: Variant;
  all_variants?: Variant[];
  matched_ingredients_count: number;
  matched_ingredient_labels: string[];
  total_available_ingredients: number;
  selected_ingredients_count: number;
  match_percent: number;
  reasons: string[];
};

type QuizResult = {
  notices: string[];
  top: ScoredItem[];
  items?: ScoredItem[];
};

// Không tự chọn mặc định cho bất kỳ câu nào (tất cả khởi tạo null hoặc mảng rỗng)
type QuizAnswersState = {
  diet: DietKey | null;
  allergies: IngredientKey[];
  spicy: SpicyKey | null;
  people: PeopleKey | null;
  categories: CategoryKey[];
  ingredients: IngredientKey[];
};

const INITIAL_ANSWERS: QuizAnswersState = {
  diet: null,
  allergies: [],
  spicy: null,
  people: null,
  categories: [],
  ingredients: [],
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop';
const imgUrl = (p: string | null) => (!p ? FALLBACK_IMG : p.startsWith('http') ? p : `${BACKEND_URL}${p}`);
const sizeText = (v: Variant) =>
  [v.size_name && v.size_name !== 'Standard' ? `Size ${v.size_name}` : '', v.crust_name && v.crust_name !== 'None' ? v.crust_name : '']
    .filter(Boolean)
    .join(' · ');

export default function SmartQuizModal() {
  const { quizOpen, quizSource, closeQuiz } = useRecommendationStore();
  const addToCart = useCartStore(s => s.addToCart);
  const { theme, lang, td, ti, tc } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const [step, setStep] = useState(0); // 0 -> 5 (Câu 1 -> Câu 6)
  const [answers, setAnswers] = useState<QuizAnswersState>(INITIAL_ANSWERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [showAllItems, setShowAllItems] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<ScoredItem | null>(null);

  // Danh sách nguyên liệu khả dụng cho Câu 6 (tính theo Câu 1, Câu 2, Câu 5)
  const localAvailableIngredients = useMemo(() => {
    const allergySet = new Set(answers.allergies);
    const isAnyCat = answers.categories.length === 0 || answers.categories.includes('any');
    const chosenCats = isAnyCat
      ? (['Pizza', 'Spaghetti', 'Gratin / Risotto', 'Salad / Side Dish', 'Combo'] as CategoryKey[])
      : answers.categories;

    return ALL_INGREDIENTS.filter(ing => {
      if (allergySet.has(ing.key)) return false;
      if (answers.diet === 'chay' && ing.is_meat) return false;
      return ing.categories.some(c => chosenCats.includes(c));
    });
  }, [answers.allergies, answers.diet, answers.categories]);

  const [serverIngredients, setServerIngredients] = useState<{ key: IngredientKey; label: string }[] | null>(null);

  const availableIngredients = useMemo(() => {
    if (serverIngredients && serverIngredients.length > 0) return serverIngredients;
    return localAvailableIngredients.map(i => ({ key: i.key, label: i.label }));
  }, [serverIngredients, localAvailableIngredients]);

  const reset = useCallback(() => {
    setStep(0);
    setAnswers(INITIAL_ANSWERS);
    setResult(null);
    setError(null);
    setAdded({});
    setShowAllItems(false);
    setSelectedCombo(null);
    setServerIngredients(null);
  }, []);

  // Đóng bằng phím Esc + khóa cuộn nền
  useEffect(() => {
    if (!quizOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCombo) {
          setSelectedCombo(null);
        } else {
          closeQuiz();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [quizOpen, closeQuiz, selectedCombo]);

  // Khi bước sang Câu 6 (step === 5), đồng bộ danh sách nguyên liệu khả dụng
  useEffect(() => {
    if (!quizOpen || step !== 5) return;
    let cancelled = false;
    fetch(`${API_BASE}/recommendations/smart/quiz/ingredients`, {
      method: 'POST',
      headers: recHeaders(),
      body: JSON.stringify({ answers }),
    })
      .then(r => r.json())
      .then(json => {
        if (!cancelled && json?.success && Array.isArray(json.data?.available_ingredients)) {
          const srv = json.data.available_ingredients as { key: IngredientKey; label: string }[];
          setServerIngredients(srv);
          const validKeys = new Set(srv.map(x => x.key));
          setAnswers(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter(k => validKeys.has(k)),
          }));
        }
      })
      .catch(() => {
        /* giữ localAvailableIngredients nếu mạng chậm */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizOpen, step]);

  // Gửi bài khảo sát 6 câu lên Backend
  const submit = useCallback(
    async (finalAnswers: QuizAnswersState) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/recommendations/smart/quiz`, {
          method: 'POST',
          headers: recHeaders(),
          body: JSON.stringify({
            answers: finalAnswers,
            source: quizSource ?? undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Không tạo được gợi ý');
        const data: QuizResult = json.data;
        setResult(data);
      } catch (e: unknown) {
        setError(e instanceof Error && e.message ? e.message : 'Có lỗi xảy ra, vui lòng thử lại');
      } finally {
        setLoading(false);
      }
    },
    [quizSource]
  );

  // ─── Xử lý chọn / bỏ chọn từng câu ────────────────────────────────────────

  const toggleDiet = (diet: DietKey) => {
    const nextDiet = answers.diet === diet ? null : diet;
    setAnswers({
      ...answers,
      diet: nextDiet,
      ingredients:
        nextDiet === 'chay'
          ? answers.ingredients.filter(k => !ALL_INGREDIENTS.find(i => i.key === k)?.is_meat)
          : answers.ingredients,
    });
  };

  const toggleAllergy = (key: IngredientKey) => {
    const exists = answers.allergies.includes(key);
    const nextAllergies = exists ? answers.allergies.filter(k => k !== key) : [...answers.allergies, key];
    const nextIngredients = answers.ingredients.filter(k => !nextAllergies.includes(k));
    setAnswers({ ...answers, allergies: nextAllergies, ingredients: nextIngredients });
  };

  const toggleSpicy = (spicy: SpicyKey) => {
    setAnswers({ ...answers, spicy: answers.spicy === spicy ? null : spicy });
  };

  const togglePeople = (people: PeopleKey) => {
    const nextPeople = answers.people === people ? null : people;
    let nextCategories = answers.categories;
    if (nextPeople === '1' && nextCategories.includes('Combo')) {
      nextCategories = nextCategories.filter(c => c !== 'Combo');
    }
    setAnswers({ ...answers, people: nextPeople, categories: nextCategories });
  };

  const toggleCategory = (cat: CategoryKey) => {
    if (cat === 'any') {
      const hasAny = answers.categories.includes('any');
      setAnswers({ ...answers, categories: hasAny ? [] : ['any'] });
      return;
    }
    const withoutAny = answers.categories.filter(c => c !== 'any');
    const exists = withoutAny.includes(cat);
    const next = exists ? withoutAny.filter(c => c !== cat) : [...withoutAny, cat];
    setAnswers({ ...answers, categories: next });
  };

  const toggleFavoriteIngredient = (key: IngredientKey) => {
    const exists = answers.ingredients.includes(key);
    const next = exists ? answers.ingredients.filter(k => k !== key) : [...answers.ingredients, key];
    setAnswers({ ...answers, ingredients: next });
  };

  // ─── Thêm vào giỏ hàng ────────────────────────────────────────────────────

  const addDishToCart = async (item: ScoredItem) => {
    await addToCart({
      type: 'regular',
      dish_id: item.dish.dish_id,
      dish_price_id: item.variant.dish_price_id,
      name: item.dish.dish_name,
      price: item.variant.price,
      quantity: 1,
      imageUrl: imgUrl(item.dish.image),
      options: {
        size: item.variant.size_name && item.variant.size_name !== 'Standard' ? item.variant.size_name : undefined,
        crust: item.variant.crust_name && item.variant.crust_name !== 'None' ? item.variant.crust_name : undefined,
      },
    });
    setAdded(a => ({ ...a, [`${item.item_type || 'dish'}_${item.dish.dish_id}`]: true }));
  };

  const progress = useMemo(() => (result ? 100 : Math.round(((step + 1) / 6) * 100)), [step, result]);

  if (!quizOpen) return null;

  const displayedResults = result ? (showAllItems ? result.items || result.top : (result.items || result.top).slice(0, 6)) : [];
  const totalResultsCount = result ? (result.items || result.top).length : 0;

  return (
    <>
      <div
        className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeQuiz();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEn ? 'Find Your Ideal Dish' : 'Lựa chọn phù hợp cho bạn'}
          className={`relative w-full sm:max-w-[700px] max-h-[92vh] flex flex-col border rounded-t-[28px] sm:rounded-[28px] overflow-hidden animate-fadeIn ${
            isLight
              ? 'bg-white text-zinc-900 border-zinc-200 shadow-[0_20px_60px_rgba(0,0,0,0.18)]'
              : 'bg-[#1a1513] text-white border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
          }`}
          onClick={e => e.stopPropagation()}
        >
        {/* Header */}
        <div
          className={`shrink-0 px-5 pt-5 pb-3 border-b ${
            isLight
              ? 'bg-gradient-to-b from-zinc-50 to-white border-zinc-100'
              : 'bg-gradient-to-b from-[#2a1f1a] to-[#1a1513] border-white/[0.06]'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {!result && step > 0 && !loading ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isLight ? 'hover:bg-zinc-100 text-zinc-600' : 'hover:bg-white/5 text-zinc-300'
                  }`}
                  aria-label={isEn ? 'Back' : 'Quay lại'}
                >
                  <ChevronLeft size={20} />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#ee2828]/15 text-[#ee2828] flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
              )}
              <div className="min-w-0">
                <h3 className={`font-extrabold text-[17px] tracking-wide truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  {isEn ? 'Find Your Ideal Dish' : 'Lựa chọn phù hợp cho bạn'}
                </h3>
                <p className={`text-[11px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {result
                    ? isEn
                      ? `Found ${totalResultsCount} matching dishes for you`
                      : `Tìm thấy ${totalResultsCount} món phù hợp với bạn`
                    : isEn
                      ? `Question ${step + 1} / 6`
                      : `Câu hỏi ${step + 1} / 6`}
                </p>
              </div>
            </div>
            <button
              onClick={closeQuiz}
              className={`p-1.5 rounded-lg cursor-pointer ${
                isLight ? 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900' : 'hover:bg-white/5 text-zinc-400 hover:text-white'
              }`}
              aria-label={isEn ? 'Close' : 'Đóng'}
            >
              <X size={20} />
            </button>
          </div>
          <div className={`mt-3 h-1.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-zinc-100' : 'bg-white/5'}`}>
            <div className="h-full bg-[#ee2828] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto quiz-scrollbar px-5 pb-6 mr-1 my-1">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <LoaderCircle size={32} className="animate-spin text-[#ee2828]" />
              <p className={`font-bold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {isEn ? 'Finding the best dishes for you…' : 'Đang tìm món phù hợp cho bạn…'}
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="py-10 text-center space-y-3">
              <p className="text-red-400 text-sm font-bold">{error}</p>
              <button
                onClick={() => submit(answers)}
                className="bg-[#ee2828] hover:bg-[#d42020] text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                {isEn ? 'Try Again' : 'Thử lại'}
              </button>
            </div>
          )}

          {/* ── CÂU 1: ĂN CHAY HAY ĂN MẶN ────────────────────────────────────── */}
          {!loading && !error && !result && step === 0 && (
            <div className="pt-4">
              <h4 className={`text-lg font-extrabold mb-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {isEn ? 'Question 1: Do you prefer vegetarian or savory dishes?' : 'Câu 1: Bạn là người ăn chay hay ăn mặn?'}
              </h4>
              <p className={`text-xs mb-4 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {isEn
                  ? 'Select one option or click Continue to skip filtering.'
                  : 'Bạn có thể chọn 1 đáp án hoặc bấm Tiếp tục nếu không muốn lọc.'}
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {DIET_CHOICES.map(o => {
                  const active = answers.diet === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleDiet(o.value)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        active
                          ? 'bg-[#ee2828]/15 border-[#ee2828]'
                          : isLight
                            ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                            : 'bg-[#2a221f] border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <span className={`font-extrabold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {isEn ? o.labelEn : o.label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          active ? 'bg-[#ee2828] border-[#ee2828]' : isLight ? 'border-zinc-300' : 'border-white/25'
                        }`}
                      >
                        {active && <Check size={13} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-end mt-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto bg-[#ee2828] hover:bg-[#d42020] text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg cursor-pointer"
                >
                  {isEn ? 'Continue' : 'Tiếp tục'}
                </button>
              </div>
            </div>
          )}

          {/* ── CÂU 2: DỊ ỨNG NGUYÊN LIỆU ───────────────────────────────────── */}
          {!loading && !error && !result && step === 1 && (
            <div className="pt-4">
              <h4 className={`text-lg font-extrabold mb-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {isEn
                  ? 'Question 2: Are you allergic to any of the following ingredients?'
                  : 'Câu 2: Bạn dị ứng với nguyên liệu dưới đây không nào?'}
              </h4>
              <p className={`text-xs mb-4 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {isEn
                  ? 'You can select multiple options (click Continue if you have no allergies).'
                  : 'Có thể chọn nhiều đáp án (nếu không bị dị ứng, bạn bấm Tiếp tục).'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALLERGY_INGREDIENTS.map(item => {
                  const checked = answers.allergies.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleAllergy(item.key)}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        checked
                          ? 'bg-[#ee2828]/15 border-[#ee2828]'
                          : isLight
                            ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                            : 'bg-[#2a221f] border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <span className={`font-bold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {isEn ? item.labelEn : item.label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          checked ? 'bg-[#ee2828] border-[#ee2828]' : isLight ? 'border-zinc-300' : 'border-white/25'
                        }`}
                      >
                        {checked && <Check size={13} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-end mt-5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto bg-[#ee2828] hover:bg-[#d42020] text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg cursor-pointer"
                >
                  {isEn ? 'Continue' : 'Tiếp tục'}
                </button>
              </div>
            </div>
          )}

          {/* ── CÂU 3: BẠN CÓ ĂN ĐƯỢC CAY KHÔNG ─────────────────────────────── */}
          {!loading && !error && !result && step === 2 && (
            <div className="pt-4">
              <h4 className={`text-lg font-extrabold mb-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {isEn ? 'Question 3: Do you enjoy spicy food?' : 'Câu 3: Bạn có ăn được cay không?'}
              </h4>
              <p className={`text-xs mb-4 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {isEn
                  ? 'Select one option or click Continue to skip filtering.'
                  : 'Bạn có thể chọn 1 đáp án hoặc bấm Tiếp tục nếu không muốn lọc.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SPICY_CHOICES.map(o => {
                  const active = answers.spicy === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleSpicy(o.value)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        active
                          ? 'bg-[#ee2828]/15 border-[#ee2828]'
                          : isLight
                            ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                            : 'bg-[#2a221f] border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <span className={`font-extrabold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {isEn ? o.labelEn : o.label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          active ? 'bg-[#ee2828] border-[#ee2828]' : isLight ? 'border-zinc-300' : 'border-white/25'
                        }`}
                      >
                        {active && <Check size={13} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-end mt-5">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full sm:w-auto bg-[#ee2828] hover:bg-[#d42020] text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg cursor-pointer"
                >
                  {isEn ? 'Continue' : 'Tiếp tục'}
                </button>
              </div>
            </div>
          )}

          {/* ── CÂU 4: DÙNG BỮA VỚI BAO NHIÊU NGƯỜI ─────────────────────────── */}
          {!loading && !error && !result && step === 3 && (
            <div className="pt-4">
              <h4 className={`text-lg font-extrabold mb-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {isEn
                  ? 'Question 4: How many people are dining with you?'
                  : 'Câu 4: Bạn dự định dùng bữa với bao nhiêu người?'}
              </h4>
              <p className={`text-xs mb-4 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {isEn
                  ? 'Select one option or click Continue to skip filtering.'
                  : 'Bạn có thể chọn 1 đáp án hoặc bấm Tiếp tục nếu không muốn lọc.'}
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {PEOPLE_CHOICES.map(o => {
                  const active = answers.people === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => togglePeople(o.value)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        active
                          ? 'bg-[#ee2828]/15 border-[#ee2828]'
                          : isLight
                            ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                            : 'bg-[#2a221f] border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <span className={`font-extrabold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {isEn ? o.labelEn : o.label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          active ? 'bg-[#ee2828] border-[#ee2828]' : isLight ? 'border-zinc-300' : 'border-white/25'
                        }`}
                      >
                        {active && <Check size={13} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-end mt-5">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full sm:w-auto bg-[#ee2828] hover:bg-[#d42020] text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg cursor-pointer"
                >
                  {isEn ? 'Continue' : 'Tiếp tục'}
                </button>
              </div>
            </div>
          )}

          {/* ── CÂU 5: BẠN MUỐN LỰA CHỌN MÓN ĂN NÀO ─────────────────────────── */}
          {!loading && !error && !result && step === 4 && (
            <div className="pt-4">
              <h4 className={`text-lg font-extrabold mb-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {isEn
                  ? 'Question 5: Which categories are you craving?'
                  : 'Câu 5: Bạn muốn lựa chọn món ăn nào?'}
              </h4>
              <p className={`text-xs mb-4 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {isEn
                  ? 'You can select multiple categories (leave unselected to include all).'
                  : 'Có thể chọn nhiều đáp án (nếu không chọn, hệ thống sẽ giữ tất cả các món).'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORY_CHOICES.map(o => {
                  const disabledCombo = o.value === 'Combo' && answers.people === '1';
                  const checked = answers.categories.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={disabledCombo}
                      onClick={() => toggleCategory(o.value)}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                        disabledCombo
                          ? 'opacity-45 cursor-not-allowed bg-zinc-500/10 border-zinc-500/20'
                          : checked
                            ? 'bg-[#ee2828]/15 border-[#ee2828] cursor-pointer'
                            : isLight
                              ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 cursor-pointer'
                              : 'bg-[#2a221f] border-white/[0.06] hover:border-white/20 cursor-pointer'
                      }`}
                    >
                      <span className={`font-extrabold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {isEn ? o.labelEn : o.label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          checked ? 'bg-[#ee2828] border-[#ee2828]' : isLight ? 'border-zinc-300' : 'border-white/25'
                        }`}
                      >
                        {checked && <Check size={13} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-end mt-5">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="w-full sm:w-auto bg-[#ee2828] hover:bg-[#d42020] text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg cursor-pointer"
                >
                  {isEn ? 'Continue' : 'Tiếp tục'}
                </button>
              </div>
            </div>
          )}

          {/* ── CÂU 6: BẠN YÊU THÍCH NGUYÊN LIỆU NÀO ────────────────────────── */}
          {!loading && !error && !result && step === 5 && (
            <div className="pt-4">
              <h4 className={`text-lg font-extrabold mb-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {isEn
                  ? 'Question 6: Which ingredients do you love?'
                  : 'Câu 6: Bạn yêu thích nguyên liệu nào?'}
              </h4>
              <p className={`text-xs mb-4 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {isEn ? 'You can select multiple ingredients.' : 'Có thể chọn nhiều đáp án.'}
              </p>

              {availableIngredients.length === 0 ? (
                <p className={`text-sm py-6 text-center ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {isEn
                    ? 'You have filtered out all ingredient groups. Click Find Matching Dishes to see results.'
                    : 'Bạn đã chọn lọc hết các nhóm nguyên liệu ở câu trước. Hãy bấm Tìm món phù hợp để xem kết quả nhé.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableIngredients.map(item => {
                    const checked = answers.ingredients.includes(item.key);
                    const localIng = ALL_INGREDIENTS.find(x => x.key === item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleFavoriteIngredient(item.key)}
                        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          checked
                            ? 'bg-[#ee2828]/15 border-[#ee2828]'
                            : isLight
                              ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                              : 'bg-[#2a221f] border-white/[0.06] hover:border-white/20'
                        }`}
                      >
                        <span className={`font-bold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                          {isEn && localIng ? localIng.labelEn : item.label}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            checked ? 'bg-[#ee2828] border-[#ee2828]' : isLight ? 'border-zinc-300' : 'border-white/25'
                          }`}
                        >
                          {checked && <Check size={13} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-end mt-5">
                <button
                  type="button"
                  onClick={() => submit(answers)}
                  className="w-full sm:w-auto bg-[#ee2828] hover:bg-[#d42020] text-white font-black text-sm uppercase tracking-wider px-7 py-3.5 rounded-2xl shadow-lg cursor-pointer transition-all"
                >
                  {isEn ? 'Find Matching Dishes' : 'Tìm món phù hợp'}
                </button>
              </div>
            </div>
          )}

          {/* ── MÀN HÌNH KẾT QUẢ (HIỂN THỊ THEO % PHÙ HỢP) ───────────────────── */}
          {!loading && !error && result && (
            <div className="pt-3 space-y-4">
              {result.notices.length > 0 && (
                <div
                  className={`border rounded-2xl px-4 py-3 space-y-1 ${
                    isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
                  }`}
                >
                  {result.notices.map((n, i) => (
                    <p key={i} className={`text-xs font-semibold flex gap-2 ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>
                      <TriangleAlert size={14} className="shrink-0 mt-0.5" />
                      {n}
                    </p>
                  ))}
                </div>
              )}

              {displayedResults.length === 0 ? (
                <p className={`text-center text-sm py-8 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {isEn
                    ? 'No dishes matched all your criteria. Try relaxing some filters.'
                    : 'Chưa tìm được món ăn thỏa mãn tất cả điều kiện. Bạn thử giảm bớt điều kiện lọc nhé.'}
                </p>
              ) : (
                <section>
                  <div className="space-y-3">
                    {displayedResults.map(t => {
                      const itemKey = `${t.item_type || 'dish'}_${t.dish.dish_id}`;
                      const isAdded = added[itemKey];
                      return (
                        <div
                          key={`${t.rank}_${itemKey}`}
                          className={`border rounded-2xl p-3.5 ${
                            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#2a221f] border-white/[0.06]'
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl(t.dish.image)}
                              alt={t.dish.dish_name}
                              className={`w-20 h-20 rounded-xl object-cover shrink-0 border ${
                                isLight ? 'border-zinc-200' : 'border-white/10'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className={`font-extrabold text-[15px] leading-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                                    {td(t.dish.dish_name)}
                                  </p>
                                  <p className={`text-[11px] font-semibold mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    {t.item_type === 'combo'
                                      ? isEn
                                        ? 'Combo · Value Meal'
                                        : 'Combo · Trọn gói'
                                      : [td(t.dish.category || t.dish.category_label || ''), sizeText(t.variant)].filter(Boolean).join(' · ')}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 border text-[11px] font-black px-2.5 py-1 rounded-full ${
                                    isLight
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-[#007a3f]/25 text-emerald-300 border-emerald-500/30'
                                  }`}
                                >
                                  {isEn ? `${t.match_percent}% Match` : `Phù hợp ${t.match_percent}%`}
                                </span>
                              </div>
                              {t.dish.ingredient && t.dish.ingredient !== 'null' && (
                                <p className={`text-[11px] mt-1 line-clamp-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                  {t.item_type === 'combo' ? tc(t.dish.ingredient) : ti(t.dish.ingredient)}
                                </p>
                              )}
                              <ul className="mt-1.5 space-y-0.5">
                                {t.reasons.map((r, i) => (
                                  <li key={i} className={`text-xs flex gap-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-200'}`}>
                                    <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2.5 gap-2">
                            <span className={`font-black text-sm ${isLight ? 'text-[#ee2828]' : 'text-[#ffc107]'}`}>
                              {formatPrice(t.variant.price)}
                            </span>
                            <div className="flex items-center gap-2">
                              {t.item_type === 'combo' ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCombo(t)}
                                  className="text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 bg-[#007a3f] hover:bg-[#005a2e] text-white"
                                >
                                  <ShoppingCart size={13} />
                                  {isEn ? 'Add to Cart' : 'Thêm vào giỏ'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => addDishToCart(t)}
                                  className={`text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    isAdded
                                      ? isLight
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-emerald-600/30 text-emerald-200'
                                      : 'bg-[#007a3f] hover:bg-[#005a2e] text-white'
                                  }`}
                                >
                                  <ShoppingCart size={13} />
                                  {isAdded
                                    ? isEn
                                      ? 'Added'
                                      : 'Đã thêm'
                                    : isEn
                                      ? 'Add to Cart'
                                      : 'Thêm vào giỏ'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalResultsCount > 6 && (
                    <div className="text-center mt-3">
                      <button
                        type="button"
                        onClick={() => setShowAllItems(!showAllItems)}
                        className={`text-xs font-extrabold px-4 py-2 rounded-xl border cursor-pointer ${
                          isLight
                            ? 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                            : 'border-white/10 text-zinc-200 hover:bg-white/5'
                        }`}
                      >
                        {showAllItems
                          ? isEn
                            ? 'Show Less'
                            : 'Thu gọn danh sách'
                          : isEn
                            ? `View all ${totalResultsCount} matching dishes`
                            : `Xem toàn bộ ${totalResultsCount} món phù hợp`}
                      </button>
                    </div>
                  )}
                </section>
              )}

              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={reset}
                  className={`text-sm font-bold flex items-center gap-1.5 px-3 py-2 cursor-pointer ${
                    isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <RotateCcw size={15} /> {isEn ? 'Start Over' : 'Chọn lại từ đầu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {selectedCombo && (
        <ComboModal
          isOpen={!!selectedCombo}
          onClose={() => setSelectedCombo(null)}
          comboId={selectedCombo.dish.dish_id}
          comboName={selectedCombo.dish.dish_name}
          comboPrice={selectedCombo.variant.price}
          comboDescription={selectedCombo.dish.ingredient || ''}
          imageUrl={imgUrl(selectedCombo.dish.image)}
        />
      )}
    </>
  );
}
