// src/app/(customer)/cart/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowRight, Ticket, Check, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { t } = useLanguage();

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: 'PERCENTAGE' | 'FIXED' } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  // Compute Subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Auto-revalidate coupon if cart quantities change
  useEffect(() => {
    if (appliedCoupon) {
      let minOrder = 0;
      if (appliedCoupon.code === 'SAVE10') minOrder = 1000;
      if (appliedCoupon.code === 'WELCOME200') minOrder = 1500;

      if (subtotal < minOrder) {
        setAppliedCoupon(null);
        setCouponSuccess(false);
        setCouponError(`Coupon ${appliedCoupon.code} removed (Subtotal fell below ₹${minOrder})`);
      }
    }
  }, [subtotal, appliedCoupon]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess(false);
    
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'SAVE10') {
      if (subtotal < 1000) {
        setCouponError('Minimum order value for SAVE10 is ₹1,000');
        return;
      }
      setAppliedCoupon({ code, discount: 10, type: 'PERCENTAGE' });
      setCouponSuccess(true);
    } else if (code === 'WELCOME200') {
      if (subtotal < 1500) {
        setCouponError('Minimum order value for WELCOME200 is ₹1,500');
        return;
      }
      setAppliedCoupon({ code, discount: 200, type: 'FIXED' });
      setCouponSuccess(true);
    } else {
      setCouponError('Invalid or expired coupon code');
    }
  };

  // Discount Calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      discountAmount = (subtotal * appliedCoupon.discount) / 100;
    } else if (appliedCoupon.type === 'FIXED') {
      discountAmount = appliedCoupon.discount;
    }
  }

  // GST calculation (inclusive)
  // GST Amount = Price - (Price / 1.18)
  const gstAmount = Math.round((subtotal - discountAmount) - ((subtotal - discountAmount) / 1.18));
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleProceedToCheckout = () => {
    // Save coupon in session state for checkout
    if (appliedCoupon) {
      sessionStorage.setItem('applied_coupon', JSON.stringify(appliedCoupon));
    } else {
      sessionStorage.removeItem('applied_coupon');
    }
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex-grow">
      
      {/* Title */}
      <div className="mb-8 border-b border-border-brand/40 pb-4">
        <h1 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center space-x-2">
          <ShoppingCart className="text-amber-500" size={26} />
          <span>{t.shoppingCart}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review items in your cart before checking out
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-card border border-border-brand rounded-2xl p-10 text-center">
          <ShoppingCart size={48} className="text-slate-300 dark:text-slate-700" />
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-700 dark:text-slate-300">{t.emptyCart}</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Explore our electronics catalog to add laptops, mouse, speakers, and more.</p>
          </div>
          <Link 
            href="/products" 
            className="flex items-center space-x-2 bg-primary-brand hover:bg-primary-brand-hover text-white font-bold px-6 py-2.5 rounded-full transition-all shadow-md"
          >
            <span>Start Shopping</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List (2 Columns) */}
          <main className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div 
                key={item.id} 
                className="bg-card text-card-foreground border border-border-brand p-4 sm:p-5 rounded-2xl flex items-center gap-4 sm:gap-6 shadow-xs relative"
              >
                {/* Product Thumbnail */}
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden shrink-0 border border-border-brand/40">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0 space-y-1.5 pr-6 sm:pr-0">
                  <Link href={`/products/${item.id}`} className="block">
                    <h3 className="font-bold text-sm sm:text-base hover:text-primary-brand transition-colors line-clamp-1 pr-4">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">SKU: {item.sku}</p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Price */}
                    <div className="flex items-baseline space-x-2">
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                      {item.originalPrice > item.price && (
                        <span className="text-xs text-slate-500 line-through">
                          ₹{item.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-border-brand rounded-full bg-slate-50 dark:bg-slate-900 px-2 py-0.5 text-xs sm:text-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 font-bold text-slate-500 hover:text-slate-800"
                      >
                        -
                      </button>
                      <span className="px-2 font-black">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 font-bold text-slate-500 hover:text-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete button (positioned top-right on mobile) */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>

              </div>
            ))}
          </main>

          {/* Cart Summary (1 Column) */}
          <aside className="space-y-6">
            
            {/* Coupon Code Block */}
            <div className="bg-card text-card-foreground border border-border-brand p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wide flex items-center space-x-1.5 border-b border-border-brand/40 pb-2">
                <Ticket size={16} className="text-amber-500" />
                <span>Coupons & Promo Codes</span>
              </h3>

              <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="e.g. SAVE10"
                  disabled={!!appliedCoupon}
                  className="flex-grow bg-slate-50 text-slate-900 border border-border-brand rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 uppercase"
                />
                <button
                  type="submit"
                  disabled={!!appliedCoupon}
                  className="bg-slate-900 dark:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wide hover:bg-amber-500 hover:text-blue-950 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t.apply}
                </button>
              </form>

              {couponError && (
                <div className="flex items-center space-x-1.5 text-xs text-rose-500 font-bold">
                  <AlertCircle size={14} />
                  <span>{couponError}</span>
                </div>
              )}

              {couponSuccess && appliedCoupon && (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-600 font-bold">
                  <div className="flex items-center space-x-1">
                    <Check size={14} />
                    <span>Coupon '{appliedCoupon.code}' applied!</span>
                  </div>
                  <button 
                    onClick={() => { setAppliedCoupon(null); setCouponSuccess(false); setCouponInput(''); }}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Quick tip */}
              <div className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                Available codes:
                <br />• <span className="text-amber-600 font-bold">SAVE10</span> - 10% OFF on orders above ₹1,000
                <br />• <span className="text-amber-600 font-bold">WELCOME200</span> - ₹200 OFF on orders above ₹1,500
              </div>
            </div>

            {/* Total Summary Block */}
            <div className="bg-card text-card-foreground border border-border-brand p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-border-brand/40 pb-2">
                {t.shoppingCart} Summary
              </h3>

              <div className="space-y-3 text-sm">
                
                {/* Subtotal */}
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">{t.subtotal}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Coupon discount */}
                {discountAmount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>{t.discount} ({appliedCoupon?.code})</span>
                    <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* GST */}
                <div className="flex justify-between text-xs text-slate-400">
                  <span>GST (18% inclusive)</span>
                  <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-border-brand/40 pt-3 flex justify-between items-baseline">
                  <span className="font-black text-slate-800 dark:text-slate-200">{t.total}</span>
                  <span className="text-xl sm:text-2xl font-black text-primary-brand">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>

              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full flex items-center justify-center space-x-2 bg-primary-brand hover:bg-primary-brand-hover text-white font-extrabold py-3.5 rounded-full shadow-lg hover:shadow-primary-brand/20 transition-all cursor-pointer text-sm sm:text-base"
              >
                <span>{t.checkout}</span>
                <ArrowRight size={18} />
              </button>

              <div className="text-center">
                <Link href="/products" className="text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors">
                  ← Continue Shopping
                </Link>
              </div>
            </div>

          </aside>

        </div>
      )}

    </div>
  );
}
