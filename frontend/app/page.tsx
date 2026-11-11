import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryNav from '@/components/CategoryNav';
import CartSidebar from '@/components/CartSidebar';
import MenuCatalogClient from '@/components/MenuCatalogClient';
import { SearchResultsBanner } from '@/components/PageComponents';
import PopularDishes from '@/components/PopularDishes';
import ReorderFavorites from '@/components/ReorderFavorites';
import TopRatedDishes from '@/components/TopRatedDishes';
import SmartQuizBanner from '@/components/SmartQuizBanner';
import HeroBanner from '@/components/HeroBanner';
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

  // Truy vấn tìm kiếm
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search.trim() : '';

  // Xác định trạng thái xem (Trang Nổi Bật vs Xem danh mục cụ thể)
  const hasCategoryFilter = Boolean(!searchQuery && searchParams.category);
  const activeCategoryId = hasCategoryFilter ? Number(searchParams.category) : undefined;
  const isFeaturedPage = !searchQuery && !hasCategoryFilter;

  const dishesEndpoint = searchQuery
    ? `${API_BASE}/menu/dishes`
    : activeCategoryId
      ? `${API_BASE}/menu/dishes?category_id=${activeCategoryId}`
      : `${API_BASE}/menu/dishes`;

  // Tải song song toàn bộ dữ liệu cần thiết trên Server (loại bỏ waterfall tuần tự)
  const [categoriesRes, dishesRes, combosRes, popularRes, topRatedRes, vouchersRes] = await Promise.all([
    fetch(`${API_BASE}/menu/categories`, { next: { revalidate: 60 } }).catch(() => null),
    fetch(dishesEndpoint, { next: { revalidate: 30 } }).catch(() => null),
    fetch(`${API_BASE}/menu/combos`, { next: { revalidate: 30 } }).catch(() => null),
    isFeaturedPage
      ? fetch(`${API_BASE}/recommendations/popular`, { next: { revalidate: 60 } }).catch(() => null)
      : Promise.resolve(null),
    isFeaturedPage
      ? fetch(`${API_BASE}/recommendations/top-rated`, { next: { revalidate: 60 } }).catch(() => null)
      : Promise.resolve(null),
    isFeaturedPage
      ? fetch(`${API_BASE}/vouchers`, { next: { revalidate: 60 } }).catch(() => null)
      : Promise.resolve(null),
  ]);

  let categories: any[] = [];
  if (categoriesRes?.ok) {
    try {
      const json = await categoriesRes.json();
      if (json.success) categories = json.data;
    } catch (err) {
      console.error('Error parsing categories:', err);
    }
  }

  let allCombos: any[] = [];
  if (combosRes?.ok) {
    try {
      const json = await combosRes.json();
      if (json.success && Array.isArray(json.data)) {
        allCombos = json.data;
      }
    } catch (err) {
      console.error('Error parsing combos:', err);
    }
  }

  let activeVouchers: any[] = [];
  if (vouchersRes?.ok) {
    try {
      const json = await vouchersRes.json();
      if (json.success && Array.isArray(json.data)) {
        activeVouchers = json.data;
      }
    } catch {
      // fallback silently
    }
  }

  let popularDishes: any[] | undefined = undefined;
  if (popularRes?.ok) {
    try {
      const json = await popularRes.json();
      if (json.success && Array.isArray(json.data)) {
        popularDishes = json.data.slice(0, 6);
      }
    } catch {
      // fallback to client fetch if needed
    }
  }

  const popularIdSet = new Set(
    (popularDishes || [])
      .filter((d: any) => d.type !== 'combo')
      .map((d: any) => Number(d.dish_id))
  );

  let topRatedDishes: any[] | undefined = undefined;
  if (topRatedRes?.ok) {
    try {
      const json = await topRatedRes.json();
      if (json.success && Array.isArray(json.data)) {
        topRatedDishes = json.data.filter(
          (d: any) =>
            Number(d.avg_rating || 0) >= 4 &&
            (d.type === 'combo' || !popularIdSet.has(Number(d.dish_id)))
        );
      }
    } catch {
      // fallback to client fetch if needed
    }
  }

  const showTopRatedSection = Array.isArray(topRatedDishes) && topRatedDishes.length >= 2;
  const featuredExcludedIds = Array.from(
    new Set([
      ...popularIdSet,
      ...(showTopRatedSection
        ? topRatedDishes!
            .filter((d: any) => d.type !== 'combo')
            .map((d: any) => Number(d.dish_id))
        : []),
    ])
  );

  // Kiểm tra xem danh mục đang chọn có phải "Combo" không
  const activeCategory = categories.find((c: any) => c.category_id === activeCategoryId);
  const isComboCategory = activeCategory?.category_name?.toLowerCase() === 'combo';

  // Lấy danh sách món hoặc combo cho danh mục đang chọn
  let products: any[] = [];
  try {
    if (isComboCategory && !searchQuery) {
      if (allCombos.length > 0) {
        products = allCombos.map((combo: any, index: number) => {
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
    } else {
      if (dishesRes?.ok) {
        const json = await dishesRes.json();
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
            dish_type: dish.dish_type || 'man',
            ingredients: formatIngredientsText(dish.ingredient || ''),
            price: dish.prices?.[0]?.dish_price || 0,
            dish_price_id: dish.prices?.[0]?.dish_price_id || null,
            prices: dish.prices || [],
            hasRealImage: hasRealProductImage(dish.image),
            originalIndex: index,
            theme: index % 2 === 0 ? 'green' : 'red',
            layout: index % 2 === 0 ? 'image-left' : 'image-right',
            imageUrl: getImageUrl(dish.image) || FALLBACK_PRODUCT_IMAGE,
            isHalfHalf: dish.dish_name.toLowerCase().includes('half') || !!dish.is_half_half
          }));
        }
      }

      // Khi đang tìm kiếm, gộp thêm combos vào kết quả
      if (searchQuery && allCombos.length > 0) {
        const comboProducts = allCombos.map((combo: any, index: number) => {
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
  } catch (err) {
    console.error('Error processing products:', err);
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
    <div className="flex flex-col h-screen overflow-hidden menu-page-bg font-sans">
      <Header />

      {/* Khu vực nội dung chính */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        {/* Hình nền mờ (GPU-composited để cuộn trang mượt 60fps) */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden transform-gpu">
          <Image
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=65&w=1280&auto=format&fit=crop"
            alt="Background"
            fill
            sizes="100vw"
            className="object-cover menu-bg-image blur-[2px] scale-[1.02] transform-gpu"
            priority
          />
          <div className="absolute inset-0 menu-backdrop-overlay"></div>
        </div>

        {/* Bên trái: Danh mục + Lưới sản phẩm */}
        <div className="flex-1 flex flex-col min-w-0 z-10 overflow-hidden">
          <CategoryNav categories={categories} activeCategoryId={activeCategoryId} />

          <main id="main-scroll-container" className="flex-1 pt-4 pb-24 lg:pb-8 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth motion-reduce:scroll-auto">
            {/* Banner kết quả tìm kiếm */}
            {searchQuery && (
              <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
                <SearchResultsBanner query={searchQuery} count={products.length} />
              </div>
            )}

            {/* Hero Banner & Gợi ý món ăn — hiển thị gọn gàng trên trang chủ */}
            {isFeaturedPage && (
              <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
                <HeroBanner
                  combos={allCombos}
                  vouchers={activeVouchers}
                  categories={categories}
                  popularDishes={popularDishes}
                />
                <SmartQuizBanner />
                <ReorderFavorites excludeDishIds={featuredExcludedIds} />
                <PopularDishes initialDishes={popularDishes} />
                {showTopRatedSection && <TopRatedDishes initialDishes={topRatedDishes} />}
              </div>
            )}

            {/* Thanh lọc khẩu vị + Sắp xếp giá + Lưới thực đơn */}
            <MenuCatalogClient
              products={products}
              categories={categories}
              activeCategory={activeCategory}
              isFeaturedPage={isFeaturedPage}
              searchQuery={searchQuery}
            />

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
