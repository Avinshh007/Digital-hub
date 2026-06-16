// src/app/admin/orders/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, ClipboardList, Search, Loader2, Save, Printer, Truck, Check, RefreshCw 
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Status values mapped for fast state updates
  const [tempStatus, setTempStatus] = useState<{ [key: string]: string }>({});
  const [tempPaymentStatus, setTempPaymentStatus] = useState<{ [key: string]: string }>({});
  const [tempTracking, setTempTracking] = useState<{ [key: string]: string }>({});

  const fetchOrdersList = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        
        // Populate temp buffers
        const statusBuf: { [key: string]: string } = {};
        const payStatusBuf: { [key: string]: string } = {};
        const trackingBuf: { [key: string]: string } = {};
        
        for (const order of data.orders || []) {
          statusBuf[order.id] = order.status;
          payStatusBuf[order.id] = order.paymentStatus;
          trackingBuf[order.id] = order.trackingNumber || '';
        }
        setTempStatus(statusBuf);
        setTempPaymentStatus(payStatusBuf);
        setTempTracking(trackingBuf);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersList();
  }, []);

  const handleUpdate = async (id: string) => {
    setUpdatingOrderId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: tempStatus[id],
          paymentStatus: tempPaymentStatus[id],
          trackingNumber: tempTracking[id] || null,
        }),
      });

      if (res.ok) {
        alert('Order logs updated successfully!');
        fetchOrdersList();
      } else {
        alert('Failed to update order status.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleInputChange = (id: string, field: 'status' | 'pay' | 'track', value: string) => {
    if (field === 'status') setTempStatus({ ...tempStatus, [id]: value });
    if (field === 'pay') setTempPaymentStatus({ ...tempPaymentStatus, [id]: value });
    if (field === 'track') setTempTracking({ ...tempTracking, [id]: value });
  };

  const filteredOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
        <span className="text-slate-500 font-bold">Loading Store Invoices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-brand/40 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            Orders Fulfillment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total of {orders.length} order transactions logged
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="space-y-4">
        
        {/* Search input */}
        <div className="relative max-w-md bg-card text-card-foreground">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Order ID, Customer Name or Email..."
            className="w-full bg-slate-50 border border-border-brand rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-900 text-xs sm:text-sm font-semibold"
          />
          <Search size={16} className="absolute right-3.5 top-3 text-slate-400" />
        </div>

        {/* Orders Table */}
        <div className="bg-card text-card-foreground border border-border-brand rounded-3xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border-brand text-slate-500 font-bold uppercase">
                <th className="p-3">Order Details</th>
                <th className="p-3">Customer Info</th>
                <th className="p-3 text-right">Total Price</th>
                <th className="p-3">Logistics Status</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3">Tracking Number</th>
                <th className="p-3 text-right">Fulfill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40 text-slate-700 dark:text-slate-200">
              {filteredOrders.map((order) => {
                const isUpdating = updatingOrderId === order.id;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    
                    {/* ID & Invoice link */}
                    <td className="p-3 min-w-[150px]">
                      <span className="block font-mono font-bold text-slate-800 dark:text-slate-200">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                        {new Date(order.createdAt).toLocaleString('en-IN')}
                      </span>
                      <Link
                        href={`/checkout/success?orderId=${order.id}`}
                        className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-500 hover:underline mt-1.5"
                      >
                        <Printer size={10} />
                        <span>View Invoice</span>
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="p-3 min-w-[130px]">
                      <span className="block font-bold truncate text-slate-800 dark:text-slate-200">{order.user?.name}</span>
                      <span className="block text-[10px] text-slate-400 truncate mt-0.5">{order.user?.email}</span>
                    </td>

                    {/* Total price */}
                    <td className="p-3 text-right font-black">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </td>

                    {/* Delivery Status Select dropdown */}
                    <td className="p-3 min-w-[120px]">
                      <select
                        value={tempStatus[order.id] || 'PENDING'}
                        onChange={(e) => handleInputChange(order.id, 'status', e.target.value)}
                        className="bg-slate-50 text-slate-900 border border-border-brand rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-800 dark:text-slate-100 font-semibold"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    {/* Payment Status Selector */}
                    <td className="p-3 min-w-[110px]">
                      <select
                        value={tempPaymentStatus[order.id] || 'PENDING'}
                        onChange={(e) => handleInputChange(order.id, 'pay', e.target.value)}
                        className="bg-slate-50 text-slate-900 border border-border-brand rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-800 dark:text-slate-100 font-semibold"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="FAILED">FAILED</option>
                      </select>
                    </td>

                    {/* Tracking ID Input */}
                    <td className="p-3 min-w-[140px]">
                      <input
                        type="text"
                        value={tempTracking[order.id] || ''}
                        onChange={(e) => handleInputChange(order.id, 'track', e.target.value)}
                        placeholder="Logistics Track ID"
                        className="w-full bg-slate-50 border border-border-brand rounded-lg px-2 py-1 text-[11px] font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </td>

                    {/* Action button */}
                    <td className="p-3 text-right min-w-[80px]">
                      <button
                        onClick={() => handleUpdate(order.id)}
                        disabled={isUpdating}
                        className="p-2 bg-slate-900 hover:bg-amber-500 hover:text-blue-950 text-white border rounded-xl transition-all cursor-pointer inline-block disabled:opacity-50"
                        title="Save changes"
                      >
                        {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
