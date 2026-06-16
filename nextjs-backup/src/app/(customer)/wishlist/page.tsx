// src/app/(customer)/wishlist/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const { t } = useLanguage();

  const handleMoveToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      stock: item.stock,
      sku: item.sku || 'SPC-GENERIC',
      gstRate: 18.0,
    });
    removeFromWishlist(item.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex-grow">
      
      {/* Title */}
      <div className="mb-8 border-b border-border-brand/40 pb-4">
        <h1 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center space-x-2">
          <Heart className="text-rose-500 fill-current" size={26} />
          <span>{t.wishlist}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          You have {wishlist.length} products saved in your wishlist
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-card border border-border-brand rounded-2xl p-10 text-center">
          <Heart size={48} className="text-slate-300 dark:text-slate-700" />
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-700 dark:text-slate-300">Your Wishlist is Empty</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Browse products and tap the heart icon to save items here!</p>
          </div>
          <Link 
            href="/products" 
            className="flex items-center space-x-2 bg-primary-brand hover:bg-primary-brand-hover text-white font-bold px-6 py-2.5 rounded-full transition-all shadow-md"
          >
            <span>{t.shop}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div 
              key={item.id} 
              className="bg-card text-card-foreground border border-border-brand rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col h-full justify-between"
            >
              
              {/* Image */}
              <Link href={`/products/${item.id}`} className="aspect-square bg-slate-100 dark:bg-slate-950 block overflow-hidden relative">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </Link>

              {/* Info & Actions */}
              <div className="p-4 flex flex-col flex-grow justify-between space-y-4">
                <div className="space-y-1">
                  <Link href={`/products/${item.id}`} className="block">
                    <h3 className="font-bold text-sm sm:text-base hover:text-primary-brand transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="flex space-x-2 pt-3 border-t border-border-brand/40">
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-2 border border-border-brand rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Move to Cart */}
                  <button
                    onClick={() => handleMoveToCart(item)}
                    disabled={item.stock <= 0}
                    className={`flex-1 flex items-center justify-center space-x-1.5 text-xs font-extrabold py-2 px-3 rounded-lg transition-all cursor-pointer ${
                      item.stock <= 0 
                        ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-primary-brand text-white hover:bg-primary-brand-hover hover:shadow-md'
                    }`}
                  >
                    <ShoppingCart size={14} />
                    <span>{item.stock <= 0 ? t.outOfStock : 'Move to Cart'}</span>
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
