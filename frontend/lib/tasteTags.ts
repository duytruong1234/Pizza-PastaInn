export interface TasteBadge {
  key: 'chay' | 'cay' | 'hai_san' | 'pho_mai';
  label: string;
  className: string;
}

const SPICY_REGEX = /\b(spicy|chili|chilli|jalapeno|jalapeño|tabasco|arrabbiata|diavola|cay|ớt)\b/i;
const SEAFOOD_REGEX =
  /\b(seafood|shrimp|prawn|squid|calamari|tuna|salmon|octopus|clam|mussel|crab|anchov|pescatore|frutti di mare|hải sản|tôm|mực|cá ngừ|cá hồi|nghêu)\b/i;
const EXTRA_CHEESE_REGEX =
  /\b(4 cheese|four cheese|quattro formaggi|burrata|ricotta|gorgonzola|mascarpone|parmesan|cheddar|mozzarella|phô mai|cheese)\b/i;

export function analyzeProductTaste(params: {
  name: string;
  ingredients?: string;
  dish_type?: string;
}) {
  const combined = `${params.name || ''} ${params.ingredients || ''}`.toLowerCase();
  const isVegetarian = params.dish_type === 'chay' || /\b(vegetarian|veggie|chay)\b/i.test(combined);
  const isSpicy = SPICY_REGEX.test(combined);
  const isSeafood = SEAFOOD_REGEX.test(combined);
  const isCheesy = EXTRA_CHEESE_REGEX.test(combined);

  const badges: TasteBadge[] = [];

  if (isVegetarian) {
    badges.push({
      key: 'chay',
      label: 'Chay',
      className: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/45',
    });
  }
  if (isSpicy) {
    badges.push({
      key: 'cay',
      label: 'Cay nhẹ',
      className: 'bg-red-500/25 text-red-200 border-red-400/45',
    });
  }
  if (isSeafood) {
    badges.push({
      key: 'hai_san',
      label: 'Hải sản',
      className: 'bg-sky-500/25 text-sky-200 border-sky-400/45',
    });
  } else if (isCheesy && badges.length < 2) {
    badges.push({
      key: 'pho_mai',
      label: 'Phô mai',
      className: 'bg-amber-400/25 text-amber-200 border-amber-300/45',
    });
  }

  return {
    isVegetarian,
    isSpicy,
    isSeafood,
    isCheesy,
    badges: badges.slice(0, 2),
  };
}
