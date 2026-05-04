export type Language = 'vi' | 'en' | 'kr';

export const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Header
    'nav.menu': 'Thực đơn',
    'nav.branches': 'Chi nhánh',
    'nav.about': 'Giới thiệu',
    'nav.login': 'Đăng nhập',

    // Search
    'search.placeholder': 'Tìm kiếm',
    'search.clearTitle': 'Xóa tìm kiếm',

    // Search results
    'search.resultsFor': 'Kết quả tìm kiếm cho:',
    'search.results': 'kết quả',

    // Empty state
    'empty.title': 'Không tìm thấy món nào',
    'empty.subtitle': 'Thử tìm kiếm với từ khóa khác nhé!',

    // Promo
    'promo.halfHalf': 'Bạn muốn half/half pizza không?',

    // Product Card
    'product.addToCart': 'Thêm vào giỏ',

    // Product Modal
    'modal.size': 'Kích thước (*):',
    'modal.crust': 'Đế bánh (*):',
    'modal.toppings': 'Món thêm:',
    'modal.notes': 'Ghi chú:',
    'modal.notesPlaceholder': 'Hãy để lại ghi chú về lưu ý món ăn của bạn nhé!!!',
    'modal.addToCart': 'Thêm vào giỏ hàng',

    // Cart
    'cart.title': 'Giỏ hàng',
    'cart.quantity': 'Số lượng:',
    'cart.items': 'món',
    'cart.empty': 'Giỏ hàng của bạn đang trống',
    'cart.size': 'Kích thước',
    'cart.crust': 'Đế bánh',
    'cart.topping': 'Topping',
    'cart.note': 'Ghi chú',
    'cart.edit': 'Sửa',
    'cart.delete': 'Xóa',
    'cart.pizzaPrice': 'Giá pizza',
    'cart.extraToppings': 'Topping thêm',
    'cart.payNow': 'Thanh toán:',
  },

  en: {
    // Header
    'nav.menu': 'Menu',
    'nav.branches': 'Branches',
    'nav.about': 'About Us',
    'nav.login': 'Log in',

    // Search
    'search.placeholder': 'Search',
    'search.clearTitle': 'Clear search',

    // Search results
    'search.resultsFor': 'Search results for:',
    'search.results': 'results',

    // Empty state
    'empty.title': 'No dishes found',
    'empty.subtitle': 'Try searching with different keywords!',

    // Promo
    'promo.halfHalf': 'Go Half & Half?',

    // Product Card
    'product.addToCart': 'Add to cart',

    // Product Modal
    'modal.size': 'Size (*):',
    'modal.crust': 'Crust (*):',
    'modal.toppings': 'Extra toppings:',
    'modal.notes': 'Notes:',
    'modal.notesPlaceholder': 'Leave a note about your order...',
    'modal.addToCart': 'Add to cart',

    // Cart
    'cart.title': 'My Cart',
    'cart.quantity': 'Quantity:',
    'cart.items': 'items',
    'cart.empty': 'Your cart is empty',
    'cart.size': 'Size',
    'cart.crust': 'Crust',
    'cart.topping': 'Topping',
    'cart.note': 'Note',
    'cart.edit': 'Edit',
    'cart.delete': 'Delete',
    'cart.pizzaPrice': 'Pizza Price',
    'cart.extraToppings': 'Extra Toppings',
    'cart.payNow': 'Pay Now:',
  },

  kr: {
    // Header
    'nav.menu': '메뉴',
    'nav.branches': '매장',
    'nav.about': '소개',
    'nav.login': '로그인',

    // Search
    'search.placeholder': '검색',
    'search.clearTitle': '검색 지우기',

    // Search results
    'search.resultsFor': '검색 결과:',
    'search.results': '결과',

    // Empty state
    'empty.title': '메뉴를 찾을 수 없습니다',
    'empty.subtitle': '다른 키워드로 검색해 보세요!',

    // Promo
    'promo.halfHalf': '하프 & 하프 피자?',

    // Product Card
    'product.addToCart': '장바구니',

    // Product Modal
    'modal.size': '사이즈 (*):',
    'modal.crust': '도우 (*):',
    'modal.toppings': '추가 토핑:',
    'modal.notes': '메모:',
    'modal.notesPlaceholder': '주문에 대한 메모를 남겨주세요...',
    'modal.addToCart': '장바구니에 추가',

    // Cart
    'cart.title': '장바구니',
    'cart.quantity': '수량:',
    'cart.items': '개',
    'cart.empty': '장바구니가 비어 있습니다',
    'cart.size': '사이즈',
    'cart.crust': '도우',
    'cart.topping': '토핑',
    'cart.note': '메모',
    'cart.edit': '편집',
    'cart.delete': '삭제',
    'cart.pizzaPrice': '피자 가격',
    'cart.extraToppings': '추가 토핑',
    'cart.payNow': '결제:',
  },
};

export function t(lang: string, key: string): string {
  const language = (lang as Language) || 'vi';
  return translations[language]?.[key] || translations['vi'][key] || key;
}
