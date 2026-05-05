import type { Language } from './translations';

// Bảng ánh xạ: Tên tiếng Anh trong DB → { vi, en, kr }
const menuMap: Record<string, Record<string, string>> = {
  // ── Categories ──
  'Pizza':              { vi: 'Pizza', en: 'Pizza', kr: '피자' },
  'Gratin / Risotto':   { vi: 'Gratin / Risotto', en: 'Gratin / Risotto', kr: '그라탱 / 리소토' },
  'Spaghetti':          { vi: 'Mì Ý', en: 'Spaghetti', kr: '스파게티' },
  'Salad / Side Dish':  { vi: 'Salad / Món phụ', en: 'Salad / Side Dish', kr: '샐러드 / 사이드' },
  'Drink':              { vi: 'Đồ uống', en: 'Drink', kr: '음료' },
  'Combo':              { vi: 'Combo', en: 'Combo', kr: '콤보' },

  // ── Sizes ──
  'Regular': { vi: 'Thường', en: 'Regular', kr: '레귤러' },
  'Large':   { vi: 'Lớn', en: 'Large', kr: '라지' },

  // ── Crusts ──
  'Pan Crust':    { vi: 'Đế Dày', en: 'Pan Crust', kr: '팬 크러스트' },
  'Thin Crust':   { vi: 'Đế Mỏng', en: 'Thin Crust', kr: '씬 크러스트' },
  'Cheese Crust': { vi: 'Viền Phô Mai', en: 'Cheese Crust', kr: '치즈 크러스트' },
  'Ham Crust':    { vi: 'Viền Giăm Bông', en: 'Ham Crust', kr: '햄 크러스트' },

  // ── Toppings ──
  'Vegetable':          { vi: 'Rau củ', en: 'Vegetable', kr: '야채' },
  'Cheese':             { vi: 'Phô Mai', en: 'Cheese', kr: '치즈' },
  'Beef':               { vi: 'Bò', en: 'Beef', kr: '소고기' },
  'Sweet potato crust': { vi: 'Đế khoai lang', en: 'Sweet potato crust', kr: '고구마 크러스트' },

  // ── Pizza ──
  'Texas Pizza':         { vi: 'Pizza Texas', en: 'Texas Pizza', kr: '텍사스 피자' },
  'BBQ Pizza':           { vi: 'Pizza BBQ', en: 'BBQ Pizza', kr: 'BBQ 피자' },
  'Kim Chi Pizza':       { vi: 'Pizza Kim Chi', en: 'Kim Chi Pizza', kr: '김치 피자' },
  'Tuna Pizza':          { vi: 'Pizza Cá Ngừ', en: 'Tuna Pizza', kr: '참치 피자' },
  'Super Supreme Pizza': { vi: 'Pizza Thập Cẩm Đặc Biệt', en: 'Super Supreme Pizza', kr: '슈퍼 슈프림 피자' },
  'Potato Pizza':        { vi: 'Pizza Khoai Tây', en: 'Potato Pizza', kr: '포테이토 피자' },
  'Hot Pizza':           { vi: 'Pizza Cay', en: 'Hot Pizza', kr: '핫 피자' },
  'Gold Pizza':          { vi: 'Pizza Vàng', en: 'Gold Pizza', kr: '골드 피자' },
  'Hawaiian Pizza':      { vi: 'Pizza Hawaii', en: 'Hawaiian Pizza', kr: '하와이안 피자' },
  'Vegetable Pizza':     { vi: 'Pizza Rau Củ', en: 'Vegetable Pizza', kr: '야채 피자' },
  'Seafood Pizza':       { vi: 'Pizza Hải Sản', en: 'Seafood Pizza', kr: '해산물 피자' },
  'Pepperoni Pizza':     { vi: 'Pizza Pepperoni', en: 'Pepperoni Pizza', kr: '페퍼로니 피자' },
  'Deluxe Pizza':        { vi: 'Pizza Deluxe', en: 'Deluxe Pizza', kr: '디럭스 피자' },

  // ── Spaghetti ──
  'Meat Spaghetti':          { vi: 'Mì Ý Sốt Bò', en: 'Meat Spaghetti', kr: '미트 스파게티' },
  'Chicken Red Spaghetti':   { vi: 'Mì Ý Gà Sốt Đỏ', en: 'Chicken Red Spaghetti', kr: '치킨 레드 스파게티' },
  'Seafood Red Spaghetti':   { vi: 'Mì Ý Hải Sản Sốt Đỏ', en: 'Seafood Red Spaghetti', kr: '해산물 레드 스파게티' },
  'Seafood White Spaghetti': { vi: 'Mì Ý Hải Sản Sốt Trắng', en: 'Seafood White Spaghetti', kr: '해산물 화이트 스파게티' },
  'Chicken White Spaghetti': { vi: 'Mì Ý Gà Sốt Trắng', en: 'Chicken White Spaghetti', kr: '치킨 화이트 스파게티' },
  'Chili Hot Spaghetti':     { vi: 'Mì Ý Ớt Cay', en: 'Chili Hot Spaghetti', kr: '칠리 핫 스파게티' },
  'Carbonara Spaghetti':     { vi: 'Mì Ý Carbonara', en: 'Carbonara Spaghetti', kr: '까르보나라 스파게티' },
  'Napolitan Spaghetti':     { vi: 'Mì Ý Napolitan', en: 'Napolitan Spaghetti', kr: '나폴리탄 스파게티' },

  // ── Risotto ──
  'Chicken White Risotto':  { vi: 'Risotto Gà Sốt Trắng', en: 'Chicken White Risotto', kr: '치킨 화이트 리소토' },
  'Chicken Red Risotto':    { vi: 'Risotto Gà Sốt Đỏ', en: 'Chicken Red Risotto', kr: '치킨 레드 리소토' },
  'Meat Risotto':           { vi: 'Risotto Bò', en: 'Meat Risotto', kr: '미트 리소토' },
  'Seafood Red Risotto':    { vi: 'Risotto Hải Sản Sốt Đỏ', en: 'Seafood Red Risotto', kr: '해산물 레드 리소토' },
  'Seafood White Risotto':  { vi: 'Risotto Hải Sản Sốt Trắng', en: 'Seafood White Risotto', kr: '해산물 화이트 리소토' },
  'Chili Hot Risotto':      { vi: 'Risotto Ớt Cay', en: 'Chili Hot Risotto', kr: '칠리 핫 리소토' },
  'Carbonara Risotto':      { vi: 'Risotto Carbonara', en: 'Carbonara Risotto', kr: '까르보나라 리소토' },
  'Napolitan Risotto':      { vi: 'Risotto Napolitan', en: 'Napolitan Risotto', kr: '나폴리탄 리소토' },
  'Kim Chi Risotto':        { vi: 'Risotto Kim Chi', en: 'Kim Chi Risotto', kr: '김치 리소토' },
  'Double Cream Risotto':   { vi: 'Risotto Kem Đôi', en: 'Double Cream Risotto', kr: '더블 크림 리소토' },

  // ── Grantin ──
  'Chicken White Grantin':  { vi: 'Grantin Gà Sốt Trắng', en: 'Chicken White Grantin', kr: '치킨 화이트 그라탱' },
  'Chicken Red Grantin':    { vi: 'Grantin Gà Sốt Đỏ', en: 'Chicken Red Grantin', kr: '치킨 레드 그라탱' },
  'Meat Grantin':           { vi: 'Grantin Bò', en: 'Meat Grantin', kr: '미트 그라탱' },
  'Seafood Red Grantin':    { vi: 'Grantin Hải Sản Sốt Đỏ', en: 'Seafood Red Grantin', kr: '해산물 레드 그라탱' },
  'Seafood White Grantin':  { vi: 'Grantin Hải Sản Sốt Trắng', en: 'Seafood White Grantin', kr: '해산물 화이트 그라탱' },
  'Chili Hot Grantin':      { vi: 'Grantin Ớt Cay', en: 'Chili Hot Grantin', kr: '칠리 핫 그라탱' },
  'Carbonara Grantin':      { vi: 'Grantin Carbonara', en: 'Carbonara Grantin', kr: '까르보나라 그라탱' },
  'Napolitan Grantin':      { vi: 'Grantin Napolitan', en: 'Napolitan Grantin', kr: '나폴리탄 그라탱' },
  'Kim Chi Grantin':        { vi: 'Grantin Kim Chi', en: 'Kim Chi Grantin', kr: '김치 그라탱' },
  'Double Cream Grantin':   { vi: 'Grantin Kem Đôi', en: 'Double Cream Grantin', kr: '더블 크림 그라탱' },

  // ── Salad / Side Dish ──
  'Garlic Bread':            { vi: 'Bánh Mì Bơ Tỏi', en: 'Garlic Bread', kr: '갈릭 브레드' },
  'French Fries':            { vi: 'Khoai Tây Chiên', en: 'French Fries', kr: '감자튀김' },
  'BBQ Wing (6 pieces)':     { vi: 'Cánh Gà BBQ (6 miếng)', en: 'BBQ Wing (6 pieces)', kr: 'BBQ 윙 (6조각)' },
  'BBQ Wing (10 pieces)':    { vi: 'Cánh Gà BBQ (10 miếng)', en: 'BBQ Wing (10 pieces)', kr: 'BBQ 윙 (10조각)' },
  'Fried Chicken (2 pieces)':{ vi: 'Gà Rán (2 miếng)', en: 'Fried Chicken (2 pieces)', kr: '후라이드 치킨 (2조각)' },
  'Fried Chicken (6 pieces)':{ vi: 'Gà Rán (6 miếng)', en: 'Fried Chicken (6 pieces)', kr: '후라이드 치킨 (6조각)' },
  'Salad A (Giấm tây)':      { vi: 'Salad A (Giấm tây)', en: 'Salad A (Balsamic)', kr: '샐러드 A (발사믹)' },
  'Salad B (Mayonnaise)':    { vi: 'Salad B (Mayonnaise)', en: 'Salad B (Mayonnaise)', kr: '샐러드 B (마요네즈)' },

  // ── Drinks ──
  'Pepsi':          { vi: 'Pepsi', en: 'Pepsi', kr: '펩시' },
  '7 up':           { vi: '7 Up', en: '7 Up', kr: '7업' },
  'Pepsi zero':     { vi: 'Pepsi Zero', en: 'Pepsi Zero', kr: '펩시 제로' },
  'Pepsi pet 1,5l': { vi: 'Pepsi chai 1,5L', en: 'Pepsi Pet 1.5L', kr: '펩시 1.5L' },
  'Mirinda Orange': { vi: 'Mirinda Cam', en: 'Mirinda Orange', kr: '미린다 오렌지' },
  'Sting':          { vi: 'Sting', en: 'Sting', kr: '스팅' },
  'Soda':           { vi: 'Soda', en: 'Soda', kr: '소다' },
  'Aquafina Water': { vi: 'Nước Aquafina', en: 'Aquafina Water', kr: '아쿠아피나' },
  'Tiger Beer':     { vi: 'Bia Tiger', en: 'Tiger Beer', kr: '타이거 맥주' },
  'Orange Juice':   { vi: 'Nước Cam', en: 'Orange Juice', kr: '오렌지 주스' },
  'Lemon Juice':    { vi: 'Nước Chanh', en: 'Lemon Juice', kr: '레몬 주스' },
  'Apple Juice':    { vi: 'Nước Táo', en: 'Apple Juice', kr: '사과 주스' },

  // ── Combos ──
  'Combo A':      { vi: 'Combo A', en: 'Combo A', kr: '콤보 A' },
  'Combo B':      { vi: 'Combo B', en: 'Combo B', kr: '콤보 B' },
  'Combo C':      { vi: 'Combo C', en: 'Combo C', kr: '콤보 C' },
  'Happy Meal':   { vi: 'Bữa Vui Vẻ', en: 'Happy Meal', kr: '해피밀' },
  'Happy Family': { vi: 'Gia Đình Vui Vẻ', en: 'Happy Family', kr: '해피 패밀리' },
};

// ── Ingredient translations ──
const ingredientWords: Record<string, Record<string, string>> = {
  'Beefsteak':        { vi: 'Bít tết bò', kr: '비프스테이크' },
  'Mushroom':         { vi: 'Nấm', kr: '버섯' },
  'Onion':            { vi: 'Hành tây', kr: '양파' },
  'Green Pepper':     { vi: 'Ớt chuông xanh', kr: '피망' },
  'Corn':             { vi: 'Bắp', kr: '옥수수' },
  'Black Olive':      { vi: 'Ô liu đen', kr: '블랙 올리브' },
  'Ham':              { vi: 'Giăm bông', kr: '햄' },
  'Pepperoni':        { vi: 'Pepperoni', kr: '페퍼로니' },
  'Tomato':           { vi: 'Cà chua', kr: '토마토' },
  'Mozzarella Cheese':{ vi: 'Phô mai Mozzarella', kr: '모짜렐라 치즈' },
  'Mozzarella':       { vi: 'Phô mai Mozzarella', kr: '모짜렐라' },
  'Beef with BBQ Sauce': { vi: 'Bò sốt BBQ', kr: 'BBQ 소스 소고기' },
  'Kim Chi':          { vi: 'Kim Chi', kr: '김치' },
  'Kim chi':          { vi: 'Kim Chi', kr: '김치' },
  'Bacon':            { vi: 'Thịt xông khói', kr: '베이컨' },
  'Tuna Fish with Mayonnaise': { vi: 'Cá ngừ sốt mayonnaise', kr: '마요네즈 참치' },
  'Beef':             { vi: 'Bò', kr: '소고기' },
  'Sweet Potato':     { vi: 'Khoai lang', kr: '고구마' },
  'Pineapple':        { vi: 'Dứa', kr: '파인애플' },
  'Shrimp':           { vi: 'Tôm', kr: '새우' },
  'Squid':            { vi: 'Mực', kr: '오징어' },
  'Tomato sauce':     { vi: 'Sốt cà chua', kr: '토마토 소스' },
  'Tomato Sauce':     { vi: 'Sốt cà chua', kr: '토마토 소스' },
  'Chicken':          { vi: 'Gà', kr: '치킨' },
  'Broccoli':         { vi: 'Bông cải xanh', kr: '브로콜리' },
  'Carrot':           { vi: 'Cà rốt', kr: '당근' },
  'Cream Sauce':      { vi: 'Sốt kem', kr: '크림 소스' },
  'Cream  Sauce':     { vi: 'Sốt kem', kr: '크림 소스' },
  'Chili':            { vi: 'Ớt', kr: '칠리' },
  'Dry Chilli':       { vi: 'Ớt khô', kr: '건고추' },
  'Chilli Powder':    { vi: 'Bột ớt', kr: '칠리 파우더' },
  'Tabasco Sauce':    { vi: 'Sốt Tabasco', kr: '타바스코 소스' },
  'Parmersan Cheese': { vi: 'Phô mai Parmesan', kr: '파르메산 치즈' },
  'Saugage':          { vi: 'Xúc xích', kr: '소시지' },
  'Balsamic Vinegar': { vi: 'Giấm Balsamic', kr: '발사믹 식초' },
  'Olive Oil':        { vi: 'Dầu ô liu', kr: '올리브 오일' },
  'Salad':            { vi: 'Salad', kr: '샐러드' },
  'Vegetable':        { vi: 'Rau củ', kr: '야채' },
  'Thoudsand Island Dressing Sauce': { vi: 'Sốt Thousand Island', kr: '사우전드 아일랜드 소스' },
  'Baby Corn':        { vi: 'Bắp non', kr: '베이비 콘' },
  'Boiled Potato':    { vi: 'Khoai tây luộc', kr: '삶은 감자' },
  'Cabbage':          { vi: 'Bắp cải', kr: '양배추' },
  'Red Cabbage':      { vi: 'Bắp cải tím', kr: '적양배추' },
  'Cream Sauce *2':   { vi: 'Sốt kem x2', kr: '크림 소스 x2' },
  'Potato':           { vi: 'Khoai tây', kr: '감자' },
  'Tomato Souce':     { vi: 'Sốt cà chua', kr: '토마토 소스' },
  'Cream Souce':      { vi: 'Sốt kem', kr: '크림 소스' },
};

/**
 * Dịch tên món/danh mục từ DB sang ngôn ngữ đích.
 * Trả về văn bản gốc nếu không tìm thấy bản dịch.
 */
export function translateMenu(text: string, lang: string): string {
  if (!text) return text;
  // Khớp trực tiếp trước
  if (menuMap[text]?.[lang]) return menuMap[text][lang];
  // Nếu ngôn ngữ là tiếng Anh, trả về gốc (DB đã là tiếng Anh)
  if (lang === 'en') return text;
  return text;
}

/**
 * Dịch chuỗi nguyên liệu (phân cách bằng dấu phẩy) sang ngôn ngữ đích.
 */
export function translateIngredients(text: string, lang: string): string {
  if (!text || lang === 'en') return text;

  // Thử khớp trực tiếp trước
  if (menuMap[text]?.[lang]) return menuMap[text][lang];

  // Tách theo dấu phẩy và dịch từng phần
  const parts = text.split(',').map(p => p.trim());
  const translated = parts.map(part => {
    // Khớp chính xác
    if (ingredientWords[part]?.[lang]) return ingredientWords[part][lang];
    // Khớp không phân biệt hoa thường
    const key = Object.keys(ingredientWords).find(k => k.toLowerCase() === part.toLowerCase());
    if (key && ingredientWords[key]?.[lang]) return ingredientWords[key][lang];
    return part;
  });
  return translated.join(', ');
}
