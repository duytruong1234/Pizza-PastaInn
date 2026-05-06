import { MapPin, Phone, Clock, Mail, Globe, Heart, Play } from 'lucide-react';

export default async function Footer() {
  let storeName = 'Pizza&PastaInn';
  let address = '';
  let hotline = '';

  try {
    const res = await fetch('http://localhost:4000/api/stores', { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        storeName = json.data[0].store_name || storeName;
        address = json.data[0].address || '';
        hotline = json.data[0].hotline || '';
      }
    }
  } catch (err) {
    console.error('Lỗi khi lấy thông tin cửa hàng cho footer:', err);
  }

  return (
    <footer className="relative z-10 bg-gradient-to-b from-black/90 to-black text-white border-t border-white/10 -mx-6 -mb-6 mt-10">
      {/* Dải đỏ trang trí */}
      <div className="h-1 w-full bg-gradient-to-r from-[#9f280a] via-[#ee2828] to-[#9f280a]"></div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Cột 1: Thông tin cửa hàng */}
          <div>
            <h3 className="text-xl font-extrabold font-serif tracking-tight mb-4">
              {storeName}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Authentic Italian pizza & pasta made with fresh ingredients and traditional recipes. 
              Every dish is crafted with love and passion.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Globe size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-gradient-to-br hover:from-[#f09433] hover:to-[#bc1888] flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Heart size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#FF0000] flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Play size={16} />
              </a>
            </div>
          </div>

          {/* Cột 2: Liên hệ */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#f0c14b]">Contact Us</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {address && (
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#ee2828] mt-0.5 flex-shrink-0" />
                  <span>{address}</span>
                </li>
              )}
              {hotline && (
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-[#ee2828] flex-shrink-0" />
                  <span>{hotline}</span>
                </li>
              )}
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-[#ee2828] flex-shrink-0" />
                <span>contact@pizzapastainn.com</span>
              </li>
            </ul>
          </div>

          {/* Cột 3: Giờ mở cửa */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#f0c14b]">Opening Hours</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3">
                <Clock size={16} className="text-[#ee2828] flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white/90">Mon - Fri</p>
                  <p>10:00 AM - 10:00 PM</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={16} className="text-[#ee2828] flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white/90">Sat - Sun</p>
                  <p>9:00 AM - 11:00 PM</p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
