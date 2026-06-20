// src/components/customer/SuccessClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Printer, ClipboardList, Loader2, ArrowRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
        <span className="text-slate-500 font-bold">{t.loading}</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <span className="text-rose-500 text-5xl">⚠️</span>
        <h3 className="font-extrabold text-xl">Order Not Found</h3>
        <Link href="/" className="bg-primary-brand text-white font-bold px-6 py-2 rounded-full inline-block">
          Go to Homepage
        </Link>
      </div>
    );
  }

  let addr: any = {};
  try {
    addr = JSON.parse(order.shippingAddress);
  } catch (e) { }

  const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in flex-grow">

      {/* 1. Header Confirmation (Hidden on print) */}
      <div className="text-center space-y-3 no-print bg-emerald-500/10 border border-emerald-500/20 p-6 sm:p-8 rounded-3xl">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-500 text-white rounded-full shadow-lg">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          {t.orderSuccess}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
          Thank you for choosing  DIGITAL HUB. Your order <span className="font-mono font-bold text-slate-900 dark:text-slate-100">#{order.id.slice(0, 8).toUpperCase()}</span> is placed.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-full shadow-md cursor-pointer"
          >
            <Printer size={14} />
            <span>{t.invoice}</span>
          </button>
          <Link
            href="/profile"
            className="flex items-center space-x-1.5 bg-white text-slate-800 border hover:bg-slate-50 font-bold text-xs py-2 px-4 rounded-full shadow-sm"
          >
            <ClipboardList size={14} />
            <span>Track Order Status</span>
          </Link>
        </div>
      </div>

      {/* 2. High fidelity Tax Invoice (Will print clean on A4) */}
      <div className="bg-white text-slate-900 border border-slate-300 p-6 sm:p-10 rounded-3xl shadow-sm print-card space-y-6">

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-5 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-amber-600 tracking-wider">TAX INVOICE</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-slate-900">
               DIGITAL HUB
            </h2>
            <div className="text-xs text-slate-500 font-semibold space-y-0.5">
              <p>D.No: 15-201, Trunk Road, Near  DIGITAL HUBComplex</p>
              <p>Nellore, Andhra Pradesh, 524001, India</p>
              <p>GSTIN: 37SPCNE8291F1Z2 (Simulated)</p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1 sm:self-end">
            <p className="font-bold text-slate-500 uppercase">Order Details</p>
            <p><span className="font-bold text-slate-600">INVOICE NO:</span> SPC-{order.id.slice(0, 8).toUpperCase()}</p>
            <p><span className="font-bold text-slate-600">DATE:</span> {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            <p><span className="font-bold text-slate-600">PAYMENT METHOD:</span> {order.paymentMethod === 'COD' ? 'Cash On Delivery' : 'Online Prepaid'}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h4 className="font-black text-slate-500 uppercase">Billed To (Customer)</h4>
            <p className="font-black text-sm text-slate-800">{addr.fullName}</p>
            <p className="text-slate-600">{addr.street}</p>
            <p className="text-slate-600">{addr.city}, {addr.state} - {addr.pinCode}</p>
            <p className="text-slate-600 font-semibold">Phone: {addr.phone}</p>
          </div>

          <div className="space-y-1">
            <h4 className="font-black text-slate-500 uppercase">Shipped From</h4>
            <p className="font-black text-sm text-slate-800"> DIGITAL HUBNellore</p>
            <p className="text-slate-600">Trunk Road Depot</p>
            <p className="text-slate-600">Nellore, AP - 524001</p>
            <p className="text-slate-600 font-semibold">Phone: ++919848257578</p>
          </div>
        </div>

        {/* Product Items Table */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 font-bold uppercase border-b border-slate-200 text-slate-700">
              <th className="p-3">Product Name</th>
              <th className="p-3 text-center">Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Tax (GST 18%)</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item: any, index: number) => {
              const basePrice = item.price / 1.18;
              const unitGst = item.price - basePrice;

              return (
                <tr key={index}>
                  <td className="p-3">
                    <span className="font-bold text-slate-800">{item.product?.name || 'Computer Component'}</span>
                    <span className="block text-[9px] text-slate-400 font-bold font-mono">SKU: {item.product?.sku}</span>
                  </td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">₹{basePrice.toFixed(2)}</td>
                  <td className="p-3 text-right">₹{(unitGst * item.quantity).toFixed(2)}</td>
                  <td className="p-3 text-right">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Computation Summary */}
        <div className="flex justify-end pt-4">
          <div className="w-64 text-xs space-y-2.5">

            <div className="flex justify-between font-semibold">
              <span className="text-slate-500">Items Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between font-bold text-emerald-600">
                <span>Discount Applied</span>
                <span>- ₹{order.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>GST (18% inclusive)</span>
              <span>₹{order.taxAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="border-t border-slate-300 pt-2.5 flex justify-between items-baseline font-black text-sm">
              <span className="uppercase tracking-wide">Grand Total</span>
              <span className="text-base font-black text-blue-900">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

          </div>
        </div>

        {/* T&C / Footer Sign */}
        <div className="border-t border-slate-200 pt-6 text-[10px] text-slate-400 leading-relaxed text-center font-semibold">
          <p>Thank you for purchasing from  DIGITAL HUB. This is a computer-generated GST tax invoice.</p>
          <p>Nellore Jurisdiction only. Subject to manufacturer warranty terms.</p>
        </div>

      </div>

      {/* 3. Continue CTA (Hidden on print) */}
      <div className="text-center no-print pt-4">
        <Link
          href="/products"
          className="inline-flex items-center space-x-2 bg-primary-brand hover:bg-primary-brand-hover text-white font-extrabold px-8 py-3 rounded-full shadow-lg"
        >
          <span>Continue Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  );
}
