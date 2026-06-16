// src/components/customer/ShopClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, RotateCcw, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ProductCard from '@/components/customer/ProductCard';

export default function ShopClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [priceRange, setPriceRange] = useState<number>(150000); // Max range limit
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedBrand(searchParams.get('brand') || '');
  }, [searchParams]);

  // Fetch products based on filters
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true);
      try {
        const query = searchParams.get('q') || '';
        const params = new URLSearchParams({
          q: query,
          category: selectedCategory,
          brand: selectedBrand,
          maxPrice: priceRange.toString(),
          inStock: inStockOnly.toString(),
          sortBy: sortBy,
        });

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setCategories(data.categories || []);
          setBrands(data.brands || []);
        }
      } catch (e) {
        console.error('Failed fetching filtered products', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [searchParams, selectedCategory, selectedBrand, priceRange, inStockOnly, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange(150000);
    setInStockOnly(false);
    setSortBy('createdAt');
    router.push('/products');
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug === selectedCategory ? '' : slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug && slug !== selectedCategory) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex-grow">
      
      {/* Search Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-brand/40 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            {searchParams.get('q') ? `Search Results for "${searchParams.get('q')}"` : t.shop}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Found {products.length} matching electronic products
          </p>
        </div>

        {/* Sorting options */}
        <div className="flex items-center space-x-3 self-end md:self-center">
          <span className="text-xs text-muted-brand font-bold uppercase">{t.sortBy}:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs sm:text-sm bg-card text-card-foreground border border-border-brand rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="createdAt">Newest Products</option>
            <option value="price_asc">{t.priceLowHigh}</option>
            <option value="price_desc">{t.priceHighLow}</option>
            <option value="rating">{t.ratingHighLow}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-card text-card-foreground border border-border-brand p-6 rounded-2xl h-fit">
          <div className="flex items-center justify-between border-b border-border-brand/40 pb-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wide flex items-center space-x-2">
              <SlidersHorizontal size={16} className="text-amber-500" />
              <span>{t.filters}</span>
            </h3>
            <button onClick={resetFilters} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center space-x-1 cursor-pointer">
              <RotateCcw size={12} />
              <span>Clear</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-brand">{t.category}</h4>
            <div className="space-y-1.5 text-sm">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`w-full flex items-center justify-between text-left py-1 px-2 rounded-lg cursor-pointer ${
                    selectedCategory === cat.slug 
                      ? 'bg-primary-brand/10 text-primary-brand font-bold' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  {selectedCategory === cat.slug && <Check size={14} className="text-primary-brand" />}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-brand">{t.brand}</h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {brands.map((br) => (
                <button
                  key={br.id}
                  onClick={() => setSelectedBrand(br.slug === selectedBrand ? '' : br.slug)}
                  className={`border py-1.5 px-2 rounded-lg text-center cursor-pointer ${
                    selectedBrand === br.slug
                      ? 'border-primary-brand bg-primary-brand/5 text-primary-brand font-bold'
                      : 'border-border-brand hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  {br.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs uppercase tracking-wider text-muted-brand font-bold">
              <span>{t.priceRange}</span>
              <span className="text-slate-800 dark:text-slate-100 font-extrabold text-sm">₹{priceRange.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="500"
              max="150000"
              step="1000"
              value={priceRange}
              onChange={(e) => setPriceRange(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>₹500</span>
              <span>₹1,50,000</span>
            </div>
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center space-x-2 pt-2 border-t border-border-brand/40">
            <input
              type="checkbox"
              id="stockStatus"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="stockStatus" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t.inStock}
            </label>
          </div>

        </aside>

        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between bg-card text-card-foreground border border-border-brand p-4 rounded-xl">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center space-x-2 text-sm font-bold bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-lg cursor-pointer"
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
          <button onClick={resetFilters} className="text-xs font-bold text-rose-500 hover:text-rose-600">
            Reset Filters
          </button>
        </div>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
            <div className="w-80 bg-background text-foreground h-full p-6 overflow-y-auto flex flex-col space-y-6 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between border-b border-border-brand pb-3">
                <h3 className="font-extrabold text-base">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="text-slate-500 font-bold text-lg">✕</button>
              </div>

              {/* Mobile Category */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-brand">Category</h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { handleCategorySelect(cat.slug); setMobileFiltersOpen(false); }}
                      className={`w-full flex items-center justify-between text-left py-1.5 px-2 rounded-lg ${
                        selectedCategory === cat.slug ? 'bg-primary-brand/10 text-primary-brand font-bold' : ''
                      }`}
                    >
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Brand */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-brand">Brand</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {brands.map((br) => (
                    <button
                      key={br.id}
                      onClick={() => setSelectedBrand(br.slug === selectedBrand ? '' : br.slug)}
                      className={`border py-1.5 rounded-lg text-center ${
                        selectedBrand === br.slug ? 'border-primary-brand bg-primary-brand/5 text-primary-brand font-bold' : 'border-border-brand'
                      }`}
                    >
                      {br.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-brand">
                  <span>Price Limit</span>
                  <span className="font-bold">₹{priceRange.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="150000"
                  step="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Mobile Stock */}
              <div className="flex items-center space-x-2 pt-2 border-t border-border-brand">
                <input
                  type="checkbox"
                  id="mobStock"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-amber-500 w-4 h-4"
                />
                <label htmlFor="mobStock" className="text-sm font-bold">{t.inStock}</label>
              </div>

              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-primary-brand text-white font-bold py-3 rounded-xl shadow-md text-center mt-auto"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Product Cards Grid */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-3">
              <Loader2 size={36} className="text-amber-500 animate-spin" />
              <span className="text-slate-500 font-medium">{t.loading}</span>
            </div>
          ) : products.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-card text-card-foreground border border-border-brand rounded-2xl p-10 text-center">
              <span className="text-slate-400 text-5xl">📦</span>
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-700 dark:text-slate-300">No Products Found</h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">Try resetting filters or checking your search query.</p>
              </div>
              <button 
                onClick={resetFilters}
                className="bg-primary-brand hover:bg-primary-brand-hover text-white font-bold px-6 py-2.5 rounded-full transition-all shadow-md"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
