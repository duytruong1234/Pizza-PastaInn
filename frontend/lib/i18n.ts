export type Language = 'vi' | 'en';

export const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Header & Navigation
    'nav.menu': 'Thực đơn',
    'nav.lookup': 'Tra cứu đơn',
    'nav.about': 'Giới thiệu',
    'nav.reviews': 'Đánh giá',
    'nav.branches': 'Chi nhánh',
    'nav.login': 'Đăng nhập',
    'nav.register': 'Đăng ký',
    'nav.profile': 'Tài khoản của tôi',
    'nav.orders': 'Đơn hàng của tôi',
    'nav.wishlist': 'Món yêu thích',
    'nav.vouchers': 'Ưu đãi & Điểm thưởng',
    'nav.logout': 'Đăng xuất',
    'nav.theme_light': 'Chuyển sang chế độ sáng',
    'nav.theme_dark': 'Chuyển sang chế độ tối',
    'nav.lang_switch': 'Switch to English',

    // Home & Menu Catalog
    'home.featured': 'Nổi bật',
    'home.popular_title': 'Món Phổ Biến',
    'home.popular_desc': 'Những món ngon được thực khách yêu thích và đặt nhiều nhất',
    'home.top_rated_title': 'Món Đánh Giá Cao',
    'home.top_rated_desc': 'Những món ăn được thực khách khen ngợi nhiều nhất',
    'home.reorder_title': 'Đặt Lại Món Yêu Thích',
    'home.reorder_desc': 'Các món bạn thường hay đặt nhất tại quán',
    'home.suggest_title': 'Gợi ý tương tự khẩu vị của bạn',
    'home.suggest_desc': 'Các món mới dựa trên lịch sử đặt hàng của bạn',
    'home.search_placeholder': 'Tìm pizza, mì Ý, đồ uống...',
    'home.search_results_for': 'Kết quả tìm kiếm cho',
    'home.clear_search': 'Xoá tìm kiếm',
    'home.no_dishes': 'Không tìm thấy món ăn phù hợp.',
    'home.filter_all': 'Tất cả',
    'home.best_seller': 'Bán chạy',
    'home.ordered_times': 'Đã đặt {count} lần',

    // Product Card & Modals
    'product.add_to_cart': 'Thêm vào giỏ',
    'product.choose_flavor': 'Chọn vị',
    'product.half_half_price': 'Tuỳ chọn 2 vị',
    'product.half_half_desc': 'Kết hợp 2 vị pizza yêu thích trong 1 bánh',
    'product.custom_option': 'Tuỳ chọn',
    'product.wishlist_add': 'Lưu vào món yêu thích',
    'product.wishlist_remove': 'Bỏ khỏi món yêu thích',
    'product.badge_veg': 'Chay',
    'product.badge_spicy': 'Cay',
    'product.badge_seafood': 'Hải sản',
    'product.badge_cheese': 'Phô mai',
    'product.select_size': 'Chọn kích thước',
    'product.select_crust': 'Chọn đế bánh',
    'product.extra_toppings': 'Thêm nhân (Topping)',
    'product.quantity': 'Số lượng',
    'product.note': 'Ghi chú cho món này',
    'product.note_placeholder': 'Ví dụ: ít hành, nướng kỹ...',
    'product.pairings_title': 'Món ăn kèm gợi ý',
    'product.similar_title': 'Món tương tự',
    'product.total': 'Tổng cộng',
    'product.close': 'Đóng',

    // Cart Sidebar
    'cart.title': 'Giỏ hàng của bạn',
    'cart.empty_title': 'Giỏ hàng đang trống',
    'cart.empty_desc': 'Hãy chọn những món Pizza và Mì Ý nóng hổi từ thực đơn nhé.',
    'cart.subtotal': 'Tạm tính',
    'cart.checkout': 'Thanh toán ngay',
    'cart.clear_all': 'Xoá tất cả',
    'cart.pin': 'Ghim giỏ hàng',
    'cart.unpin': 'Bỏ ghim giỏ hàng',
    'cart.together_title': 'Thường được đặt kèm',

    // Footer
    'footer.desc': 'Phục vụ Pizza nướng lò, Mì Ý Spaghetti, Cơm đút lò Risotto/Gratin và Salad tươi mỗi ngày tại TP. Hồ Chí Minh.',
    'footer.quick_links': 'Liên kết nhanh',
    'footer.policies': 'Chính sách & Hỗ trợ',
    'footer.delivery_policy': 'Chính sách giao hàng',
    'footer.privacy_policy': 'Chính sách bảo mật',
    'footer.terms': 'Điều khoản dịch vụ',
    'footer.branches': 'Hệ thống chi nhánh',
    'footer.hours': 'Giờ mở cửa',
    'footer.rights': 'Bản quyền thuộc về Pizza & Pasta Inn.',

    // QuickDock (Quiz & Chat)
    'dock.quiz_btn': 'Gợi ý chọn món',
    'dock.chat_btn': 'Chat với quán',
    'dock.support_title': 'Hỗ trợ trực tuyến',
  },
  en: {
    // Header & Navigation
    'nav.menu': 'Menu',
    'nav.lookup': 'Track Order',
    'nav.about': 'About Us',
    'nav.reviews': 'Reviews',
    'nav.branches': 'Branches',
    'nav.login': 'Sign In',
    'nav.register': 'Sign Up',
    'nav.profile': 'My Account',
    'nav.orders': 'My Orders',
    'nav.wishlist': 'Wishlist',
    'nav.vouchers': 'Rewards & Vouchers',
    'nav.logout': 'Sign Out',
    'nav.theme_light': 'Switch to light mode',
    'nav.theme_dark': 'Switch to dark mode',
    'nav.lang_switch': 'Chuyển sang Tiếng Việt',

    // Home & Menu Catalog
    'home.featured': 'Featured',
    'home.popular_title': 'Popular Dishes',
    'home.popular_desc': 'Customer favorites ordered the most at our restaurant',
    'home.top_rated_title': 'Top Rated Dishes',
    'home.top_rated_desc': 'Highest rated dishes reviewed by our guests',
    'home.reorder_title': 'Order Again',
    'home.reorder_desc': 'Your most frequently ordered dishes',
    'home.suggest_title': 'Recommended For Your Taste',
    'home.suggest_desc': 'Dishes tailored to your ordering history',
    'home.search_placeholder': 'Search pizza, pasta, drinks...',
    'home.search_results_for': 'Search results for',
    'home.clear_search': 'Clear search',
    'home.no_dishes': 'No matching dishes found.',
    'home.filter_all': 'All',
    'home.best_seller': 'Best Seller',
    'home.ordered_times': 'Ordered {count} times',

    // Product Card & Modals
    'product.add_to_cart': 'Add to Cart',
    'product.choose_flavor': 'Select Halves',
    'product.half_half_price': '2 Flavors',
    'product.half_half_desc': 'Combine 2 favorite pizza flavors in one pizza',
    'product.custom_option': 'Options',
    'product.wishlist_add': 'Add to Wishlist',
    'product.wishlist_remove': 'Remove from Wishlist',
    'product.badge_veg': 'Vegetarian',
    'product.badge_spicy': 'Spicy',
    'product.badge_seafood': 'Seafood',
    'product.badge_cheese': 'Cheese',
    'product.select_size': 'Select Size',
    'product.select_crust': 'Select Crust',
    'product.extra_toppings': 'Extra Toppings',
    'product.quantity': 'Quantity',
    'product.note': 'Special Instructions',
    'product.note_placeholder': 'E.g., less onion, well done...',
    'product.pairings_title': 'Recommended Sides',
    'product.similar_title': 'Similar Dishes',
    'product.total': 'Total',
    'product.close': 'Close',

    // Cart Sidebar
    'cart.title': 'Your Cart',
    'cart.empty_title': 'Your cart is empty',
    'cart.empty_desc': 'Explore our menu to add oven-baked pizzas and fresh pasta.',
    'cart.subtotal': 'Subtotal',
    'cart.checkout': 'Proceed to Checkout',
    'cart.clear_all': 'Clear All',
    'cart.pin': 'Pin Cart',
    'cart.unpin': 'Unpin Cart',
    'cart.together_title': 'Frequently Bought Together',

    // Footer
    'footer.desc': 'Serving oven-baked Pizza, traditional Spaghetti, creamy Risotto/Gratin, and fresh Salad daily in Ho Chi Minh City.',
    'footer.quick_links': 'Quick Links',
    'footer.policies': 'Policies & Support',
    'footer.delivery_policy': 'Delivery Policy',
    'footer.privacy_policy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.branches': 'Our Branches',
    'footer.hours': 'Opening Hours',
    'footer.rights': 'All rights reserved by Pizza & Pasta Inn.',

    // QuickDock (Quiz & Chat)
    'dock.quiz_btn': 'Dish Finder',
    'dock.chat_btn': 'Live Chat',
    'dock.support_title': 'Customer Support',
  },
};

/**
 * Từ điển dịch từng thành phần nguyên liệu món ăn (EN -> VI)
 */
const INGREDIENT_TOKEN_VI: Array<[RegExp, string]> = [
  [/\bBeef with BBQ Sauce\b/gi, 'Thịt bò sốt BBQ'],
  [/\bTuna Fish with Mayonnaise\b/gi, 'Cá ngừ sốt Mayonnaise'],
  [/\bThoudsand Island Dressing Sauce\b/gi, 'Sốt Thousand Island (Mayonnaise)'],
  [/\bThousand Island Dressing Sauce\b/gi, 'Sốt Thousand Island (Mayonnaise)'],
  [/\bCream\s*Sauce\s*\*2\b/gi, 'Gấp đôi sốt kem tươi'],
  [/\bCream\s*Souce\b/gi, 'Sốt kem tươi'],
  [/\bCream\s*Sauce\b/gi, 'Sốt kem tươi'],
  [/\bTomato\s*Souce\b/gi, 'Sốt cà chua'],
  [/\bTomato\s*Sauce\b/gi, 'Sốt cà chua'],
  [/\bTabasco\s*Sauce\b/gi, 'Sốt ớt Tabasco'],
  [/\bMozzarella(?:\s*Cheese)?\b/gi, 'Phô mai Mozzarella'],
  [/\bParmersan(?:\s*Cheese)?\b/gi, 'Phô mai Parmesan'],
  [/\bParmesan(?:\s*Cheese)?\b/gi, 'Phô mai Parmesan'],
  [/\bBalsamic\s*Vinegar\b/gi, 'Giấm Balsamic'],
  [/\bOlive\s*Oil\b/gi, 'Dầu ô liu'],
  [/\bGreen\s*Pepper\b/gi, 'Ớt chuông xanh'],
  [/\bBlack\s*Olive\b/gi, 'Ô liu đen'],
  [/\bSweet\s*Potato\b/gi, 'Khoai lang'],
  [/\bBoiled\s*Potato\b/gi, 'Khoai tây luộc'],
  [/\bPotato\b/gi, 'Khoai tây'],
  [/\bBaby\s*Corn\b/gi, 'Bắp non'],
  [/\bCorn\b/gi, 'Bắp ngọt'],
  [/\bRed\s*Cabbage\b/gi, 'Bắp cải tím'],
  [/\bCabbage\b/gi, 'Bắp cải trắng'],
  [/\bChilli\s*Powder\b/gi, 'Bột ớt'],
  [/\bDry\s*Chilli\b/gi, 'Ớt khô'],
  [/\bChili\b/gi, 'Ớt tươi'],
  [/\bBeefsteak\b/gi, 'Thịt bò bít tết'],
  [/\bBeef\b/gi, 'Thịt bò'],
  [/\bPork\b/gi, 'Thịt heo'],
  [/\bBacon\b/gi, 'Thịt xông khói'],
  [/\bHam\b/gi, 'Giăm bông'],
  [/\bPepperoni\b/gi, 'Xúc xích Pepperoni'],
  [/\bSaugage\b/gi, 'Xúc xích'],
  [/\bSausage\b/gi, 'Xúc xích'],
  [/\bChicken\b/gi, 'Thịt gà'],
  [/\bShrimp\b/gi, 'Tôm'],
  [/\bSquid\b/gi, 'Mực'],
  [/\bKim\s*Chi\b/gi, 'Kim chi'],
  [/\bMushroom\b/gi, 'Nấm'],
  [/\bOnion\b/gi, 'Hành tây'],
  [/\bBroccoli\b/gi, 'Bông cải xanh'],
  [/\bCarrot\b/gi, 'Cà rốt'],
  [/\bTomato\b/gi, 'Cà chua'],
  [/\bPineapple\b/gi, 'Thơm (Dứa)'],
  [/\bSalad\b/gi, 'Xà lách'],
  [/\bVegetable\b/gi, 'Rau củ tươi'],
];

/**
 * Dịch chuỗi thành phần nguyên liệu món ăn theo ngôn ngữ đang chọn (vi | en)
 */
export function translateIngredients(text: string | null | undefined, lang: Language): string {
  if (!text) return '';

  // Làm sạch lỗi chính tả tiếng Anh gốc trong DB trước
  const cleaned = text
    .replace(/\u00a0/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/Garilc/gi, 'Garlic')
    .replace(/Gralic/gi, 'Garlic')
    .replace(/Grantin/gi, 'Gratin')
    .replace(/Saugage/gi, 'Sausage')
    .replace(/Parmersan/gi, 'Parmesan')
    .replace(/Souce/gi, 'Sauce')
    .replace(/Thoudsand/gi, 'Thousand')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (lang === 'en') {
    return cleaned;
  }

  // Dịch sang tiếng Việt khi lang === 'vi'
  let viText = cleaned;
  for (const [pattern, replacement] of INGREDIENT_TOKEN_VI) {
    viText = viText.replace(pattern, replacement);
  }
  return viText.replace(/Phô mai\s+Phô mai/gi, 'Phô mai');
}

/**
 * Dịch tên danh mục, kích thước, đế bánh, topping, nhãn vị và tên món đặc thù
 */
const DYNAMIC_MAP_VI: Record<string, string> = {
  // Categories
  'Pizza': 'Pizza',
  'Spaghetti': 'Mì Ý Spaghetti',
  'Gratin / Risotto': 'Đút Lò / Cơm Ý',
  'Risotto / Gratin': 'Cơm Ý / Đút Lò',
  'Salad / Side Dish': 'Salad & Món Phụ',
  'Drink': 'Thức Uống',
  'Drinks': 'Thức Uống',
  'Combo': 'Combo Tiết Kiệm',
  'Nổi bật': 'Nổi bật',
  // Sizes
  'Regular': 'Cỡ Vừa (M)',
  'Large': 'Cỡ Lớn (L)',
  'Standard': 'Tiêu Chuẩn',
  // Crusts
  'Pan Crust': 'Đế Dày Xốp',
  'Thin Crust': 'Đế Mỏng Giòn',
  'Cheese Crust': 'Viền Phô Mai',
  'Ham Crust': 'Viền Giăm Bông',
  // Toppings
  'Vegetable': 'Rau củ tươi',
  'Beef': 'Thịt bò',
  'Sweet potato crust': 'Viền khoai lang',
  'Cheese': 'Phô mai Mozzarella',
  // Badges
  'Chay': 'Chay',
  'Cay': 'Cay',
  'Hải sản': 'Hải sản',
  'Phô mai': 'Phô mai',
  'Bán chạy': 'Bán chạy',
};

const DYNAMIC_MAP_EN: Record<string, string> = {
  // Categories
  'Pizza': 'Pizza',
  'Spaghetti': 'Spaghetti',
  'Gratin / Risotto': 'Gratin / Risotto',
  'Risotto / Gratin': 'Risotto / Gratin',
  'Salad / Side Dish': 'Salad & Sides',
  'Salad & Món Phụ': 'Salad & Sides',
  'Drink': 'Drinks',
  'Thức Uống': 'Drinks',
  'Nước Uống': 'Drinks',
  'Combo': 'Value Combos',
  'Combo Tiết Kiệm': 'Value Combos',
  'Nổi bật': 'Featured',
  // Sizes
  'Regular': 'Regular (M)',
  'Cỡ Vừa (M)': 'Regular (M)',
  'Cỡ vừa': 'Regular (M)',
  'Large': 'Large (L)',
  'Cỡ Lớn (L)': 'Large (L)',
  'Cỡ lớn': 'Large (L)',
  'Standard': 'Standard',
  'Tiêu Chuẩn': 'Standard',
  'Tiêu chuẩn': 'Standard',
  // Crusts
  'Pan Crust': 'Pan Crust',
  'Đế Dày': 'Pan Crust',
  'Đế Dày Xốp': 'Pan Crust',
  'Thin Crust': 'Thin Crust',
  'Đế Mỏng': 'Thin Crust',
  'Đế Mỏng Giòn': 'Thin Crust',
  'Cheese Crust': 'Cheese Crust',
  'Viền Phô Mai': 'Cheese Crust',
  'Ham Crust': 'Ham Crust',
  'Viền Giăm Bông': 'Ham Crust',
  // Toppings
  'Vegetable': 'Fresh Vegetables',
  'Rau củ tươi': 'Fresh Vegetables',
  'Beef': 'Beef',
  'Thịt bò': 'Beef',
  'Sweet potato crust': 'Sweet Potato Crust',
  'Viền khoai lang': 'Sweet Potato Crust',
  'Cheese': 'Mozzarella Cheese',
  'Phô mai Mozzarella': 'Mozzarella Cheese',
  // Badges
  'Chay': 'Vegetarian',
  'Cay': 'Spicy',
  'Hải sản': 'Seafood',
  'Phô mai': 'Cheese',
  'Bán chạy': 'Best Seller',
  // Dish names with Vietnamese parentheses
  'Salad A (Giấm tây)': 'Salad A (Balsamic Vinegar)',
};

export function translateDynamic(text: string | null | undefined, lang: Language): string {
  if (!text) return '';
  const trimmed = text.replace(/\u00a0/g, ' ').trim();
  const cleaned = trimmed
    .replace(/Grantin/gi, 'Gratin')
    .replace(/Garilc/gi, 'Garlic')
    .replace(/Gralic/gi, 'Garlic');

  if (lang === 'vi') {
    if (DYNAMIC_MAP_VI[cleaned]) return DYNAMIC_MAP_VI[cleaned];
    if (DYNAMIC_MAP_VI[trimmed]) return DYNAMIC_MAP_VI[trimmed];
    return cleaned;
  } else {
    if (DYNAMIC_MAP_EN[cleaned]) return DYNAMIC_MAP_EN[cleaned];
    if (DYNAMIC_MAP_EN[trimmed]) return DYNAMIC_MAP_EN[trimmed];
    return cleaned;
  }
}

/**
 * Dịch mô tả Combo sang tiếng Việt hoặc tiếng Anh
 */
export function translateComboDescription(text: string | null | undefined, lang: Language): string {
  if (!text) return '';
  const cleaned = text
    .replace(/\u00a0/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/Garilc/gi, 'Garlic')
    .replace(/Gralic/gi, 'Garlic')
    .replace(/Grantin/gi, 'Gratin');

  if (lang === 'en') {
    return cleaned;
  }

  return cleaned
    .replace(/Choose 1 Pizza Regular Size/gi, 'Chọn 1 Pizza cỡ vừa (M)')
    .replace(/Choose 1 Pizza Large Size/gi, 'Chọn 1 Pizza cỡ lớn (L)')
    .replace(/1 Super Supreme Pizza Regular Size with Cheese Crust/gi, '1 Pizza Super Supreme cỡ vừa viền phô mai')
    .replace(/1 Gold Pizza Regular Size with Cheese Crust/gi, '1 Pizza Gold cỡ vừa viền phô mai')
    .replace(/Choose Salad or BBQ Wing\s*\(10 pieces\)/gi, 'Chọn 1 Salad hoặc Cánh gà BBQ (10 miếng)')
    .replace(/Choose 1 Spaghetti or Gratin or Risotto/gi, 'Chọn 1 Mì Ý, Đút lò hoặc Cơm Ý')
    .replace(/1 Meat Gratin/gi, '1 Đút lò bò bằm (Meat Gratin)')
    .replace(/BBQ Wing\s*10 Pieces/gi, 'Cánh gà nướng BBQ (10 miếng)')
    .replace(/Free Garlic Bread\s*(\d+)\s*Pieces/gi, 'Tặng bánh mì bơ tỏi ($1 miếng)')
    .replace(/(\d+)\s*Pieces Garlic Bread/gi, '$1 miếng bánh mì bơ tỏi')
    .replace(/Choose Pepsi 4 can or 1 Pepsi 1[,.]5L/gi, 'Chọn 4 lon Pepsi hoặc 1 chai Pepsi 1.5L')
    .replace(/Pepsi\s*(\d+)\s*can/gi, '$1 lon Pepsi')
    .replace(/(\d+)\s*Pepsi/gi, '$1 lon Pepsi');
}
