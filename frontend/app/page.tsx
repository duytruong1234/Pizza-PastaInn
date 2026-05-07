import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryNav from '@/components/CategoryNav';
import CartSidebar from '@/components/CartSidebar';
import ProductCard from '@/components/ProductCard';
import { SearchResultsBanner, EmptyState } from '@/components/PageComponents';

export default async function Home(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  
  // Lấy dữ liệu từ backend
  let categories = [];
  try {
    const res = await fetch('http://localhost:4000/api/menu/categories', { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success) categories = json.data;
    }
  } catch (err) {
    console.error('Lỗi khi lấy danh mục:', err);
  }

  // Truy vấn tìm kiếm
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search.trim() : '';

  // Xác định danh mục đang chọn (bỏ qua khi đang tìm kiếm)
  const activeCategoryId = !searchQuery && searchParams.category ? Number(searchParams.category) : (!searchQuery ? categories[0]?.category_id : undefined);

  // Kiểm tra xem danh mục đang chọn có phải "Combo" không
  const activeCategory = categories.find((c: any) => c.category_id === activeCategoryId);
  const isComboCategory = activeCategory?.category_name?.toLowerCase() === 'combo';
  const isPizzaCategory = activeCategory?.category_name?.toLowerCase() === 'pizza';

  // Lấy danh sách món hoặc combo cho danh mục đang chọn
  let products: any[] = [];
  try {
    if (isComboCategory && !searchQuery) {
      // Lấy combo từ API combos
      const res = await fetch('http://localhost:4000/api/menu/combos', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          products = json.data.map((combo: any, index: number) => ({
            id: combo.combo_id,
            name: combo.combo_name,
            ingredients: combo.description || '',
            price: combo.combo_price || 0,
            dish_price_id: null,
            prices: [],
            theme: index % 2 === 0 ? 'green' : 'red',
            layout: index % 2 === 0 ? 'image-left' : 'image-right',
            imageUrl: combo.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop',
            isCombo: true
          }));
        }
      }
    } else {
      // Lấy danh sách món ăn
      let fetchUrl: string;
      if (searchQuery) {
        fetchUrl = 'http://localhost:4000/api/menu/dishes';
      } else if (activeCategoryId) {
        fetchUrl = `http://localhost:4000/api/menu/dishes?category_id=${activeCategoryId}`;
      } else {
        fetchUrl = 'http://localhost:4000/api/menu/dishes';
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
              ingredients: dish.ingredient || '',
              price: dish.prices?.[0]?.dish_price || 0,
              dish_price_id: dish.prices?.[0]?.dish_price_id || null,
              prices: dish.prices || [],
              theme: index % 2 === 0 ? 'green' : 'red',
              layout: index % 2 === 0 ? 'image-left' : 'image-right',
              imageUrl: dish.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop'
            }));
          }
        }
      }

      // Khi đang tìm kiếm, cũng fetch thêm combos để hiển thị trong kết quả
      if (searchQuery) {
        try {
          const comboRes = await fetch('http://localhost:4000/api/menu/combos', { cache: 'no-store' });
          if (comboRes.ok) {
            const comboJson = await comboRes.json();
            if (comboJson.success) {
              const comboProducts = comboJson.data.map((combo: any, index: number) => ({
                id: combo.combo_id,
                name: combo.combo_name,
                ingredients: combo.description || '',
                price: combo.combo_price || 0,
                dish_price_id: null,
                prices: [],
                theme: index % 2 === 0 ? 'green' : 'red',
                layout: index % 2 === 0 ? 'image-left' : 'image-right',
                imageUrl: combo.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop',
                isCombo: true
              }));
              products = [...products, ...comboProducts];
            }
          }
        } catch (comboErr) {
          console.error('Lỗi khi lấy combo cho tìm kiếm:', comboErr);
        }
      }
    }
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm:', err);
  }

  // Lọc sản phẩm theo từ khóa tìm kiếm
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    products = products.filter((p: any) => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.ingredients.toLowerCase().includes(lowerQuery)
    );
  }

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



          {/* Trạng thái rỗng */}
          {products.length === 0 && (
            <EmptyState />
          )}

          {/* Lưới sản phẩm */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-10 lg:gap-x-16 gap-y-10 lg:gap-y-16 justify-items-center max-w-[1400px] mx-auto px-6 lg:px-12 py-4">
            {products.map((p, index) => (
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
                categoryName={activeCategory?.category_name || ''}
              />
            ))}
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
