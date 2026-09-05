import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryNav from '@/components/CategoryNav';
import CartSidebar from '@/components/CartSidebar';
import ProductCard from '@/components/ProductCard';
import { SearchResultsBanner, EmptyState } from '@/components/PageComponents';
import PopularDishes from '@/components/PopularDishes';
import ReorderFavorites from '@/components/ReorderFavorites';
import TopRatedDishes from '@/components/TopRatedDishes';
import { BACKEND_URL } from '@/lib/config';

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop';

const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

const hasRealProductImage = (imagePath: string | null) => {
  if (!imagePath?.trim()) return false;
  return !imagePath.includes('images.unsplash.com/photo-1513104890138-7c749659a591');
};

const getComboImagePath = (combo: { image?: string | null; image_combo?: string | null }) => {
  return combo.image_combo || combo.image || null;
};

const sortProductsByRealImage = <T extends { hasRealImage?: boolean; originalIndex?: number }>(items: T[]) => {
  return [...items].sort((a, b) => {
    const imagePriority = Number(Boolean(b.hasRealImage)) - Number(Boolean(a.hasRealImage));
    if (imagePriority !== 0) return imagePriority;
    return (a.originalIndex ?? 0) - (b.originalIndex ?? 0);
  });
};

const formatIngredientsText = (text: string) => {
  if (!text) return '';
  // Clean up spacing around parentheses: ( 10 pieces ) -> (10 pieces)
  let cleaned = text.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  // Make spaces inside parentheses non-breaking: (10 pieces) -> (10\u00a0pieces)
  cleaned = cleaned.replace(/\(([^)]+)\)/g, (match, content) => {
    return `(${content.replace(/\s+/g, '\u00a0')})`;
  });
  // Correct common typos dynamically
  cleaned = cleaned
    .replace(/Garilc/gi, 'Garlic')
    .replace(/Gralic/gi, 'Garlic')
    .replace(/Grantin/gi, 'Gratin');
  return cleaned;
};

export default async function Home(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  // Lấy dữ liệu từ backend
  let categories = [];
  try {
    const res = await fetch(`${API_BASE}/menu/categories`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success) categories = json.data;
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }

  // Truy vấn tìm kiếm
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search.trim() : '';

  // Xác định trạng thái xem (Trang Nổi Bật vs Xem danh mục cụ thể)
  const hasCategoryFilter = Boolean(!searchQuery && searchParams.category);
  const activeCategoryId = hasCategoryFilter ? Number(searchParams.category) : undefined;
  const isFeaturedPage = !searchQuery && !hasCategoryFilter;

  // Kiểm tra xem danh mục đang chọn có phải "Combo" không
  const activeCategory = categories.find((c: any) => c.category_id === activeCategoryId);
  const isComboCategory = activeCategory?.category_name?.toLowerCase() === 'combo';
  const isPizzaCategory = activeCategory?.category_name?.toLowerCase() === 'pizza';

  // Lấy danh sách món hoặc combo cho danh mục đang chọn
  let products: any[] = [];
  try {
    if (isComboCategory && !searchQuery) {
      // Lấy combo từ API combos
      const res = await fetch(`${API_BASE}/menu/combos`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          products = json.data.map((combo: any, index: number) => {
            const comboImagePath = getComboImagePath(combo);
            return {
              id: combo.combo_id,
              name: combo.combo_name,
              ingredients: formatIngredientsText(
                (combo.description || '').split(',').map((s: string) => s.trim()).filter(Boolean).join('\n') ||
                (combo.groups || []).map((g: any) => g.group_name).join('\n') || ''
              ),
              price: combo.combo_price || 0,
              dish_price_id: null,
              prices: [],
              hasRealImage: hasRealProductImage(comboImagePath),
              originalIndex: index,
              theme: index % 2 === 0 ? 'green' : 'red',
              layout: index % 2 === 0 ? 'image-left' : 'image-right',
              imageUrl: getImageUrl(comboImagePath) || FALLBACK_PRODUCT_IMAGE,
              isCombo: true
            };
          });
        }
      }
    } else {
      // Lấy danh sách món ăn
      let fetchUrl: string;
      if (searchQuery) {
        fetchUrl = `${API_BASE}/menu/dishes`;
      } else if (activeCategoryId) {
        fetchUrl = `${API_BASE}/menu/dishes?category_id=${activeCategoryId}`;
      } else {
        fetchUrl = `${API_BASE}/menu/dishes`;
      }

      if (fetchUrl) {
        const res = await fetch(fetchUrl, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            let dishData = json.data;

            if (activeCategory?.category_name?.toLowerCase().includes('gratin') || activeCategory?.category_name?.toLowerCase().includes('risotto')) {
              const gratins = dishData.filter((d: any) => d.dish_name.toLowerCase().includes('gratin') || d.dish_name.toLowerCase().includes('grantin'));
              const risottos = dishData.filter((d: any) => d.dish_name.toLowerCase().includes('risotto'));
              const other = dishData.filter((d: any) => !d.dish_name.toLowerCase().includes('gratin') && !d.dish_name.toLowerCase().includes('grantin') && !d.dish_name.toLowerCase().includes('risotto'));

              const interleaved = [];
              const maxLen = Math.max(gratins.length, risottos.length);
              for (let i = 0; i < maxLen; i++) {
                if (gratins[i]) interleaved.push(gratins[i]);
                if (risottos[i]) interleaved.push(risottos[i]);
              }
              dishData = [...interleaved, ...other];
            }

            products = dishData.map((dish: any, index: number) => ({
              id: dish.dish_id,
              name: dish.dish_name,
              categoryId: dish.category_id,
              ingredients: formatIngredientsText(dish.ingredient || ''),
              price: dish.prices?.[0]?.dish_price || 0,
              dish_price_id: dish.prices?.[0]?.dish_price_id || null,
              prices: dish.prices || [],
              hasRealImage: hasRealProductImage(dish.image),
              originalIndex: index,
              theme: index % 2 === 0 ? 'green' : 'red',
              layout: index % 2 === 0 ? 'image-left' : 'image-right',
              imageUrl: getImageUrl(dish.image) || FALLBACK_PRODUCT_IMAGE
            }));
          }
        }
      }

      // Khi đang tìm kiếm, cũng fetch thêm combos để hiển thị trong kết quả
      if (searchQuery) {
        try {
          const comboRes = await fetch(`${API_BASE}/menu/combos`, { cache: 'no-store' });
          if (comboRes.ok) {
            const comboJson = await comboRes.json();
            if (comboJson.success) {
              const comboProducts = comboJson.data.map((combo: any, index: number) => {
                const comboImagePath = getComboImagePath(combo);
                return {
                  id: combo.combo_id,
                  name: combo.combo_name,
                  ingredients: formatIngredientsText(
                    (combo.description || '').split(',').map((s: string) => s.trim()).filter(Boolean).join('\n') ||
                    (combo.groups || []).map((g: any) => g.group_name).join('\n') || ''
                  ),
                  price: combo.combo_price || 0,
                  dish_price_id: null,
                  prices: [],
                  hasRealImage: hasRealProductImage(comboImagePath),
                  originalIndex: products.length + index,
                  theme: index % 2 === 0 ? 'green' : 'red',
                  layout: index % 2 === 0 ? 'image-left' : 'image-right',
                  imageUrl: getImageUrl(comboImagePath) || FALLBACK_PRODUCT_IMAGE,
                  isCombo: true
                };
              });
              products = [...products, ...comboProducts];
            }
          }
        } catch (comboErr) {
          console.error('Error fetching combos for search:', comboErr);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching products:', err);
  }

  // Lọc sản phẩm theo từ khóa tìm kiếm
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    products = products.filter((p: any) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.ingredients.toLowerCase().includes(lowerQuery)
    );
  }

  products = sortProductsByRealImage(products);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0a] font-sans">
      <Header />

      {/* Thanh đỏ trên cùng */}
      <div className="h-4 md:h-[22px] w-full z-20 bg-[#ee2828] relative shadow-md"></div>

      {/* Khu vực nội dung chính */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        {/* Hình nền mờ */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1920&auto=format&fit=crop"
            alt="Background"
            fill
            className="object-cover opacity-50 blur-[2px]"
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Bên trái: Danh mục + Lưới sản phẩm */}
        <div className="flex-1 flex flex-col z-10 overflow-hidden">
          <CategoryNav categories={categories} activeCategoryId={activeCategoryId} />

          <main id="main-scroll-container" className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {/* Banner kết quả tìm kiếm */}
            {searchQuery && (
              <SearchResultsBanner query={searchQuery} count={products.length} />
            )}

            {/* Gợi ý món ăn — chỉ hiển thị tại tab NỔI BẬT (trang chủ) và khi không tìm kiếm */}
            {isFeaturedPage && (
              <div className="max-w-[1100px] mx-auto px-4 lg:px-8">
                <PopularDishes />
                <ReorderFavorites />
                <TopRatedDishes />
              </div>
            )}

            {/* Tiêu đề danh mục khi xem toàn bộ thực đơn hoặc lọc theo danh mục */}
            {!searchQuery && (
              <div className="max-w-[1100px] mx-auto px-4 lg:px-8 mt-4 mb-2">
                <div className={`${isFeaturedPage ? 'border-t border-white/10 pt-5' : ''}`}>
                  <h2 className="text-lg md:text-xl font-extrabold text-white tracking-wide uppercase">
                    {isFeaturedPage ? 'Toàn bộ thực đơn' : (activeCategory?.category_name || 'Thực đơn')}
                  </h2>
                </div>
              </div>
            )}

            {/* Trạng thái rỗng */}
            {products.length === 0 && (
              <EmptyState />
            )}

            {/* Lưới sản phẩm */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-10 lg:gap-x-12 gap-y-10 lg:gap-y-16 justify-items-center max-w-[1100px] mx-auto px-12 lg:px-20 py-4">
              {products.map((p, index) => {
                const itemCategory = categories.find((c: any) => c.category_id === p.categoryId);
                return (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    ingredients={p.ingredients}
                    price={p.price}
                    dish_price_id={p.dish_price_id}
                    prices={p.prices}
                    theme={index % 2 === 0 ? 'green' : 'red'}
                    layout={index % 2 === 0 ? 'image-left' : 'image-right'}
                    imageUrl={p.imageUrl}
                    isCombo={p.isCombo || false}
                    isHalfHalf={p.isHalfHalf || false}
                    categoryName={itemCategory?.category_name || activeCategory?.category_name || ''}
                  />
                );
              })}
            </div>

            {/* Footer */}
            <Footer />
          </main>
        </div>

        {/* Giỏ hàng (fixed overlay on mobile, column on desktop) */}
        <CartSidebar />
      </div>
    </div>
  );
}

