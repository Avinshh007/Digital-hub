// src/app/admin/products/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, Edit, Trash2, Search, Laptop, Loader2, Save, X, Sparkles 
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Panel Toggle & Edit States
  const [formOpen, setFormOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [imageInput, setImageInput] = useState('/uploads/hero_banner.jpg');
  const [specsRows, setSpecsRows] = useState<{ key: string; value: string }[]>([
    { key: 'Warranty', value: '1 Year Manufacturer Warranty' }
  ]);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setBrands(data.brands || []);

        if (data.categories.length > 0 && !categoryId) setCategoryId(data.categories[0].id);
        if (data.brands.length > 0 && !brandId) setBrandId(data.brands[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdd = () => {
    setEditProductId(null);
    setName('');
    setSku('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setStock('');
    if (categories.length > 0) setCategoryId(categories[0].id);
    if (brands.length > 0) setBrandId(brands[0].id);
    setImageInput('/uploads/hero_banner.jpg');
    setSpecsRows([{ key: 'Warranty', value: '1 Year Manufacturer Warranty' }]);
    setFormError('');
    setFormSuccess('');
    setFormOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditProductId(prod.id);
    setName(prod.name);
    setSku(prod.sku);
    setDescription(prod.description);
    setPrice(prod.price.toString());
    setOriginalPrice(prod.originalPrice.toString());
    setStock(prod.stock.toString());
    setCategoryId(prod.categoryId);
    setBrandId(prod.brandId);
    
    // Parse images
    let activeImg = '/uploads/hero_banner.jpg';
    try {
      const parsed = JSON.parse(prod.images);
      if (parsed.length > 0) activeImg = parsed[0];
    } catch(e) {}
    setImageInput(activeImg);

    // Parse specs
    let parsedSpecs: { key: string; value: string }[] = [];
    try {
      const obj = JSON.parse(prod.specs);
      parsedSpecs = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
    } catch(e) {}
    setSpecsRows(parsedSpecs.length > 0 ? parsedSpecs : [{ key: 'Warranty', value: '1 Year Manufacturer Warranty' }]);

    setFormError('');
    setFormSuccess('');
    setFormOpen(true);
  };

  const handleAddSpecRow = () => {
    setSpecsRows([...specsRows, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecsRows(specsRows.filter((_, idx) => idx !== index));
  };

  const handleSpecRowChange = (index: number, field: 'key' | 'value', text: string) => {
    setSpecsRows(
      specsRows.map((row, idx) => (idx === index ? { ...row, [field]: text } : row))
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validations
    if (!name.trim() || !sku.trim() || !price || !stock) {
      setFormError('Please fill in Name, SKU, Price and Stock level.');
      return;
    }

    // Convert specs row array to JSON object
    const specsObj: { [key: string]: string } = {};
    for (const row of specsRows) {
      if (row.key.trim()) {
        specsObj[row.key.trim()] = row.value.trim();
      }
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      description: description.trim(),
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
      stock: parseInt(stock),
      categoryId,
      brandId,
      images: [imageInput.trim()],
      specs: specsObj,
    };

    try {
      let res;
      if (editProductId) {
        // Edit update
        res = await fetch(`/api/products/${editProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Add create
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        setFormSuccess(editProductId ? 'Product updated successfully!' : 'Product added successfully!');
        fetchInventory();
        setTimeout(() => setFormOpen(false), 1500);
      } else {
        setFormError(data.error || 'Failed to save product configurations.');
      }
    } catch (err) {
      console.error(err);
      setFormError('An error occurred. Please try again.');
    }
  };

  // Filter products by query
  const filteredProducts = products.filter((prod) =>
    prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
        <span className="text-slate-500 font-bold">Loading Inventory Lists...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-brand/40 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total of {products.length} products listed in database
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 bg-primary-brand hover:bg-primary-brand-hover text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search Filter & Table */}
      <div className="space-y-4">
        
        {/* Search input */}
        <div className="relative max-w-md bg-card text-card-foreground">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Name or SKU..."
            className="w-full bg-slate-50 border border-border-brand rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-900 text-xs sm:text-sm font-semibold"
          />
          <Search size={16} className="absolute right-3.5 top-3 text-slate-400" />
        </div>

        {/* Inventory List table */}
        <div className="bg-card text-card-foreground border border-border-brand rounded-3xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border-brand text-slate-500 font-bold uppercase">
                <th className="p-3">Product details</th>
                <th className="p-3">SKU</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40 text-slate-700 dark:text-slate-200">
              {filteredProducts.map((prod) => {
                let img = '/uploads/hero_banner.jpg';
                try {
                  const parsed = JSON.parse(prod.images);
                  if (parsed.length > 0) img = parsed[0];
                } catch(e) {}

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    
                    {/* Image & Title */}
                    <td className="p-3 flex items-center space-x-3 min-w-[200px]">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-950 border rounded-lg overflow-hidden shrink-0">
                        <img src={img} alt="" className="w-full h-full object-contain" />
                      </div>
                      <span className="font-bold truncate max-w-[180px]" title={prod.name}>
                        {prod.name}
                      </span>
                    </td>

                    {/* SKU */}
                    <td className="p-3 font-mono font-bold text-slate-500">{prod.sku}</td>

                    {/* Price */}
                    <td className="p-3 text-right font-black">₹{prod.price.toLocaleString('en-IN')}</td>

                    {/* Stock */}
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        prod.stock <= 5 
                          ? 'bg-rose-500/10 text-rose-500 font-black' 
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {prod.stock}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="p-3 font-semibold text-slate-400">{prod.category?.name}</td>

                    {/* Action buttons */}
                    <td className="p-3 text-right space-x-2.5 min-w-[110px]">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1 text-blue-500 hover:text-blue-600 transition-colors cursor-pointer inline-block"
                        title="Edit Details"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer inline-block"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* sliding modal drawer dialog (Add / Edit Form) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-background text-foreground h-full p-6 sm:p-8 overflow-y-auto flex flex-col space-y-6 shadow-2xl animate-fade-in">
            
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-border-brand/40 pb-3">
              <h3 className="font-extrabold text-base sm:text-lg uppercase tracking-wider flex items-center space-x-1.5">
                <Laptop size={20} className="text-amber-500" />
                <span>{editProductId ? 'Edit Product' : 'Add New Product'}</span>
              </h3>
              <button 
                onClick={() => setFormOpen(false)} 
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Inputs Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Product Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HP LaserJet Printer Model"
                  className="w-full bg-slate-50 border border-border-brand rounded-xl px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* SKU */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">SKU Code (Unique)</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. HP-M1005-LASER"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                {/* Stock levels */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Stock Count Qty</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Sale Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1299"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                {/* Original Price */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Original Price (₹)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="2200"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Brand Selection */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Brand</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {brands.map((br) => (
                      <option key={br.id} value={br.id}>{br.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Enter main product specifications and key details..."
                  className="w-full bg-slate-50 border border-border-brand rounded-xl p-3 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              {/* Image url */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Product Image Path</label>
                <input
                  type="text"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="/uploads/hero_banner.jpg"
                  className="w-full bg-slate-50 border border-border-brand rounded-xl px-3 py-2 text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              {/* Specs JSON Row Builder */}
              <div className="space-y-2 border-t border-border-brand/40 pt-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-500 font-bold flex items-center space-x-1">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Technical Specifications</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2 py-1 rounded-md cursor-pointer"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {specsRows.map((row, index) => (
                    <div key={index} className="flex space-x-2 items-center">
                      <input
                        type="text"
                        placeholder="Key (e.g. RAM)"
                        value={row.key}
                        onChange={(e) => handleSpecRowChange(index, 'key', e.target.value)}
                        className="w-1/3 bg-slate-50 border border-border-brand rounded-lg px-2 py-1 text-slate-950 font-semibold dark:bg-slate-900 dark:text-slate-100 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 16GB)"
                        value={row.value}
                        onChange={(e) => handleSpecRowChange(index, 'value', e.target.value)}
                        className="flex-grow bg-slate-50 border border-border-brand rounded-lg px-2 py-1 text-slate-950 font-semibold dark:bg-slate-900 dark:text-slate-100 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(index)}
                        className="text-rose-500 hover:text-rose-600 font-bold px-1.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              {formError && <p className="text-rose-500 font-bold text-xs bg-rose-500/5 p-2.5 border border-rose-500/20 rounded-xl">{formError}</p>}
              {formSuccess && <p className="text-emerald-500 font-bold text-xs bg-emerald-500/5 p-2.5 border border-emerald-500/20 rounded-xl">{formSuccess}</p>}

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full bg-primary-brand hover:bg-primary-brand-hover text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-xs uppercase"
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
