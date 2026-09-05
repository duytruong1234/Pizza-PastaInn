'use client';

import React from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { useAddToCart } from '@/hooks/useAddToCart';
import ProductModal from './ProductModal';
import ComboModal from './ComboModal';
import HalfHalfModal from './HalfHalfModal';
import { useState } from 'react';

interface ProductCardProps {
  id: number;
  name: string;
  ingredients: string;
  price: number;
  dish_price_id?: string;
  prices?: any[];
  imageUrl: string;
  layout?: 'image-left' | 'image-right';
  theme?: 'green' | 'red';
  isCombo?: boolean;
  isHalfHalf?: boolean;
  categoryName?: string;
}

export default function ProductCard({
  id,
  name,
  ingredients,
  price,
  dish_price_id,
  prices = [],
  imageUrl,
  layout = 'image-left',
  theme = 'green',
  isCombo = false,
  isHalfHalf = false,
  categoryName = '',
}: ProductCardProps) {
  const isImageLeft = layout === 'image-left';
  const { handleAddToCart } = useAddToCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const productImageSrc = imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop';

  // Màu nền theo chủ đề
  const bgClass = theme === 'green' ? 'bg-[#294c29]/60' : 'bg-[#9f280a]/60';
  const priceColorClass = theme === 'green' ? 'text-pizza-green' : 'text-pizza-red';

  const onAddToCartClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className={`relative flex flex-col md:flex-row items-center ${bgClass} rounded-2xl p-4 lg:p-5 pt-20 md:pt-5 min-h-[160px] lg:min-h-[176px] shadow-xl w-full max-w-[420px] lg:max-w-[500px] overflow-visible transition-all duration-300 hover:-translate-y-1 mt-12 md:mt-0`}>
        {/* Image (absolute positioned to overflow the card slightly like in the design) */}
        <div
          className={`absolute w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden border-[4px] border-white/90 shadow-2xl flex-shrink-0 z-10 transition-transform duration-500 hover:rotate-[15deg] hover:scale-105 
            top-[-48px] left-1/2 -translate-x-1/2 translate-y-0
            md:top-1/2 md:-translate-y-1/2 md:translate-x-0
            ${isImageLeft ? 'md:left-[-24px] lg:left-[-40px] md:right-auto' : 'md:right-[-24px] lg:right-[-40px] md:left-auto'}`}
        >
          {/* Placeholder image using a generic pizza URL since we don't have real images yet */}
          <div className="w-full h-full bg-pizza-cream relative">
            <Image
              src={productImageSrc}
              alt={name}
              fill
              sizes="(max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
              unoptimized={shouldBypassNextImageOptimization(productImageSrc)}
              className="object-cover"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex flex-col flex-1 h-full py-1 justify-center w-full text-center md:text-left ${
          isImageLeft 
            ? 'md:ml-36 lg:ml-44 md:pr-1 md:mr-0' 
            : 'md:mr-36 lg:mr-44 md:pl-1 md:ml-0'
        }`}>
          <h3 className="text-white font-bold text-base lg:text-lg mb-1 leading-tight line-clamp-1 text-center md:text-left">{name}</h3>
          {ingredients && (
            <p className="text-gray-300 text-[10px] lg:text-xs leading-snug mb-3 whitespace-pre-line text-center md:text-left">
              {ingredients}
            </p>
          )}

          <div className={`flex items-center justify-center md:justify-start gap-2.5 ${ingredients ? 'mt-auto' : 'mt-3'}`}>
            {theme === 'green' ? (
              <>
                <div className="bg-white px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-md text-xs lg:text-sm font-extrabold shadow-inner">
                  <span className="text-[#007a3f]">{formatPrice(price)}</span>
                </div>
                <button
                  onClick={onAddToCartClick}
                  className="bg-[#ee2828] hover:bg-red-700 text-white text-[10px] lg:text-xs font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-md shadow-lg transition-all active:scale-95"
                >
                  {"Thêm vào giỏ"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onAddToCartClick}
                  className="bg-[#007a3f] hover:bg-green-700 text-white text-[10px] lg:text-xs font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-md shadow-lg transition-all active:scale-95"
                >
                  {"Thêm vào giỏ"}
                </button>
                <div className="bg-white px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-md text-xs lg:text-sm font-extrabold shadow-inner">
                  <span className="text-[#ee2828]">{formatPrice(price)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isHalfHalf ? (
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
          product={{ id, name, ingredients, basePrice: price, prices, imageUrl }}
          categoryName={categoryName}
        />
      )}
    </>
  );
}
