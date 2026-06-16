// src/app/(customer)/profile/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  User, ClipboardList, MapPin, Printer, Loader2, RefreshCw, CheckCircle, Package, Truck, Smile, AlertTriangle 
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileAndOrders = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const ordersRes = await fetch('/api/orders');
      
      if (userRes.ok && ordersRes.ok) {
        const userData = await userRes.json();
        const ordersData = await ordersRes.json();
        
        setUser(userData.user);
        setOrders(ordersData.orders || []);
      }
    } catch (e) {
      console.error('Failed to load profile data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileAndOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfileAndOrders();
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'PROCESSING': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 0; // Cancelled or others
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
        <span className="text-slate-500 font-bold">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in flex-grow">
      
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-white/10 rounded-2xl">
            <User size={36} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{user?.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">{user?.email}</p>
            <span className="inline-block bg-white/10 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded mt-1">
              Registered: {new Date(user?.createdAt).toLocaleDateString('en-US')}
            </span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-blue-950 font-extrabold text-xs py-2.5 px-5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Orders List Container */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center space-x-2 border-l-4 border-amber-500 pl-3">
          <ClipboardList size={22} className="text-amber-500" />
          <span>{t.trackingStatus} & History</span>
        </h2>

        {orders.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-card border border-border-brand rounded-2xl text-center p-6">
            <ClipboardList size={40} className="text-slate-300 dark:text-slate-700" />
            <h3 className="font-extrabold text-slate-600 dark:text-slate-400 text-base sm:text-lg">No Orders Placed Yet</h3>
            <Link href="/products" className="bg-primary-brand text-white text-xs font-bold px-5 py-2 rounded-full shadow-md">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const currentStep = getStatusStep(order.status);
              const isCancelled = order.status === 'CANCELLED';
              let addr: any = {};
              try { addr = JSON.parse(order.shippingAddress); } catch (e) {}

              return (
                <div 
                  key={order.id} 
                  className="bg-card text-card-foreground border border-border-brand rounded-3xl p-6 shadow-xs hover:shadow-sm transition-shadow space-y-6"
                >
                  
                  {/* Order Top Bar Info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-brand/40 pb-4 gap-3">
                    <div className="text-xs">
                      <span className="block font-black text-slate-400 uppercase">ORDER ID</span>
                      <span className="block font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                        #{order.id.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                        Placed: {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </span>
                      <span className="text-sm font-black text-primary-brand bg-primary-brand/5 border border-primary-brand/20 px-3.5 py-1 rounded-lg">
                        Total: ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <Link
                        href={`/checkout/success?orderId=${order.id}`}
                        className="flex items-center space-x-1 bg-slate-900 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Printer size={12} />
                        <span>Invoice</span>
                      </Link>
                    </div>
                  </div>

                  {/* Visual Timeline Tracker (Hidden if Cancelled) */}
                  {!isCancelled ? (
                    <div className="py-4">
                      {/* Tracking timeline */}
                      <div className="relative flex items-center justify-between">
                        
                        {/* Gray background line */}
                        <div className="absolute left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 z-0" />
                        
                        {/* Active blue background line */}
                        <div 
                          className="absolute left-0 h-1 bg-primary-brand z-0 transition-all duration-500" 
                          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                        />

                        {/* Step 1: Placed */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border ${
                            currentStep >= 1 ? 'bg-primary-brand border-primary-brand text-white' : 'bg-card border-slate-300 text-slate-400'
                          }`}>
                            <CheckCircle size={16} />
                          </div>
                          <span className="text-[10px] font-bold mt-1.5 text-slate-500 dark:text-slate-400 uppercase">Placed</span>
                        </div>

                        {/* Step 2: Processing */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border ${
                            currentStep >= 2 ? 'bg-primary-brand border-primary-brand text-white' : 'bg-card border-slate-300 text-slate-400'
                          }`}>
                            <Package size={16} />
                          </div>
                          <span className="text-[10px] font-bold mt-1.5 text-slate-500 dark:text-slate-400 uppercase">Processing</span>
                        </div>

                        {/* Step 3: Shipped */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border ${
                            currentStep >= 3 ? 'bg-primary-brand border-primary-brand text-white' : 'bg-card border-slate-300 text-slate-400'
                          }`}>
                            <Truck size={16} />
                          </div>
                          <span className="text-[10px] font-bold mt-1.5 text-slate-500 dark:text-slate-400 uppercase">Shipped</span>
                        </div>

                        {/* Step 4: Delivered */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border ${
                            currentStep >= 4 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-card border-slate-300 text-slate-400'
                          }`}>
                            <Smile size={16} />
                          </div>
                          <span className="text-[10px] font-bold mt-1.5 text-slate-500 dark:text-slate-400 uppercase">Delivered</span>
                        </div>

                      </div>

                      {/* Display Tracking Number if Shipped */}
                      {order.trackingNumber && (
                        <div className="mt-5 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold w-fit">
                          Logistics Tracking ID: {order.trackingNumber}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-rose-500 font-bold text-sm bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl w-fit">
                      <AlertTriangle size={18} />
                      <span>ORDER CANCELLED</span>
                    </div>
                  )}

                  {/* Order Items Table & Delivery Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border-brand/40">
                    
                    {/* Items List (2 Cols) */}
                    <div className="md:col-span-2 space-y-2 text-xs sm:text-sm">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2">Order Items</h4>
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-4">
                            {item.product?.name} <span className="text-slate-400 font-bold">x {item.quantity}</span>
                          </span>
                          <span className="font-black shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Coordinates (1 Col) */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-xs space-y-2 border border-border-brand/20">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                        <MapPin size={14} className="text-amber-500" />
                        <span>Delivery Address</span>
                      </h4>
                      <div className="space-y-0.5 font-semibold text-slate-600 dark:text-slate-300">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{addr.fullName}</p>
                        <p>{addr.street}</p>
                        <p>{addr.city}, {addr.state} - {addr.pinCode}</p>
                        <p className="font-black pt-1">Phone: {addr.phone}</p>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
