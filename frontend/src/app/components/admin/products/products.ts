// src/app/components/admin/products/products.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, Category, Brand } from '../../../services/product.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  loading = signal(true);

  // Filter & Search Signals
  adminSearchQuery = signal<string>('');
  adminCategory = signal<string>('');
  adminBrand = signal<string>('');
  adminSource = signal<string>('');
  adminStockStatus = signal<string>('');
  adminSortBy = signal<string>('createdAt');
  adminPage = signal<number>(1);
  adminPageSize = signal<number>(15);
  lowStockThreshold = signal<number>(5);
  totalProductsCount = signal<number>(0);
  showMobileFilters = signal<boolean>(false);
  adminView = signal<'grid' | 'table'>('grid');

  // Summary Dashboard Stats
  stats = signal<{
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalQty: number;
    totalValue: number;
  } | null>(null);

  // Inventory Health Status Indicator
  inventoryHealth = computed(() => {
    const s = this.stats();
    if (!s || s.totalProducts === 0) {
      return {
        label: 'Excellent',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400',
        circleColor: 'bg-emerald-500',
        desc: 'All catalog items are fully stocked.'
      };
    }
    if (s.outOfStockProducts > 0) {
      return {
        label: 'Critical',
        color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400',
        circleColor: 'bg-rose-500',
        desc: 'Some catalog items are out of stock.'
      };
    }
    const lowRatio = s.lowStockProducts / s.totalProducts;
    if (lowRatio < 0.05) {
      return {
        label: 'Excellent',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400',
        circleColor: 'bg-emerald-500',
        desc: 'No out-of-stock and < 5% low stock.'
      };
    }
    if (lowRatio < 0.10) {
      return {
        label: 'Good',
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400',
        circleColor: 'bg-indigo-500',
        desc: 'Low stock items represent < 10%.'
      };
    }
    return {
      label: 'Needs Attention',
      color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400',
      circleColor: 'bg-amber-500',
      desc: 'More than 10% of items are low in stock.'
    };
  });

  // Modal View States
  showLowStockModal = signal(false);
  showOutOfStockModal = signal(false);
  showDetailModal = signal(false);
  quickViewProducts = signal<Product[]>([]);
  selectedProductDetails = signal<Product | null>(null);

  // Inline Stock Edit State
  editingStockProductId = signal<string | null>(null);
  inlineStockValue = signal<number>(0);

  // View States
  activeTab = signal<'inventory' | 'import'>('inventory');
  showForm = signal(false);
  isEditing = signal(false);
  editingProductId = signal<string | null>(null);

  // Manual Form Fields
  name = '';
  description = '';
  price = 0;
  originalPrice = 0;
  stock = 0;
  sku = '';
  categoryId = '';
  brandId = '';
  gstRate = 18;
  subcategory = '';
  warranty = '';
  modelNumber = '';
  seoTitle = '';
  seoDescription = '';
  source = 'MANUAL';

  // Lock Controls
  lockDescription = false;
  lockImages = false;
  lockSpecs = false;
  lockPrice = false;
  lockStock = false;
  lockSeo = false;

  // Custom spec key-value list (Dynamic builder)
  specsList: { key: string; value: string }[] = [];

  // Manual Image Management
  uploadedImages = signal<string[]>([]);
  isDragging = signal(false);
  uploadingImages = signal(false);
  Math = Math;

  // Bulk Import Fields
  importMode = 'CREATE_AND_UPDATE';
  importSource = 'EXCEL_IMPORT';
  importDataFile: File | null = null;
  importZipFile: File | null = null;
  importing = signal(false);
  importResult = signal<{
    message: string;
    summary: { created: number; updated: number; skipped: number; errors: string[] };
  } | null>(null);

  autoAssigning = signal(false);
  autoAssignResult = signal<{
    scanned: number;
    assigned: number;
    skipped: number;
    manualReview: number;
    defaultStoreImageCount: number;
    updatedCount: number;
    executionTime: string;
  } | null>(null);

  ngOnInit() {
    this.loadAdminInventory();
  }

  async loadAdminInventory() {
    this.loading.set(true);
    try {
      const data = await this.productService.getProducts({
        q: this.adminSearchQuery(),
        category: this.adminCategory(),
        brand: this.adminBrand(),
        source: this.adminSource(),
        stockStatus: this.adminStockStatus(),
        sortBy: this.adminSortBy(),
        page: this.adminPage(),
        limit: this.adminPageSize(),
        threshold: this.lowStockThreshold()
      });

      this.products.set(data.products || []);
      this.categories.set(data.categories || []);
      this.brands.set(data.brands || []);
      this.totalProductsCount.set(data.total || 0);

      // Fetch summary stats
      const statsData = await this.productService.getInventoryStats(this.lowStockThreshold());
      this.stats.set(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    this.adminPage.set(1);
    this.loadAdminInventory();
  }

  resetAdminFilters() {
    this.adminSearchQuery.set('');
    this.adminCategory.set('');
    this.adminBrand.set('');
    this.adminSource.set('');
    this.adminStockStatus.set('');
    this.adminSortBy.set('createdAt');
    this.adminPage.set(1);
    this.loadAdminInventory();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.adminPage.set(page);
      this.loadAdminInventory();
    }
  }

  totalPages() {
    return Math.ceil(this.totalProductsCount() / this.adminPageSize());
  }

  // Quick View Dashboard Click Handlers
  async openQuickView(type: 'low' | 'out') {
    try {
      const data = await this.productService.getProducts({
        stockStatus: type === 'low' ? 'lowStock' : 'outOfStock',
        threshold: this.lowStockThreshold(),
        limit: 1000,
        page: 1
      });
      this.quickViewProducts.set(data.products || []);
      if (type === 'low') {
        this.showLowStockModal.set(true);
      } else {
        this.showOutOfStockModal.set(true);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to load quick view data.');
    }
  }

  // Inline Stock Edit Handlers
  startInlineStockEdit(prod: Product) {
    this.editingStockProductId.set(prod.id);
    this.inlineStockValue.set(prod.stock);
  }

  cancelInlineStockEdit() {
    this.editingStockProductId.set(null);
  }

  async saveInlineStock(prod: Product) {
    const val = this.inlineStockValue();
    if (val < 0) {
      alert('Stock quantity cannot be negative.');
      return;
    }
    try {
      await this.productService.updateProduct(prod.id, { stock: val });
      this.editingStockProductId.set(null);
      this.loadAdminInventory();
    } catch (e: any) {
      alert(e.error || 'Failed to update stock quantity.');
    }
  }

  // Product Duplication
  duplicateProduct(prod: Product) {
    this.isEditing.set(false);
    this.editingProductId.set(null);

    this.name = `${prod.name} (Copy)`;
    this.description = prod.description;
    this.price = prod.price;
    this.originalPrice = prod.originalPrice;
    this.stock = prod.stock;
    this.sku = `${prod.sku}-COPY`;
    this.categoryId = prod.categoryId;
    this.brandId = prod.brandId;
    this.gstRate = prod.gstRate;
    this.subcategory = prod.subcategory || '';
    this.warranty = prod.warranty || '';
    this.modelNumber = prod.modelNumber || '';
    this.seoTitle = prod.seoTitle || '';
    this.seoDescription = prod.seoDescription || '';
    this.source = 'MANUAL';

    this.lockDescription = prod.lockDescription;
    this.lockImages = prod.lockImages;
    this.lockSpecs = prod.lockSpecs;
    this.lockPrice = prod.lockPrice;
    this.lockStock = prod.lockStock;
    this.lockSeo = prod.lockSeo;

    try {
      const parsedSpecs = JSON.parse(prod.specs);
      this.specsList = Object.keys(parsedSpecs).map(k => ({
        key: k,
        value: parsedSpecs[k]
      }));
    } catch (e) {
      this.specsList = [];
    }

    try {
      const parsedImages = JSON.parse(prod.images);
      this.uploadedImages.set(Array.isArray(parsedImages) ? parsedImages : []);
    } catch (e) {
      this.uploadedImages.set([]);
    }

    this.showForm.set(true);
  }

  // Detail Modal Handlers
  openDetailModal(prod: Product) {
    this.selectedProductDetails.set(prod);
    this.showDetailModal.set(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedProductDetails.set(null);
  }

  // CSV/Excel Exporter
  async exportFilteredData(format: 'csv' | 'xlsx') {
    try {
      const data = await this.productService.getProducts({
        q: this.adminSearchQuery(),
        category: this.adminCategory(),
        brand: this.adminBrand(),
        source: this.adminSource(),
        stockStatus: this.adminStockStatus(),
        sortBy: this.adminSortBy(),
        page: 1,
        limit: 100000,
        threshold: this.lowStockThreshold()
      });

      const exportProducts = data.products || [];
      if (exportProducts.length === 0) {
        alert('No filtered records available to export.');
        return;
      }

      const headers = ['SKU', 'Product Name', 'Category', 'Brand', 'Stock', 'Price', 'Source', 'Updated Date', 'Last Sync Timestamp'];
      const rows = exportProducts.map(p => [
        p.sku,
        p.name,
        p.category ? p.category.name : 'N/A',
        p.brand ? p.brand.name : 'N/A',
        p.stock.toString(),
        p.price.toString(),
        p.source,
        (p as any).updatedAt || p.createdAt || 'N/A',
        'N/A' // Last Sync Timestamp (future field placeholder)
      ]);

      const escapeCSVValue = (val: string) => {
        const clean = val.replace(/"/g, '""');
        return `"${clean}"`;
      };

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(escapeCSVValue).join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const ext = format === 'csv' ? 'csv' : 'xls';
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.${ext}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Export failed');
    }
  }

  openCreateForm() {
    this.isEditing.set(false);
    this.editingProductId.set(null);
    this.resetFormFields();
    this.showForm.set(true);
  }

  openEditForm(prod: Product) {
    this.isEditing.set(true);
    this.editingProductId.set(prod.id);
    
    this.name = prod.name;
    this.description = prod.description;
    this.price = prod.price;
    this.originalPrice = prod.originalPrice;
    this.stock = prod.stock;
    this.sku = prod.sku;
    this.categoryId = prod.categoryId;
    this.brandId = prod.brandId;
    this.gstRate = prod.gstRate;
    this.subcategory = prod.subcategory || '';
    this.warranty = prod.warranty || '';
    this.modelNumber = prod.modelNumber || '';
    this.seoTitle = prod.seoTitle || '';
    this.seoDescription = prod.seoDescription || '';
    this.source = prod.source || 'MANUAL';

    // Locks
    this.lockDescription = prod.lockDescription;
    this.lockImages = prod.lockImages;
    this.lockSpecs = prod.lockSpecs;
    this.lockPrice = prod.lockPrice;
    this.lockStock = prod.lockStock;
    this.lockSeo = prod.lockSeo;

    // Parse specs JSON to list
    try {
      const parsedSpecs = JSON.parse(prod.specs);
      this.specsList = Object.keys(parsedSpecs).map(k => ({
        key: k,
        value: parsedSpecs[k]
      }));
    } catch (e) {
      this.specsList = [];
    }

    // Parse images JSON list
    try {
      const parsedImages = JSON.parse(prod.images);
      this.uploadedImages.set(Array.isArray(parsedImages) ? parsedImages : []);
    } catch (e) {
      this.uploadedImages.set([]);
    }

    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.resetFormFields();
  }

  resetFormFields() {
    this.name = '';
    this.description = '';
    this.price = 0;
    this.originalPrice = 0;
    this.stock = 0;
    this.sku = '';
    this.categoryId = '';
    this.brandId = '';
    this.gstRate = 18;
    this.subcategory = '';
    this.warranty = '';
    this.modelNumber = '';
    this.seoTitle = '';
    this.seoDescription = '';
    this.source = 'MANUAL';

    this.lockDescription = false;
    this.lockImages = false;
    this.lockSpecs = false;
    this.lockPrice = false;
    this.lockStock = false;
    this.lockSeo = false;

    this.specsList = [];
    this.uploadedImages.set([]);
  }

  // Specifications builder
  addSpec() {
    this.specsList.push({ key: '', value: '' });
  }

  removeSpec(index: number) {
    this.specsList.splice(index, 1);
  }

  // Image Drag & Drop handlers
  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  async onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    if (e.dataTransfer?.files) {
      await this.handleImageFiles(e.dataTransfer.files);
    }
  }

  async onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      await this.handleImageFiles(input.files);
    }
  }

  async handleImageFiles(files: FileList) {
    this.uploadingImages.set(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      try {
        const url = await this.compressAndUploadFile(file);
        this.uploadedImages.update(imgs => [...imgs, url]);
      } catch (err) {
        console.error('Image upload failed:', err);
        alert(`Failed to upload image: ${file.name}`);
      }
    }
    this.uploadingImages.set(false);
  }

  // Client-side canvas compression (1000px max bounds, JPEG 80% quality)
  async compressAndUploadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const max_size = 1000;
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              this.productService.uploadProductImage(compressedFile)
                .then(res => resolve(res.url))
                .catch(err => reject(err));
            } else {
              reject('Compression failed');
            }
          }, 'image/jpeg', 0.8);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Image Reordering & Primary Settings
  setPrimaryImage(index: number) {
    const imgs = [...this.uploadedImages()];
    if (index > 0 && index < imgs.length) {
      const item = imgs.splice(index, 1)[0];
      imgs.unshift(item);
      this.uploadedImages.set(imgs);
    }
  }

  moveImageLeft(index: number) {
    const imgs = [...this.uploadedImages()];
    if (index > 0) {
      const temp = imgs[index];
      imgs[index] = imgs[index - 1];
      imgs[index - 1] = temp;
      this.uploadedImages.set(imgs);
    }
  }

  moveImageRight(index: number) {
    const imgs = [...this.uploadedImages()];
    if (index < imgs.length - 1) {
      const temp = imgs[index];
      imgs[index] = imgs[index + 1];
      imgs[index + 1] = temp;
      this.uploadedImages.set(imgs);
    }
  }

  removeImage(index: number) {
    this.uploadedImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  // Toggle field locks directly
  async toggleFieldLock(prod: Product, field: string) {
    const patch: any = {};
    if (field === 'description') patch.lockDescription = !prod.lockDescription;
    if (field === 'images') patch.lockImages = !prod.lockImages;
    if (field === 'specs') patch.lockSpecs = !prod.lockSpecs;
    if (field === 'price') patch.lockPrice = !prod.lockPrice;
    if (field === 'stock') patch.lockStock = !prod.lockStock;
    if (field === 'seo') patch.lockSeo = !prod.lockSeo;

    try {
      await this.productService.updateProduct(prod.id, patch);
      this.loadAdminInventory();
    } catch (e: any) {
      alert(e.error || 'Failed to toggle field lock.');
    }
  }

  // Form Submission
  async handleSubmit() {
    if (!this.name || !this.price || !this.sku || !this.categoryId || !this.brandId) {
      alert('Please fill out all required fields.');
      return;
    }

    // Format specs list back to json object
    const specsObj: any = {};
    this.specsList.forEach(s => {
      if (s.key.trim()) {
        specsObj[s.key.trim()] = s.value.trim();
      }
    });

    const payload = {
      name: this.name,
      description: this.description,
      price: this.price,
      originalPrice: this.originalPrice || this.price,
      stock: this.stock,
      sku: this.sku,
      categoryId: this.categoryId,
      brandId: this.brandId,
      gstRate: this.gstRate,
      subcategory: this.subcategory,
      warranty: this.warranty,
      modelNumber: this.modelNumber,
      seoTitle: this.seoTitle,
      seoDescription: this.seoDescription,
      source: this.source,
      lockDescription: this.lockDescription,
      lockImages: this.lockImages,
      lockSpecs: this.lockSpecs,
      lockPrice: this.lockPrice,
      lockStock: this.lockStock,
      lockSeo: this.lockSeo,
      images: this.uploadedImages().length > 0 ? this.uploadedImages() : ['/uploads/hero_banner.jpg'],
      specs: specsObj,
    };

    try {
      if (this.isEditing()) {
        await this.productService.updateProduct(this.editingProductId()!, payload);
        alert('Product details updated successfully!');
      } else {
        await this.productService.createProduct(payload);
        alert('New product logged successfully!');
      }
      this.closeForm();
      this.loadAdminInventory();
    } catch (e: any) {
      console.error(e);
      alert(e.error || 'Failed to submit product details.');
    }
  }

  async handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this product catalog item?')) {
      try {
        await this.productService.deleteProduct(id);
        alert('Product deleted successfully!');
        this.loadAdminInventory();
      } catch (e) {
        console.error(e);
        alert('Failed to delete product.');
      }
    }
  }

  // CSV Client-side parsing (handles comma separation and double quotes)
  parseCSV(text: string): any[] {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    const headers = this.parseCSVLine(lines[0]);
    const results: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      const obj: any = {};
      
      headers.forEach((header, index) => {
        let val = values[index] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        obj[header.trim()] = val.trim();
      });
      
      results.push(obj);
    }
    return results;
  }

  parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  // Bulk data handlers
  onImportDataFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importDataFile = input.files[0];
    }
  }

  onImportZipFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importZipFile = input.files[0];
    }
  }

  async handleDataImport() {
    if (!this.importDataFile) {
      alert('Please select a CSV file first.');
      return;
    }
    
    this.importing.set(true);
    this.importResult.set(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const text = e.target.result;
        const parsedProducts = this.parseCSV(text);
        if (parsedProducts.length === 0) {
          alert('No products found or failed to parse CSV.');
          this.importing.set(false);
          return;
        }
        
        try {
          const res = await this.productService.bulkImportProducts(parsedProducts, this.importMode, this.importSource);
          this.importResult.set(res);
          this.loadAdminInventory();
        } catch (err: any) {
          console.error(err);
          alert(err.error || 'Failed to import product records.');
        } finally {
          this.importing.set(false);
        }
      };
      reader.readAsText(this.importDataFile);
    } catch (err) {
      console.error(err);
      alert('Failed to read CSV file');
      this.importing.set(false);
    }
  }

  async handleZipImport() {
    if (!this.importZipFile) {
      alert('Please select a ZIP file first.');
      return;
    }
    
    this.importing.set(true);
    this.importResult.set(null);
    
    try {
      const res = await this.productService.importProductImages(this.importZipFile);
      this.importResult.set({
        message: res.message,
        summary: {
          created: 0,
          updated: res.summary.matchedCount,
          skipped: res.summary.totalImages - res.summary.matchedCount,
          errors: res.summary.errors
        }
      });
      this.loadAdminInventory();
    } catch (err: any) {
      console.error(err);
      alert(err.error || 'Failed to upload ZIP images.');
    } finally {
      this.importing.set(false);
    }
  }

  clearImportResults() {
    this.importResult.set(null);
    this.importDataFile = null;
    this.importZipFile = null;
    this.autoAssignResult.set(null);
  }

  async handleAutoAssignImages() {
    this.autoAssigning.set(true);
    this.autoAssignResult.set(null);
    this.importResult.set(null);
    try {
      const res = await this.productService.autoAssignProductImages();
      this.autoAssignResult.set(res.summary);
      alert(`Demo image assignment complete! Assigned: ${res.summary.assigned} images.`);
      this.loadAdminInventory();
    } catch (err: any) {
      console.error(err);
      alert(err.error || 'Failed to auto-assign product images.');
    } finally {
      this.autoAssigning.set(false);
    }
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  getProductImageUrl(imagesJson: string): string {
    try {
      const parsed = JSON.parse(imagesJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (e) {}
    return '/uploads/hero_banner.jpg';
  }
}

