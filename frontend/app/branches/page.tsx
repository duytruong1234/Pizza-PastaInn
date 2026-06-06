import Header from '@/components/Header';
import { MapPin, Phone } from 'lucide-react';

export default async function BranchesPage() {
  let stores = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/stores`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success) stores = json.data;
    }
  } catch (err) {
    console.error('Error fetching store list:', err);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans flex flex-col text-white">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-1">
        <h1 className="text-3xl font-bold mb-8 text-center text-[#007a3f] uppercase tracking-wider">Store Locations</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {stores.length > 0 ? (
            stores.map((store: any) => (
              <div key={store.store_id} className="bg-[#111] border border-[#333] p-6 rounded-lg shadow-lg hover:border-[#007a3f] transition-colors">
                <h2 className="text-xl font-bold mb-4 text-pizza-red">{store.store_name}</h2>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-400 mt-1" size={20} />
                    <p>{store.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-400" size={20} />
                    <p className="font-semibold text-white">{store.hotline}</p>
                  </div>
                  {(store.latitude && store.longitude) && (
                    <div className="text-sm text-gray-500 pt-2 border-t border-[#333] mt-4">
                      Coordinates: {store.latitude}, {store.longitude}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 text-center text-gray-500 py-12 bg-[#111] rounded-lg">
              Store list is being updated...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
