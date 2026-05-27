import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { MapPin, Phone } from 'lucide-react';

export const metadata = {
  title: 'About Us | Pizza & Pasta Inn',
  description: 'Learn more about Pizza & Pasta Inn - our journey of culinary excellence, branches, and specialties.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans flex flex-col text-white">
      <Header />

      {/* SECTION 1: HERO SECTION */}
      <section className="relative h-[500px] md:h-[600px] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1920&auto=format&fit=crop"
            alt="Pizza stretching cheese pull background"
            fill
            className="object-cover opacity-35"
            priority
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/60"></div>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight uppercase select-none">
            <span className="text-white block mb-1">PIZZA & PASTA</span>
            <span className="text-[#f5c043] block">INN</span>
          </h1>

          <div className="flex flex-col items-center mt-6 mb-8">
            <span className="text-zinc-400 font-bold text-xs md:text-sm tracking-[0.25em] uppercase">
              PIZZA • SPAGHETTI • RISOTTO/GRANTIN • SALAD
            </span>
            <div className="w-16 h-1 bg-[#f5c043] mt-4 rounded-full"></div>
          </div>

          <p className="text-zinc-300 text-base md:text-lg leading-relaxed max-w-3xl mx-auto font-medium">
            Welcome to <strong className="text-white font-bold">Pizza & Pasta Inn</strong>. We are always ready to serve you hot, freshly baked pizzas, traditional spaghetti rich in sauce, creamy oven-baked pasta and Italian rice dishes, along with refreshing salads mixed with olive oil vinegar dressing and our signature mayo sauce — an exclusive recipe that delivers an explosion of flavor.
          </p>
        </div>
      </section>

      {/* SECTION 2: JOURNEY OF CULINARY EXCELLENCE */}
      <section className="py-20 md:py-28 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="flex flex-col space-y-6">
              <div className="space-y-2">
                <span className="text-[#f5c043] text-xs font-black tracking-[0.2em] uppercase block">
                  OUR MENU STORY
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide uppercase leading-tight">
                  <span className="text-white block">JOURNEY OF</span>
                  <span className="text-[#f5c043] block">CULINARY EXCELLENCE</span>
                </h2>
              </div>
              
              <div className="space-y-5 text-zinc-400 text-[14.5px] leading-relaxed font-medium">
                <p>
                  At <strong className="text-white font-bold">Pizza & Pasta Inn</strong>, our kitchen is filled with passion for creating delicious, high-quality dishes. From oven-baked pizzas topped with stretchy melted cheese, we proudly bring you a diverse menu carefully crafted down to the smallest details.
                </p>
                <p>
                  From long strands of Spaghetti richly coated in flavorful sauce, creamy Italian rice cooked to perfection, to fresh salads blended with premium vinegar, pure olive oil, and our signature mayo sauce made from the restaurant's secret recipe — every dish served to your table is made to bring you complete satisfaction.
                </p>
              </div>
            </div>

            {/* Right Overlapping Images */}
            <div className="relative w-full max-w-md lg:max-w-none mx-auto h-[350px] md:h-[450px] mt-10 lg:mt-0">
              {/* Back Grayscale Image */}
              <div className="relative w-[82%] h-[82%] rounded-2xl overflow-hidden shadow-2xl border border-zinc-900">
                <Image
                  src="https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=800&auto=format&fit=crop"
                  alt="Traditional pizza baking"
                  fill
                  className="object-cover grayscale brightness-75 contrast-125"
                />
              </div>

              {/* Front Colored Overlapping Image */}
              <div className="absolute right-0 bottom-0 w-[55%] h-[65%] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-[#0a0a0a]">
                <Image
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop"
                  alt="Pizza & Pasta Inn cozy interior dining"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: OUR SPECIALTIES / MENU HIGHLIGHTS */}
      <section className="py-20 md:py-28 bg-[#0c0c0c] border-y border-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div className="space-y-1">
              <span className="text-[#f5c043] text-xs font-black tracking-[0.2em] uppercase block">
                OUR SPECIALTIES
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide uppercase text-white leading-tight">
                FOUR MAIN HIGHLIGHTS OF OUR MENU
              </h2>
            </div>
            <span className="text-[#f5c043] text-xs font-bold tracking-[0.2em] uppercase font-sans">
              PIZZA & PASTA INN MENU
            </span>
          </div>

          {/* Specialties Column Grid with dividing borders */}
          <div className="grid grid-cols-1 md:grid-cols-4 border border-zinc-900 rounded-3xl bg-[#0d0d0d]/30 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-900">
            
            {/* Specialty 1 */}
            <div className="p-8 md:p-6 lg:p-8 flex flex-col space-y-3.5">
              <span className="text-[#f5c043] text-xs font-black tracking-widest block">
                01/
              </span>
              <h3 className="text-lg font-black text-white tracking-widest uppercase">
                PIZZA
              </h3>
              <p className="text-zinc-400 text-xs md:text-[13px] leading-relaxed font-medium">
                Our pizza dough is handcrafted and paired with high-temperature oven baking techniques, creating a perfectly golden and crispy crust on the outside while keeping it soft and moist on the inside.
              </p>
            </div>

            {/* Specialty 2 */}
            <div className="p-8 md:p-6 lg:p-8 flex flex-col space-y-3.5">
              <span className="text-[#f5c043] text-xs font-black tracking-widest block">
                02/
              </span>
              <h3 className="text-lg font-black text-white tracking-widest uppercase">
                SPAGHETTI
              </h3>
              <p className="text-zinc-400 text-xs md:text-[13px] leading-relaxed font-medium">
                Traditional Spaghetti is cooked to the perfect al dente texture and beautifully combined with rich, flavorful sauces to create an irresistibly satisfying taste and texture.
              </p>
            </div>

            {/* Specialty 3 */}
            <div className="p-8 md:p-6 lg:p-8 flex flex-col space-y-3.5">
              <span className="text-[#f5c043] text-xs font-black tracking-widest block">
                03/
              </span>
              <h3 className="text-lg font-black text-white tracking-widest uppercase">
                RISOTTO /GRANTIN
              </h3>
              <p className="text-zinc-400 text-xs md:text-[13px] leading-relaxed font-medium">
                Italian rice and baked pasta are blended with rich, creamy sauce and topped with golden baked cheese, creating a bold and unforgettable flavor.
              </p>
            </div>

            {/* Specialty 4 */}
            <div className="p-8 md:p-6 lg:p-8 flex flex-col space-y-3.5">
              <span className="text-[#f5c043] text-xs font-black tracking-widest block">
                04/
              </span>
              <h3 className="text-lg font-black text-white tracking-widest uppercase">
                SALAD
              </h3>
              <p className="text-zinc-400 text-xs md:text-[13px] leading-relaxed font-medium">
                Fresh, crisp vegetables are combined with vinegar, olive oil, and our signature mayo sauce — the restaurant's exclusive secret recipe that perfectly balances every flavor.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: SERVICE PROMISE & OUR BRANCHES */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Quote Block */}
          <div className="text-center mb-24 relative max-w-4xl mx-auto">
            <span className="text-7xl md:text-8xl text-[#f5c043]/30 font-serif leading-none select-none block -mb-4 md:-mb-8">“</span>
            <blockquote className="text-xl md:text-3xl font-extrabold italic text-white leading-relaxed max-w-3xl mx-auto px-4">
              &ldquo;Come to Pizza & Pasta Inn, where you can enjoy hot, delicious, and flavorful dishes in a warm and friendly atmosphere&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="w-8 h-px bg-zinc-800"></div>
              <span className="text-[#f5c043] font-bold text-xs tracking-[0.25em] uppercase">
                OUR SERVICE PROMISE
              </span>
              <div className="w-8 h-px bg-zinc-800"></div>
            </div>
          </div>

          {/* Branches Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div className="space-y-1">
              <span className="text-[#f5c043] text-xs font-black tracking-[0.2em] uppercase block">
                LOCATE US
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide uppercase text-white">
                OUR BRANCHES
              </h2>
            </div>
            <p className="max-w-sm text-zinc-400 text-sm leading-relaxed text-left md:text-right font-medium">
              Visit us at one of our two prime locations in Ho Chi Minh City for an authentic taste of Italy.
            </p>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Branch 1 Card */}
            <div className="bg-[#121212] border border-zinc-900 rounded-3xl overflow-hidden shadow-lg group hover:border-[#f5c043]/30 transition-all duration-300 relative flex flex-col">
              <div className="relative h-[220px] w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop"
                  alt="District 5 Branch restaurant dining room"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent opacity-60"></div>
              </div>
              
              <div className="p-6 pb-8 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-[#f5c043] tracking-widest uppercase">
                    DISTRICT 5 BRANCH
                  </h3>
                  
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-[#64748B] mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-400 text-[13.5px] leading-relaxed font-medium max-w-[85%]">
                        21 Dao Tan Street, An Dong Ward, Ho Chi Minh City, Vietnam
                      </span>
                    </div>
                    
                    <div className="text-[12.5px] text-zinc-400 font-bold tracking-wider uppercase">
                      OPEN: 10:00 AM — 10:00 PM
                    </div>
                  </div>
                </div>

                {/* Yellow Phone Button */}
                <a 
                  href="tel:02839240343" 
                  className="w-11 h-11 rounded-full bg-[#f5c043] flex items-center justify-center text-black hover:bg-[#e5b33c] hover:scale-110 active:scale-95 transition-all shadow-lg absolute bottom-6 right-6 cursor-pointer"
                  title="Call Hotline"
                >
                  <Phone size={18} className="fill-current stroke-[2]" />
                </a>
              </div>
            </div>

            {/* Branch 2 Card */}
            <div className="bg-[#121212] border border-zinc-900 rounded-3xl overflow-hidden shadow-lg group hover:border-[#f5c043]/30 transition-all duration-300 relative flex flex-col">
              <div className="relative h-[220px] w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=600&auto=format&fit=crop"
                  alt="District 7 Branch bar seating and upscale atmosphere"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent opacity-60"></div>
              </div>
              
              <div className="p-6 pb-8 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-[#f5c043] tracking-widest uppercase">
                    DISTRICT 7 BRANCH
                  </h3>
                  
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-[#64748B] mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-400 text-[13.5px] leading-relaxed font-medium max-w-[85%]">
                        C001 Pham Thai Buong Street, Tan Hung Ward, Ho Chi Minh City, Vietnam
                      </span>
                    </div>
                    
                    <div className="text-[12.5px] text-zinc-400 font-bold tracking-wider uppercase">
                      OPEN: 09:00 AM — 09:00 PM
                    </div>
                  </div>
                </div>

                {/* Yellow Phone Button */}
                <a 
                  href="tel:02854121197" 
                  className="w-11 h-11 rounded-full bg-[#f5c043] flex items-center justify-center text-black hover:bg-[#e5b33c] hover:scale-110 active:scale-95 transition-all shadow-lg absolute bottom-6 right-6 cursor-pointer"
                  title="Call Hotline"
                >
                  <Phone size={18} className="fill-current stroke-[2]" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* FOOTER CONTAINER */}
      <div className="px-6 bg-[#0a0a0a]">
        <Footer />
      </div>
    </div>
  );
}
