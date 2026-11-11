'use client';

import HeaderClient from '@/components/HeaderClient';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { MapPin, Phone, Clock } from 'lucide-react';
import { useUI } from '@/components/UIProvider';

export default function AboutPage() {
  const { theme, lang } = useUI();
  const isDark = theme === 'dark';
  const isEn = lang === 'en';

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0e0c0a] text-white' : 'bg-[#f6f6f7] text-zinc-900'}`}>
      <HeaderClient storeName="Pizza&PastaInn" />

      {/* SECTION 1: HERO SECTION */}
      <section className="relative min-h-[460px] md:min-h-[520px] w-full flex items-center justify-center overflow-hidden bg-[#120e0c]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1920&auto=format&fit=crop"
            alt="Pizza & Pasta Inn Hero Background"
            fill
            className="object-cover opacity-50 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/85" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-14 text-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase select-none drop-shadow-lg mb-4">
            <span className="text-white block mb-1">PIZZA & PASTA</span>
            <span className="text-[#f5c043] block">INN</span>
          </h1>

          <p className="text-zinc-200 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
            {isEn ? (
              <>
                Welcome to <strong className="text-white font-bold">Pizza & Pasta Inn</strong>. We serve oven-baked pizzas, traditional Italian spaghetti, creamy oven-baked risotto and gratin, and fresh salads tossed with olive oil and our signature house mayo dressing.
              </>
            ) : (
              <>
                Chào mừng bạn đến với <strong className="text-white font-bold">Pizza & Pasta Inn</strong>. Chúng tôi phục vụ các món pizza nướng lò nóng hổi, mì Ý truyền thống, cơm Ý đút lò cùng các món salad rau củ tươi trộn dầu ô liu và sốt mayo pha chế riêng của quán.
              </>
            )}
          </p>
        </div>
      </section>

      {/* SECTION 2: CÂU CHUYỆN ẨM THỰC */}
      <section className={`py-16 md:py-24 transition-colors duration-300 ${isDark ? 'bg-[#0e0c0a]' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center">

            {/* Left Content */}
            <div className="flex flex-col space-y-5 text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-tight">
                <span className={`block ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {isEn ? 'OUR KITCHEN STORY' : 'CÂU CHUYỆN BẾP'}
                </span>
                <span className={`block ${isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'}`}>
                  {isEn ? 'TRADITIONAL ITALIAN FLAVORS' : 'HƯƠNG VỊ Ý TRUYỀN THỐNG'}
                </span>
              </h2>

              <div className={`space-y-4 text-[14.5px] leading-relaxed font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                <p>
                  {isEn ? (
                    <>
                      At <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>Pizza & Pasta Inn</strong>, we focus on fresh daily ingredients and traditional preparation methods. From pizzas topped with melted Mozzarella straight out of the oven, every dish is carefully prepared before serving our guests.
                    </>
                  ) : (
                    <>
                      Tại <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>Pizza & Pasta Inn</strong>, chúng tôi chú trọng vào nguyên liệu tươi mỗi ngày và cách chế biến giữ đúng vị truyền thống. Từ những chiếc pizza phủ phô mai Mozzarella nóng hổi vừa ra lò, mỗi món ăn đều được chuẩn bị kỹ lưỡng trước khi phục vụ thực khách.
                    </>
                  )}
                </p>
                <p>
                  {isEn
                    ? 'Our menu brings together tomato and cream-based Spaghetti, oven-baked Risotto and Gratin, and crisp daily salads tossed with olive oil, balsamic vinegar, and our house-made mayo dressing.'
                    : 'Thực đơn của quán kết hợp đa dạng từ mì Spaghetti sốt cà chua và sốt kem, cơm Ý Risotto và Gratin đút lò, cho đến các phần salad rau củ tươi trộn cùng dầu ô liu, giấm và sốt mayo đặc trưng của quán.'}
                </p>
              </div>
            </div>

            {/* Right Overlapping Images */}
            <div className="relative w-full max-w-md lg:max-w-none mx-auto h-[340px] md:h-[430px]">
              <div className={`relative w-[82%] h-[82%] rounded-3xl overflow-hidden shadow-2xl border ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
                <Image
                  src="https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=800&auto=format&fit=crop"
                  alt="Pizza truyền thống nướng lò"
                  fill
                  sizes="(max-width: 1024px) 80vw, 440px"
                  className="object-cover"
                />
              </div>

              <div className={`absolute right-0 bottom-0 w-[56%] h-[64%] rounded-3xl overflow-hidden shadow-2xl border-4 ${isDark ? 'border-[#0e0c0a]' : 'border-white'}`}>
                <Image
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop"
                  alt="Không gian ấm cúng tại Pizza & Pasta Inn"
                  fill
                  sizes="(max-width: 1024px) 56vw, 320px"
                  className="object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: 4 ĐIỂM NHẤN TRONG THỰC ĐƠN */}
      <section className={`py-16 md:py-24 border-y transition-colors duration-300 ${isDark ? 'bg-[#14110f] border-white/[0.07]' : 'bg-zinc-100/80 border-zinc-200'}`}>
        <div className="max-w-6xl mx-auto px-6">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {isEn ? '4 MENU HIGHLIGHTS' : '4 ĐIỂM NHẤN TRONG THỰC ĐƠN'}
            </h2>
          </div>

          {/* Specialties Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: '01',
                title: isEn ? 'OVEN-BAKED PIZZA' : 'PIZZA NƯỚNG LÒ',
                desc: isEn
                  ? 'Hand-stretched dough baked at high temperatures for a crisp golden crust outside and soft texture inside.'
                  : 'Đế bánh được cán thủ công và nướng ở nhiệt độ cao, giữ được lớp vỏ giòn bên ngoài và độ mềm xốp bên trong.',
              },
              {
                num: '02',
                title: 'SPAGHETTI',
                desc: isEn
                  ? 'Traditional Italian pasta cooked al dente and tossed with minced beef sauce, fresh cream, or seafood.'
                  : 'Mì Ý luộc vừa chín tới (al dente), kết hợp cùng sốt bò bằm, sốt kem tươi hoặc hải sản tươi.',
              },
              {
                num: '03',
                title: 'RISOTTO / GRATIN',
                desc: isEn
                  ? 'Italian rice and macaroni baked with creamy sauce and topped with golden-brown Mozzarella cheese.'
                  : 'Cơm Ý và nui đút lò nấu cùng sốt kem và phô mai Mozzarella nướng vàng mặt.',
              },
              {
                num: '04',
                title: isEn ? 'FRESH SALAD' : 'SALAD RAU CỦ',
                desc: isEn
                  ? 'Daily fresh vegetables served with olive oil, balsamic vinegar, or our house-blended mayonnaise dressing.'
                  : 'Rau củ tươi theo ngày dùng kèm dầu ô liu, giấm hoặc sốt mayo pha chế riêng của quán.',
              },
            ].map((item) => (
              <div
                key={item.num}
                className={`p-6 md:p-7 rounded-3xl border flex flex-col space-y-2.5 text-left transition-all duration-200 ${
                  isDark
                    ? 'bg-[#1a1613] border-white/[0.08] hover:border-[#f5c043]/40'
                    : 'bg-white border-zinc-200 hover:border-[#007a3f]/40 shadow-sm'
                }`}
              >
                <h3 className={`text-base font-black uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {item.title}
                </h3>
                <p className={`text-xs md:text-[13.5px] leading-relaxed font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 4: CAM KẾT PHỤC VỤ & HỆ THỐNG CHI NHÁNH */}
      <section className={`py-16 md:py-24 transition-colors duration-300 ${isDark ? 'bg-[#0e0c0a]' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto px-6">

          {/* Quote Block */}
          <div className={`text-center mb-20 p-8 md:p-12 rounded-3xl border max-w-4xl mx-auto ${
            isDark ? 'bg-[#161311] border-white/[0.08]' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <blockquote className={`text-lg sm:text-xl md:text-2xl font-extrabold italic leading-relaxed max-w-3xl mx-auto ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              &ldquo;
              {isEn
                ? 'Visit Pizza & Pasta Inn to enjoy hot, flavorful Italian dishes in a warm and welcoming atmosphere.'
                : 'Đến với Pizza & Pasta Inn để thưởng thức những món ăn nóng hổi, thơm ngon và đậm đà hương vị trong không gian ấm áp, thân thiện.'}
              &rdquo;
            </blockquote>
          </div>

          {/* Branches Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {isEn ? 'OUR BRANCHES' : 'HỆ THỐNG CHI NHÁNH'}
            </h2>
            <p className={`max-w-md text-xs md:text-sm leading-relaxed text-left md:text-right font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {isEn
                ? 'Visit either of our two locations in Ho Chi Minh City to enjoy our full menu.'
                : 'Ghé thăm một trong hai chi nhánh của chúng tôi tại TP. Hồ Chí Minh để trải nghiệm hương vị ẩm thực Ý trọn vẹn nhất.'}
            </p>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

            {/* Branch 1 Card */}
            <div className={`border rounded-3xl overflow-hidden shadow-lg group transition-all duration-300 relative flex flex-col ${
              isDark ? 'bg-[#161311] border-white/[0.08] hover:border-[#f5c043]/40' : 'bg-white border-zinc-200 hover:border-[#007a3f]/40'
            }`}>
              <div className="relative h-[220px] w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop"
                  alt="Chi nhánh Quận 5"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <h3 className="absolute bottom-4 left-5 text-white font-black text-lg uppercase tracking-wide drop-shadow">
                  {isEn ? 'District 5 Branch' : 'Chi nhánh Quận 5'}
                </h3>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between text-left gap-5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-[#ee2828] mt-0.5 flex-shrink-0" />
                    <span className={`text-sm leading-relaxed font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {isEn
                        ? '21 Dao Tan, An Dong Ward, District 5, Ho Chi Minh City'
                        : '21 Đào Tấn, Phường An Đông, Quận 5, TP. Hồ Chí Minh'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock size={17} className="text-[#f5c043] flex-shrink-0" />
                    <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {isEn ? 'Opening Hours:' : 'Giờ mở cửa:'} <strong className={isDark ? 'text-white' : 'text-zinc-900'}>10:00 — 22:00</strong>
                    </span>
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
                  <span className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Hotline: <strong className={isDark ? 'text-white' : 'text-zinc-900'}>028 3924 0343</strong>
                  </span>
                  <a
                    href="tel:02839240343"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow ${
                      isDark ? 'bg-[#f5c043] text-zinc-950 hover:bg-[#eab308]' : 'bg-[#007a3f] text-white hover:bg-[#006332]'
                    }`}
                    title="Hotline"
                  >
                    <Phone size={14} />
                    <span>{isEn ? 'Call Now' : 'Gọi ngay'}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Branch 2 Card */}
            <div className={`border rounded-3xl overflow-hidden shadow-lg group transition-all duration-300 relative flex flex-col ${
              isDark ? 'bg-[#161311] border-white/[0.08] hover:border-[#f5c043]/40' : 'bg-white border-zinc-200 hover:border-[#007a3f]/40'
            }`}>
              <div className="relative h-[220px] w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=600&auto=format&fit=crop"
                  alt="Chi nhánh Quận 7"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <h3 className="absolute bottom-4 left-5 text-white font-black text-lg uppercase tracking-wide drop-shadow">
                  {isEn ? 'District 7 Branch' : 'Chi nhánh Quận 7'}
                </h3>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between text-left gap-5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-[#ee2828] mt-0.5 flex-shrink-0" />
                    <span className={`text-sm leading-relaxed font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {isEn
                        ? 'C001 Pham Thai Buong, Tan Hung Ward, District 7, Ho Chi Minh City'
                        : 'C001 Phạm Thái Bường, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock size={17} className="text-[#f5c043] flex-shrink-0" />
                    <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {isEn ? 'Opening Hours:' : 'Giờ mở cửa:'} <strong className={isDark ? 'text-white' : 'text-zinc-900'}>09:00 — 21:00</strong>
                    </span>
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
                  <span className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Hotline: <strong className={isDark ? 'text-white' : 'text-zinc-900'}>028 5412 1197</strong>
                  </span>
                  <a
                    href="tel:02854121197"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow ${
                      isDark ? 'bg-[#f5c043] text-zinc-950 hover:bg-[#eab308]' : 'bg-[#007a3f] text-white hover:bg-[#006332]'
                    }`}
                    title="Hotline"
                  >
                    <Phone size={14} />
                    <span>{isEn ? 'Call Now' : 'Gọi ngay'}</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
