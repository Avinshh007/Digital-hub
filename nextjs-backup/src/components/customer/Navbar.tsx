// src/components/customer/Navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShoppingCart, Heart, User, Search, Menu, X, LogOut, LayoutDashboard 
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, wishlist } = useCart();
  const { language, setLanguage, t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // User Session State
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  // Check Session & Enforce Light Theme
  useEffect(() => {
    // Force Light theme
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');

    // Scroll listener
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Auth check
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (e) {
        console.error('Check auth failed', e);
      }
    };
    checkAuth();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync Search Input with Query Params
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/');
        router.refresh();
      }
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 text-slate-800 shadow-md backdrop-blur-md border-b border-slate-200/80' 
        : 'bg-blue-950 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Business Logo / Name */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex flex-col">
              <span className={`font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent uppercase bg-gradient-to-r transition-all ${
                scrolled ? 'from-blue-900 to-indigo-700' : 'from-amber-400 to-amber-300'
              }`}>
                   DIGITAL HUB
              </span>
              <span className={`text-[10px] sm:text-xs tracking-widest font-semibold uppercase -mt-1 transition-all ${
                scrolled ? 'text-slate-500' : 'text-slate-300'
              }`}>
                Computers
              </span>
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  scrolled 
                    ? 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200' 
                    : 'bg-blue-900/40 text-slate-100 placeholder-slate-400 border border-blue-800'
                }`}
              />
              <button type="submit" className={`absolute right-3 top-2.5 transition-colors ${
                scrolled ? 'text-slate-400 hover:text-blue-600' : 'text-slate-400 hover:text-amber-400'
              }`}>
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Controls & Badges (Desktop) */}
          <div className="hidden lg:flex items-center space-x-6">
            
            {/* Nav Links */}
            <div className="flex space-x-4 text-sm font-semibold tracking-wide">
              <Link href="/products" className={`transition-colors ${scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'}`}>{t.shop}</Link>
              <Link href="/about" className={`transition-colors ${scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'}`}>{t.aboutUs}</Link>
              <Link href="/contact" className={`transition-colors ${scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'}`}>{t.contactUs}</Link>
              <Link href="/faq" className={`transition-colors ${scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'}`}>{t.faq}</Link>
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
              className={`text-xs font-bold border px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                scrolled 
                  ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600' 
                  : 'border-slate-700 bg-blue-900/30 text-white hover:bg-amber-500 hover:text-blue-950'
              }`}
            >
              {language === 'en' ? 'TE' : 'EN'}
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className={`relative p-1.5 rounded-full transition-all ${
              scrolled ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-300 hover:text-amber-400 hover:bg-blue-900/40'
            }`}>
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className={`relative p-1.5 rounded-full transition-all ${
              scrolled ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-300 hover:text-amber-400 hover:bg-blue-900/40'
            }`}>
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 font-extrabold text-[10px] w-5 h-5 flex items-center justify-center rounded-full ${
                  scrolled ? 'bg-blue-600 text-white' : 'bg-amber-50 text-blue-950'
                }`}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth/Profile */}
            {user ? (
              <div className={`flex items-center space-x-3 pl-4 border-l ${
                scrolled ? 'border-slate-200' : 'border-blue-800'
              }`}>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className={`flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1.5 rounded-md transition-all ${
                    scrolled 
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                      : 'bg-amber-400/10 text-amber-400 hover:text-amber-300'
                  }`}>
                    <LayoutDashboard size={14} />
                    <span>{t.adminDashboard}</span>
                  </Link>
                )}
                <Link href="/profile" className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors ${
                  scrolled ? 'text-slate-700 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'
                }`}>
                  <User size={16} />
                  <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className={`transition-colors p-1 ${
                  scrolled ? 'text-slate-400 hover:text-rose-600' : 'text-slate-400 hover:text-rose-400'
                }`} title={t.logout}>
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link href="/login" className={`flex items-center space-x-1.5 font-bold text-sm px-4 py-2 rounded-full transition-all shadow-md ${
                scrolled 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10' 
                  : 'bg-amber-50 hover:bg-amber-400 text-blue-950 shadow-amber-500/10'
              }`}>
                <User size={16} />
                <span>{t.login}</span>
              </Link>
            )}

          </div>

          {/* Controls (Mobile view header) */}
          <div className="flex lg:hidden items-center space-x-3">
            
            {/* Mobile Lang switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
              className={`text-[10px] font-bold border px-1.5 py-0.5 rounded transition-all ${
                scrolled 
                  ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white' 
                  : 'border-slate-700 bg-blue-900/30 text-white hover:bg-amber-500 hover:text-blue-950'
              }`}
            >
              {language === 'en' ? 'TE' : 'EN'}
            </button>

            {/* Mobile Cart */}
            <Link href="/cart" className={`relative p-1 transition-colors ${scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-slate-300 hover:text-amber-400'}`}>
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 font-extrabold text-[8px] w-4.5 h-4.5 flex items-center justify-center rounded-full ${
                  scrolled ? 'bg-blue-600 text-white' : 'bg-amber-50 text-blue-950'
                }`}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`focus:outline-none p-1 cursor-pointer transition-colors ${
                scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isMobileMenuOpen && (
        <div className={`lg:hidden border-t py-4 px-4 space-y-4 shadow-inner animate-fade-in ${
          scrolled 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-blue-950 border-blue-900 text-white'
        }`}>
          
          {/* Mobile Search input */}
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                scrolled 
                  ? 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200' 
                  : 'bg-blue-900/30 text-slate-100 placeholder-slate-400 border border-blue-800'
              }`}
            />
            <button type="submit" className={`absolute right-3 top-2.5 transition-colors ${
              scrolled ? 'text-slate-400 hover:text-blue-600' : 'text-slate-400 hover:text-amber-400'
            }`}>
              <Search size={16} />
            </button>
          </form>

          {/* Links list */}
          <div className="flex flex-col space-y-3 font-semibold text-sm">
            <Link 
              href="/products" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`py-1 border-b transition-colors ${
                scrolled 
                  ? 'text-slate-700 hover:text-blue-600 border-slate-100' 
                  : 'text-slate-200 hover:text-amber-400 border-blue-900/50'
              }`}
            >
              {t.shop}
            </Link>
            <Link 
              href="/wishlist" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`py-1 border-b transition-colors flex items-center justify-between ${
                scrolled 
                  ? 'text-slate-700 hover:text-blue-600 border-slate-100' 
                  : 'text-slate-200 hover:text-amber-400 border-blue-900/50'
              }`}
            >
              <span>{t.wishlist}</span>
              {wishlist.length > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{wishlist.length}</span>}
            </Link>
            <Link 
              href="/about" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`py-1 border-b transition-colors ${
                scrolled 
                  ? 'text-slate-700 hover:text-blue-600 border-slate-100' 
                  : 'text-slate-200 hover:text-amber-400 border-blue-900/50'
              }`}
            >
              {t.aboutUs}
            </Link>
            <Link 
              href="/contact" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`py-1 border-b transition-colors ${
                scrolled 
                  ? 'text-slate-700 hover:text-blue-600 border-slate-100' 
                  : 'text-slate-200 hover:text-amber-400 border-blue-900/50'
              }`}
            >
              {t.contactUs}
            </Link>
            <Link 
              href="/faq" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`py-1 border-b transition-colors ${
                scrolled 
                  ? 'text-slate-700 hover:text-blue-600 border-slate-100' 
                  : 'text-slate-200 hover:text-amber-400 border-blue-900/50'
              }`}
            >
              {t.faq}
            </Link>
            
            {user && user.role === 'ADMIN' && (
              <Link 
                href="/admin" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`py-1 border-b transition-colors flex items-center space-x-2 ${
                  scrolled 
                    ? 'text-blue-600 hover:text-blue-700 border-slate-100 font-bold' 
                    : 'text-amber-400 hover:text-amber-300 border-blue-900/50 font-bold'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>{t.adminDashboard}</span>
              </Link>
            )}
          </div>

          {/* Mobile Profile & Logout */}
          <div className="pt-2">
            {user ? (
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                scrolled 
                  ? 'bg-slate-50 border-slate-200 text-slate-800' 
                  : 'bg-blue-900/20 border-blue-900 text-white'
              }`}>
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 font-bold">
                  <User size={18} />
                  <span className="truncate max-w-[150px]">{user.name}</span>
                </Link>
                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                  className="text-rose-500 hover:text-rose-600 flex items-center space-x-1 font-bold text-xs bg-rose-500/10 px-2.5 py-1 rounded"
                >
                  <LogOut size={14} />
                  <span>{t.logout}</span>
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`block text-center font-bold py-2.5 rounded-lg transition-all shadow-md ${
                  scrolled 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10' 
                    : 'bg-amber-50 hover:bg-amber-400 text-blue-950 shadow-amber-500/10'
                }`}
              >
                {t.login}
              </Link>
            )}
          </div>

        </div>
      )}
    </nav>
  );
}
