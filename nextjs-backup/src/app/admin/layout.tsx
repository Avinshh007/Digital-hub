// src/app/admin/layout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Laptop, ShoppingBag, Home, LogOut, Loader2, ShieldCheck, Menu, X, ArrowLeft 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Force Light theme
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          // Middleware already verifies admin session; we just populate state
          if (data.user && data.user.role === 'ADMIN') {
            setUser(data.user);
          } else {
            router.push('/');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: 'Analytics Dashboard', href: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'Manage Inventory', href: '/admin/products', icon: <Laptop size={18} /> },
    { label: 'Manage Orders', href: '/admin/orders', icon: <ShoppingBag size={18} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3 bg-slate-50">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
        <span className="text-slate-500 font-bold">Verifying Admin Access...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* 1. Admin Side Nav Drawer */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen bg-blue-950 text-white z-40 flex flex-col justify-between border-r border-blue-900 transition-all duration-300 ${
        sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0 overflow-hidden'
      }`}>
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-blue-900 flex items-center justify-between">
          <Link href="/admin" className="flex flex-col min-w-max">
            <span className="font-extrabold text-sm tracking-tight text-white uppercase">SPC Admin Panel</span>
            <span className="text-[10px] tracking-widest text-amber-400 font-bold uppercase -mt-0.5"> DIGITAL HUB</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 py-3 px-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-amber-500 text-blue-950 shadow-md shadow-amber-500/10'
                    : 'text-slate-300 hover:bg-blue-900/40 hover:text-white'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={`${!sidebarOpen && 'md:hidden'} truncate`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logged-in profile */}
        <div className="p-4 border-t border-blue-900 space-y-3">
          <div className="flex items-center space-x-2 bg-blue-900/30 p-2.5 rounded-xl border border-blue-900">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div className={`${!sidebarOpen && 'md:hidden'} min-w-0`}>
              <span className="block text-xs font-black truncate text-white uppercase">{user?.name}</span>
              <span className="block text-[10px] text-slate-400 truncate">Administrator</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span className={`${!sidebarOpen && 'md:hidden'}`}>Log Out Console</span>
          </button>
        </div>

      </aside>

      {/* 2. Admin Content Page Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header navbar */}
        <header className="bg-white border-b border-border-brand/40 h-16 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm sm:text-base">
              Admin Console
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-amber-500 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl transition-all"
            >
              <ArrowLeft size={12} />
              <span>Back to Store</span>
            </Link>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
