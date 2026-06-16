// src/app/(customer)/checkout/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Truck, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Shipping Address Form State
  const [fullName, setFullName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Andhra Pradesh');
  const [pinCode, setPinCode] = useState('');
  const [phone, setPhone] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  // Simulated Card Info
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Coupon state loaded from Cart session
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponType, setCouponType] = useState<'PERCENTAGE' | 'FIXED' | null>(null);

  // Load coupon from session storage and guard empty cart
  useEffect(() => {
    if (cart.length === 0) {
      router.push('/cart');
      return;
    }

    const savedCoupon = sessionStorage.getItem('applied_coupon');
    if (savedCoupon) {
      try {
        const parsed = JSON.parse(savedCoupon);
        setCouponCode(parsed.code);
        setCouponDiscount(parsed.discount);
        setCouponType(parsed.type);
      } catch (e) {
        console.error(e);
      }
    }
  }, [cart, router]);

  // Compute Prices
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (couponType === 'PERCENTAGE') {
    discountAmount = (subtotal * couponDiscount) / 100;
  } else if (couponType === 'FIXED') {
    discountAmount = couponDiscount;
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round((subtotal - discountAmount) - ((subtotal - discountAmount) / 1.18));

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!fullName.trim() || !street.trim() || !city.trim() || !pinCode.trim() || !phone.trim()) {
      setError('Please fill in all shipping fields');
      return;
    }

    if (phone.trim().length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (paymentMethod === 'ONLINE') {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
        setError('Please enter your simulated card payment details');
        return;
      }
    }

    setLoading(true);

    try {
      const orderItems = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const shippingAddress = {
        fullName: fullName.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        phone: phone.trim(),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress,
          paymentMethod,
          couponCode: couponCode || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Clear cart contexts
        clearCart();
        sessionStorage.removeItem('applied_coupon');
        // Redirect to success confirmation
        router.push(`/checkout/success?orderId=${data.order.id}`);
      } else {
        setError(data.error || 'Failed to place order. Please check stock details.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex-grow">
      
      {/* Title */}
      <div className="mb-8 border-b border-border-brand/40 pb-4">
        <h1 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          Checkout Securely
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide your shipping details and choose a payment method
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Shipping & Payment Form (2 Columns) */}
        <main className="lg:col-span-2">
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            
            {/* Address Block */}
            <div className="bg-card text-card-foreground border border-border-brand p-6 sm:p-8 rounded-3xl shadow-xs space-y-4">
              <h3 className="font-extrabold text-base uppercase tracking-wide border-b border-border-brand/40 pb-2">
                {t.shippingDetails}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                
                {/* Full name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-slate-500 font-bold">{t.fullName}</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Avinash"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-medium"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">{t.phone}</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-medium"
                  />
                </div>

                {/* PIN Code */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">{t.pinCode}</label>
                  <input
                    type="text"
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="6-digit PIN code"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-medium"
                  />
                </div>

                {/* Street address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-slate-500 font-bold">{t.address}</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="House No, Building, Street Name, Landmark"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-medium"
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">{t.city}</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Nellore"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-medium"
                  />
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">{t.state}</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-semibold"
                  >
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Payment Method Block */}
            <div className="bg-card text-card-foreground border border-border-brand p-6 sm:p-8 rounded-3xl shadow-xs space-y-4">
              <h3 className="font-extrabold text-base uppercase tracking-wide border-b border-border-brand/40 pb-2">
                {t.paymentMethod}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* COD Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex items-start space-x-3 p-4 border rounded-2xl text-left cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-primary-brand bg-primary-brand/5 ring-1 ring-primary-brand shadow-sm'
                      : 'border-border-brand hover:border-slate-400'
                  }`}
                >
                  <Truck className="text-amber-500 mt-0.5 shrink-0" size={20} />
                  <div>
                    <span className="block font-black text-sm text-slate-900 dark:text-slate-100">{t.cashOnDelivery}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Pay with cash or UPI QR scan upon delivery.</span>
                  </div>
                </button>

                {/* Online Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`flex items-start space-x-3 p-4 border rounded-2xl text-left cursor-pointer transition-all ${
                    paymentMethod === 'ONLINE'
                      ? 'border-primary-brand bg-primary-brand/5 ring-1 ring-primary-brand shadow-sm'
                      : 'border-border-brand hover:border-slate-400'
                  }`}
                >
                  <CreditCard className="text-amber-500 mt-0.5 shrink-0" size={20} />
                  <div>
                    <span className="block font-black text-sm text-slate-900 dark:text-slate-100">Simulated Card Payment</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Integrates Razorpay/Stripe sandbox environments.</span>
                  </div>
                </button>

              </div>

              {/* Simulated Card Forms */}
              {paymentMethod === 'ONLINE' && (
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-border-brand/40 space-y-3.5 text-xs sm:text-sm animate-fade-in">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 font-bold border-b border-border-brand/40 pb-2 mb-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span>SANDBOX SECURE CONNECTION</span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      className="w-full bg-card border border-border-brand rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-bold">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-card border border-border-brand rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-bold">CVV / CVC</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full bg-card border border-border-brand rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

          </form>
        </main>

        {/* Order Summary Sidebar (1 Column) */}
        <aside className="space-y-6">
          <div className="bg-card text-card-foreground border border-border-brand p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-border-brand/40 pb-2">
              {t.orderSummary}
            </h3>

            {/* List mini products */}
            <div className="divide-y divide-border-brand/40 max-h-56 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div className="min-w-0 pr-4">
                    <span className="block font-bold truncate text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="block text-slate-400 font-semibold text-[10px]">Qty: {item.quantity} x ₹{item.price.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="font-black shrink-0 text-slate-900 dark:text-slate-100">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Computations */}
            <div className="border-t border-border-brand/40 pt-3 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Items Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Discount ({couponCode})</span>
                  <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-400">
                <span>Inclusive GST (18%)</span>
                <span>₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-border-brand/40 pt-2 flex justify-between items-baseline">
                <span className="font-black text-sm uppercase tracking-wider">Final Total</span>
                <span className="text-xl font-black text-primary-brand">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="flex items-start space-x-2 text-xs text-rose-500 font-bold bg-rose-500/5 p-3 border border-rose-500/20 rounded-xl">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-primary-brand hover:bg-primary-brand-hover text-white font-extrabold py-3.5 rounded-full shadow-lg hover:shadow-primary-brand/20 transition-all cursor-pointer text-sm uppercase tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}
