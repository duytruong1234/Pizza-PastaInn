'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { analyzeProductTaste } from '@/lib/tasteTags';
import { useUI } from '@/components/UIProvider';
import { useWishlistStore } from '@/store/wishlistStore';
import ProductModal from './ProductModal';
import ComboModal from './ComboModal';
import HalfHalfModal from './HalfHalfModal';

interface ProductPriceOption {
  dish_price_id?: string;
  dish_price: number;
  size_id?: number | null;
  crust_id?: number | null;
}

interface ProductCardProps {
  id: number;
  name: string;
  ingredients: string;
  price: number;
  dish_price_id?: string;
  prices?: ProductPriceOption[];
  imageUrl: string;
  layout?: 'image-left' | 'image-right';
  theme?: 'green' | 'red';
  isCombo?: boolean;
  isHalfHalf?: boolean;
  categoryName?: string;
  dish_type?: string;
}

function ProductCard({
  id,
  name,
  ingredients,
  price,
  prices = [],
  imageUrl,
  layout = 'image-left',
  theme = 'green',
  isCombo = false,
  isHalfHalf = false,
  categoryName = '',
  dish_type = 'man',
}: ProductCardProps) {
  const { theme: uiTheme, isCartOpen, isCartPinned, t, td, ti, tc } = useUI();
  const isLight = uiTheme === 'light';
  const isPinnedDesktop = isCartPinned && isCartOpen;
  const isImageLeft = layout === 'image-left';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { items: wishlistItems, toggleWishlist } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLiked = mounted && !isCombo && !isHalfHalf && wishlistItems.some((w) => w.dish_id === id);
  const productImageSrc =
    imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop';
  const isHalfHalfItem = isHalfHalf || name.toLowerCase().includes('half');

  const tasteInfo = useMemo(
    () => analyzeProductTaste({ name, ingredients, dish_type }),
    [name, ingredients, dish_type]
  );

  // Màu nền theo chủ đề card & chế độ Sáng/Tối
  const bgClass =
    theme === 'green'
      ? isLight
        ? 'bg-[#235328]/92 shadow-[0_10px_28px_rgba(35,83,40,0.22)] border border-[#1b401f]/20'
        : 'bg-[#294c29]/65 shadow-xl'
      : isLight
        ? 'bg-[#a82e10]/92 shadow-[0_10px_28px_rgba(168,46,16,0.22)] border border-[#822109]/20'
        : 'bg-[#9f280a]/65 shadow-xl';

  const onAddToCartClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className={`relative flex flex-col md:flex-row items-center ${bgClass} rounded-2xl p-4 lg:p-5 pt-20 md:pt-5 min-h-[160px] lg:min-h-[172px] w-full max-w-[440px] lg:max-w-[520px] overflow-visible transition-transform duration-300 hover:-translate-y-1 mt-12 md:mt-0`}
      >
        {/* Image (absolute positioned to overflow the card slightly like in the design) */}
        <div
          className={`absolute w-32 h-32 ${
            isPinnedDesktop
              ? 'md:w-36 md:h-36 xl:w-40 xl:h-40'
              : 'md:w-40 md:h-40 lg:w-44 lg:h-44'
          } rounded-full overflow-hidden border-[4px] border-white/95 shadow-2xl flex-shrink-0 z-10 transition-transform duration-500 hover:rotate-[15deg] hover:scale-105 
            top-[-48px] left-1/2 -translate-x-1/2 translate-y-0
            md:top-1/2 md:-translate-y-1/2 md:translate-x-0
            ${
              isImageLeft
                ? isPinnedDesktop
                  ? 'md:left-[-20px] lg:left-[-24px] md:right-auto'
                  : 'md:left-[-22px] lg:left-[-28px] md:right-auto'
                : isPinnedDesktop
                  ? 'md:right-[-20px] lg:right-[-24px] md:left-auto'
                  : 'md:right-[-22px] lg:right-[-28px] md:left-auto'
            }`}
        >
          <div className="w-full h-full bg-pizza-cream relative">
            <Image
              src={productImageSrc}
              alt={name}
              fill
              sizes="(max-width: 768px) 128px, (max-width: 1024px) 160px, 176px"
              unoptimized={shouldBypassNextImageOptimization(productImageSrc)}
              className="object-cover"
            />
          </div>
        </div>

        {/* Content Area */}
        <div
          className={`flex flex-col flex-1 h-full py-1 justify-center w-full text-center md:text-left ${
            isImageLeft
              ? isPinnedDesktop
                ? 'md:ml-32 xl:ml-36 md:pr-1 md:mr-0'
                : 'md:ml-36 lg:ml-40 md:pr-1 md:mr-0'
              : isPinnedDesktop
                ? 'md:mr-32 xl:mr-36 md:pl-1 md:ml-0'
                : 'md:mr-36 lg:mr-40 md:pl-1 md:ml-0'
          }`}
        >
          <div className="flex items-center gap-1.5 justify-center md:justify-start mb-1 flex-wrap">
            <h3 className="text-white font-bold text-base lg:text-lg leading-tight line-clamp-1 text-center md:text-left">
              {td(name)}
            </h3>
            {tasteInfo.badges.map((badge) => (
              <span
                key={badge.key}
                className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.className}`}
              >
                {td(badge.label)}
              </span>
            ))}
            {!isCombo && !isHalfHalfItem && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist({
                    dish_id: id,
                    dish_name: name,
                    image: imageUrl,
                    ingredient: ingredients,
                    category: categoryName,
                    dish_type,
                    min_price: price,
                    prices,
                  });
                }}
                title={isLiked ? t('product.wishlist_remove') : t('product.wishlist_add')}
                className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-all active:scale-95 cursor-pointer ${
                  isLiked
                    ? 'bg-white border-white text-[#ee2828] shadow-md'
                    : 'bg-black/20 hover:bg-black/35 border-white/30 text-white/90'
                }`}
              >
                <Heart size={13} className={isLiked ? 'fill-[#ee2828] text-[#ee2828]' : ''} />
              </button>
            )}
          </div>
          {ingredients && (
            <p className="text-white/85 text-[10px] lg:text-xs leading-snug mb-3 whitespace-pre-line text-center md:text-left">
              {isCombo
                ? tc(ingredients)
                : isHalfHalfItem
                  ? t('product.half_half_desc')
                  : ti(ingredients)}
            </p>
          )}

          <div className={`flex items-center justify-center md:justify-start gap-2.5 ${ingredients ? 'mt-auto' : 'mt-3'}`}>
            {theme === 'green' ? (
              <>
                <div className="bg-white px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-md text-xs lg:text-sm font-extrabold shadow-inner">
                  <span className="text-[#007a3f]">
                    {isHalfHalfItem ? t('product.half_half_price') : formatPrice(price)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onAddToCartClick}
                  className="bg-[#ee2828] hover:bg-red-700 text-white text-[10px] lg:text-xs font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-md shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  {isHalfHalfItem ? t('product.choose_flavor') : t('product.add_to_cart')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onAddToCartClick}
                  className="bg-[#007a3f] hover:bg-green-700 text-white text-[10px] lg:text-xs font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-md shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  {isHalfHalfItem ? t('product.choose_flavor') : t('product.add_to_cart')}
                </button>
                <div className="bg-white px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-md text-xs lg:text-sm font-extrabold shadow-inner">
                  <span className="text-[#ee2828]">
                    {isHalfHalfItem ? t('product.half_half_price') : formatPrice(price)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        isHalfHalfItem ? (
          <HalfHalfModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        ) : isCombo ? (
          <ComboModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            comboId={id}
            comboName={name}
            comboPrice={price}
            comboDescription={ingredients}
            imageUrl={imageUrl}
          />
        ) : (
          <ProductModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={{ id, name, ingredients, basePrice: price, prices, imageUrl, dish_type }}
            categoryName={categoryName}
          />
        )
      )}
    </>
  );
}

export default React.memo(ProductCard);
