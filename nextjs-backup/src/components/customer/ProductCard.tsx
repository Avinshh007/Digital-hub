// src/components/customer/ProductCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    stock: number;
    sku: string;
    images: string; // JSON string
    rating: number;
    ratingCount: number;
    category?: { name: string; slug: string };
    brand?: { name: string; slug: string };
    gstRate: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { t } = useLanguage();

  // Parse images JSON
  let imageUrl = '/uploads/hero_banner.jpg';
  try {
    const parsed = JSON.parse(product.images);
    if (Array.isArray(parsed) && parsed.length > 0) {
      imageUrl = parsed[0];
    }
  } catch (e) {
    console.error('Failed to parse product images JSON', e);
  }

  // Calculate discount percentage
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isProductInWishlist = isInWishlist(product.id);
  const outOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page when clicking add to cart
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: imageUrl,
      stock: product.stock,
      sku: product.sku,
      gstRate: product.gstRate,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: imageUrl,
      stock: product.stock,
    });
  };

  return (
    <div className="group relative bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/80 hover:-translate-y-1 transition-all duration-500 flex flex-col h-full animate-fade-in">
      
      {/* Product Image Container */}
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/3] bg-slate-50 overflow-hidden rounded-t-[2rem]">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-6 group-hover:scale-110 group-hover:-rotate-2 transition-transform duration-700 mix-blend-multiply"
          loading="lazy"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-emerald-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md z-10">
            {discount}% OFF
          </span>
        )}

        {/* Out of Stock Overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="bg-red-600 text-white font-bold text-sm px-4 py-1.5 rounded-full shadow-lg">
              {t.outOfStock}
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md backdrop-blur-md transition-all duration-200 z-10 border ${
            isProductInWishlist 
              ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:text-rose-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
          title={isProductInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={18} fill={isProductInWishlist ? 'currentColor' : 'none'} className="transition-transform active:scale-125" />
        </button>
      </Link>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        
        {/* Brand & Category */}
        <div className="flex items-center justify-between text-xs text-muted-brand font-semibold mb-1">
          <span>{product.brand?.name || 'SPC'}</span>
          <span>{product.category?.name}</span>
        </div>

        {/* Title */}
        <Link href={`/products/${product.id}`} className="block flex-grow mb-2">
          <h3 className="font-bold text-sm sm:text-base line-clamp-2 hover:text-primary-brand transition-colors text-slate-800 dark:text-slate-100">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-3">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < Math.round(product.rating) ? 'currentColor' : 'none'}
                className="shrink-0"
              />
            ))}
          </div>
          <span className="text-xs text-muted-brand font-medium">({product.ratingCount})</span>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-brand/40">
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-muted-brand line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 shadow-md ${
              outOfStock
                ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-primary-brand text-white hover:bg-primary-brand-hover active:scale-95 hover:shadow-lg hover:shadow-primary-brand/20'
            }`}
            title={outOfStock ? 'Out of Stock' : t.addToCart}
          >
            <ShoppingCart size={18} />
          </button>
        </div>

      </div>

    </div>
  );
}
