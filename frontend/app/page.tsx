import Image from 'next/image';
import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import CartSidebar from '@/components/CartSidebar';
import ProductCard from '@/components/ProductCard';
import { PromoBanner, SearchResultsBanner, EmptyState } from '@/components/PageTranslations';

export default async function Home(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  
  // Fetch real data from the backend
  let categories = [];
  try {
    const res = await fetch('http://localhost:4000/api/menu/categories', { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success) categories = json.data;
    }
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }

  // Search query
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search.trim() : '';

  // Determine active category (ignore category filter when searching)
  const activeCategoryId = !searchQuery && searchParams.category ? Number(searchParams.category) : (!searchQuery ? categories[0]?.category_id : undefined);

  // Check if the active category is "Combo"
  const activeCategory = categories.find((c: any) => c.category_id === activeCategoryId);
  const isComboCategory = activeCategory?.category_name?.toLowerCase() === 'combo';
  const isPizzaCategory = activeCategory?.category_name?.toLowerCase() === 'pizza';

  // Fetch real dishes or combos for the active category
  let products: any[] = [];
  try {
    if (isComboCategory && !searchQuery) {
      // Fetch combos from combos API
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
      // Fetch dishes
      let fetchUrl: string;
      if (searchQuery) {
        fetchUrl = 'http://localhost:4000/api/menu/dishes';
      } else if (activeCategoryId) {
        fetchUrl = `http://localhost:4000/api/menu/dishes?category_id=${activeCategoryId}`;
      } else {
        fetchUrl = 'http://localhost:4000/api/menu/dishes';
      }
        
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
  } catch (err) {
    console.error('Failed to fetch products:', err);
  }

  // Filter products by search query
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

      {/* Top Red Bar (Full Width) */}
      <div className="h-4 md:h-[22px] w-full z-20 bg-[#ee2828] relative shadow-md"></div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        {/* Blurred background image */}
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

        {/* Left Side: CategoryNav + Products Grid */}
        <div className="flex-1 flex flex-col z-10 overflow-hidden">
          <CategoryNav categories={categories} activeCategoryId={activeCategoryId} />
          
          <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {/* Search results banner */}
          {searchQuery && (
            <SearchResultsBanner query={searchQuery} count={products.length} />
          )}

          {/* Promo banner - hide when searching, only show for Pizza category */}
          {!searchQuery && isPizzaCategory && (
            <PromoBanner />
          )}

          {/* Empty state */}
          {products.length === 0 && (
            <EmptyState />
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-10 lg:gap-x-12 gap-y-10 lg:gap-y-16 justify-items-center max-w-[1100px] mx-auto px-12 lg:px-20 py-4">
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
                categoryName={activeCategory?.category_name || ''}
              />
            ))}
          </div>
        </main>
        </div>

        {/* Right Side: Cart Sidebar */}
        <CartSidebar />
      </div>
    </div>
  );
}
