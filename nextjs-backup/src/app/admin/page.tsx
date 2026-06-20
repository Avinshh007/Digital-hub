// src/app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, AlertTriangle, ArrowRight, DollarSign, ShoppingBag, Laptop, Users, Loader2, RefreshCw 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
        <span className="text-slate-500 font-bold">Loading Store Analytics...</span>
      </div>
    );
  }

  const aggregates = data?.aggregates || { totalSales: 0, ordersCount: 0, productsCount: 0, customersCount: 0 };
  const salesTrend = data?.salesTrend || [];
  const lowStock = data?.lowStockProducts || [];
  const categorySales = data?.categorySales || [];
  const recentOrders = data?.recentOrders || [];

  // Find maximum revenue in trend for scaling CSS chart bars
  const maxRevenue = Math.max(...salesTrend.map((t: any) => t.revenue), 1000);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-brand/40 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            Sales Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time revenues, order tracking, and inventory status for  DIGITAL HUB
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Sync Data'}</span>
        </button>
      </div>

      {/* 1. Aggregates Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Sales */}
        <div className="bg-card text-card-foreground p-5 border border-border-brand rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales</span>
            <span className="block text-xl font-black">₹{aggregates.totalSales.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-card text-card-foreground p-5 border border-border-brand rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <span className="block text-xl font-black">{aggregates.ordersCount} Invoices</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Products */}
        <div className="bg-card text-card-foreground p-5 border border-border-brand rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
            <span className="block text-xl font-black">{aggregates.productsCount} Catalog Items</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Laptop size={24} />
          </div>
        </div>

        {/* Customers */}
        <div className="bg-card text-card-foreground p-5 border border-border-brand rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Customers</span>
            <span className="block text-xl font-black">{aggregates.customersCount} Registered</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <Users size={24} />
          </div>
        </div>

      </section>

      {/* 2. Charts Section & Category Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend CSS Bar Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-card text-card-foreground border border-border-brand rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-border-brand/40 pb-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wide flex items-center space-x-1.5">
              <TrendingUp size={16} className="text-amber-500" />
              <span>7-Day Daily Revenue Trend</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Prepaid & COD</span>
          </div>

          {/* Chart Bars */}
          <div className="h-64 flex items-end justify-between gap-2.5 sm:gap-4 pt-4 px-2">
            {salesTrend.map((t: any, idx: number) => {
              const barHeight = Math.round((t.revenue / maxRevenue) * 100);
              return (
                <div key={idx} className="flex-grow flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on hover */}
                  <span className="absolute -top-6 bg-slate-900 text-white text-[9px] font-bold py-1 px-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-md">
                    ₹{t.revenue.toLocaleString('en-IN')}
                  </span>
                  
                  {/* Column Bar */}
                  <div 
                    className="w-full bg-primary-brand hover:bg-amber-500 rounded-t-lg transition-all duration-500 cursor-pointer shadow-inner"
                    style={{ height: `${Math.max(barHeight, 4)}%` }}
                  />

                  {/* Day Date */}
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 mt-2 truncate max-w-full text-center">
                    {t.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Sales Breakdown (1/3 width) */}
        <div className="bg-card text-card-foreground border border-border-brand rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-border-brand/40 pb-3">
            Category Sales Velocity
          </h3>
          
          {categorySales.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center">No sales recorded yet across categories.</p>
          ) : (
            <div className="space-y-4">
              {categorySales.map((cat: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{cat.name}</span>
                    <span>₹{cat.sales.toLocaleString('en-IN')} ({cat.count} units)</span>
                  </div>
                  {/* CSS Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${Math.min((cat.sales / Math.max(...categorySales.map((c: any) => c.sales))) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 3. Low Stock Alerts & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Low Stock (1/3 width) */}
        <div className="bg-card text-card-foreground border border-border-brand rounded-3xl p-6 shadow-xs space-y-4 h-fit">
          <h3 className="font-extrabold text-sm uppercase tracking-wide flex items-center space-x-1.5 text-amber-500 border-b border-border-brand/40 pb-3">
            <AlertTriangle size={18} />
            <span>Low Stock Alerts</span>
          </h3>

          {lowStock.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 font-bold uppercase">
              ✔ All stock levels normal
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {lowStock.map((prod: any) => (
                <div key={prod.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-border-brand/20 text-xs">
                  <div className="min-w-0 pr-3">
                    <span className="block font-bold truncate text-slate-800 dark:text-slate-200">{prod.name}</span>
                    <span className="block text-slate-400 font-semibold text-[10px]">SKU: {prod.sku} | Brand: {prod.brand?.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                      Qty: {prod.stock}
                    </span>
                    <Link href="/admin/products" className="block text-[9px] font-bold text-amber-500 hover:underline mt-1">
                      Refill Stock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders log (2/3 width) */}
        <div className="lg:col-span-2 bg-card text-card-foreground border border-border-brand rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-brand/40 pb-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wide">
              Recent Sales Orders
            </h3>
            <Link 
              href="/admin/orders" 
              className="text-xs font-bold text-primary-brand hover:text-primary-brand-hover flex items-center space-x-1"
            >
              <span>Manage Orders</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center">No orders logs recorded yet.</p>
          ) : (
            <div className="divide-y divide-border-brand/40 max-h-72 overflow-y-auto pr-1">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs sm:text-sm first:pt-0 last:pb-0">
                  <div className="min-w-0 pr-4">
                    <span className="block font-bold truncate text-slate-800 dark:text-slate-200">
                      #{order.id.slice(0, 8).toUpperCase()} - {order.user?.name}
                    </span>
                    <span className="block text-slate-400 text-[10px] font-semibold">
                      Placed: {new Date(order.createdAt).toLocaleDateString('en-IN')} | Pay: {order.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === 'DELIVERED' 
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : order.status === 'SHIPPED'
                        ? 'bg-blue-500/10 text-blue-500'
                        : order.status === 'CANCELLED'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {order.status}
                    </span>
                    <span className="font-black text-slate-900 dark:text-slate-100">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
