// src/app/services/product.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  stock: number;
  sku: string;
  gstRate: number;
  categoryId: string;
  category?: Category;
  brandId: string;
  brand?: Brand;
  images: string; // JSON string
  specs: string;  // JSON string
  rating: number;
  ratingCount: number;
  reviews?: Review[];
  status: string;
  subcategory?: string;
  warranty?: string;
  modelNumber?: string;
  seoTitle?: string;
  seoDescription?: string;
  source: string;
  lockDescription: boolean;
  lockImages: boolean;
  lockSpecs: boolean;
  lockPrice: boolean;
  lockStock: boolean;
  lockSeo: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // GET /api/products
  async getProducts(filters: {
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    page?: number;
    limit?: number;
    stockStatus?: string;
    source?: string;
    threshold?: number;
  } = {}): Promise<{ products: Product[]; categories: Category[]; brands: Brand[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    if (filters.q) params = params.set('q', filters.q);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.brand) params = params.set('brand', filters.brand);
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.inStock !== undefined) params = params.set('inStock', filters.inStock.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.stockStatus) params = params.set('stockStatus', filters.stockStatus);
    if (filters.source) params = params.set('source', filters.source);
    if (filters.threshold !== undefined) params = params.set('threshold', filters.threshold.toString());

    return firstValueFrom(
      this.http.get<{ products: Product[]; categories: Category[]; brands: Brand[]; total: number; page: number; limit: number }>(`${this.apiUrl}/products`, { params })
    );
  }

  // GET /api/products/inventory/stats (Admin only)
  async getInventoryStats(threshold: number = 5): Promise<{
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalQty: number;
    totalValue: number;
  }> {
    const params = new HttpParams().set('threshold', threshold.toString());
    return firstValueFrom(
      this.http.get<{
        totalProducts: number;
        lowStockProducts: number;
        outOfStockProducts: number;
        totalQty: number;
        totalValue: number;
      }>(`${this.apiUrl}/products/inventory/stats`, { params, withCredentials: true })
    );
  }

  // GET /api/products/:id
  async getProductById(id: string): Promise<Product> {
    const res = await firstValueFrom(
      this.http.get<{ product: Product }>(`${this.apiUrl}/products/${id}`)
    );
    return res.product;
  }

  // POST /api/products/:id/reviews
  async submitReview(productId: string, rating: number, comment: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/products/${productId}/reviews`, { rating, comment }, { withCredentials: true })
    );
  }

  // Admin CRUD: POST /api/products
  async createProduct(productData: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/products`, productData, { withCredentials: true })
    );
  }

  // Admin CRUD: PUT /api/products/:id
  async updateProduct(id: string, productData: any): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/products/${id}`, productData, { withCredentials: true })
    );
  }

  // Admin CRUD: DELETE /api/products/:id
  async deleteProduct(id: string): Promise<any> {
    return firstValueFrom(
      this.http.delete(`${this.apiUrl}/products/${id}`, { withCredentials: true })
    );
  }

  // Upload single product image (for manual form)
  async uploadProductImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return firstValueFrom(
      this.http.post<{ url: string }>(`${this.apiUrl}/products/upload`, formData, { withCredentials: true })
    );
  }

  // Upload ZIP of product images
  async importProductImages(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/products/import-images`, formData, { withCredentials: true })
    );
  }

  // Import products (CSV/Excel data)
  async bulkImportProducts(products: any[], mode: string, source: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/products/import`, { products, mode, source }, { withCredentials: true })
    );
  }

  // GET /api/products/barcode/:barcode – Look up a product by barcode value
  async getProductByBarcode(barcode: string): Promise<Product> {
    const res = await firstValueFrom(
      this.http.get<{ product: Product }>(`${this.apiUrl}/products/barcode/${barcode}`, { withCredentials: true })
    );
    return res.product;
  }

  // POST /api/products/barcode/scan – Increments/decrements stock via scanning
  async scanBarcode(barcode: string, action: 'INCREMENT' | 'DECREMENT'): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/products/barcode/scan`, { barcode, action }, { withCredentials: true })
    );
  }

  // GET /api/products/inventory/history/:id – Retrieve stock logs
  async getInventoryHistory(productId: string): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ logs: any[] }>(`${this.apiUrl}/products/inventory/history/${productId}`, { withCredentials: true })
    );
    return res.logs;
  }

  // POST /api/products/import/preview – dry-run CSV parsing & return compatibility/skips report
  async previewBulkImport(products: any[], mode: string, source: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/products/import/preview`, { products, mode, source }, { withCredentials: true })
    );
  }

  // POST /api/products/import/rollback/:id – revert products to pre-import snapshot values
  async rollbackImport(importId: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/products/import/rollback/${importId}`, {}, { withCredentials: true })
    );
  }

  // GET /api/products/import/history – retrieve table log of imports
  async getImportHistory(): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ history: any[] }>(`${this.apiUrl}/products/import/history`, { withCredentials: true })
    );
    return res.history;
  }

  // GET /api/products/import/missing-images – fetch report of active products holding placeholder images
  async getMissingImagesReport(): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ missingImages: any[] }>(`${this.apiUrl}/products/import/missing-images`, { withCredentials: true })
    );
    return res.missingImages;
  }

  // POST /api/products/import/auto-assign-images – trigger bulk auto assignment of catalog images
  async autoAssignProductImages(): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/products/import/auto-assign-images`, {}, { withCredentials: true })
    );
  }

  // GET /api/products/:id/recommendations – fetch product alternatives and recommendations
  async getProductRecommendations(id: string): Promise<{
    similar: Product[];
    budget: Product[];
    better: Product[];
    performance: Product[];
  }> {
    return firstValueFrom(
      this.http.get<{
        similar: Product[];
        budget: Product[];
        better: Product[];
        performance: Product[];
      }>(`${this.apiUrl}/products/${id}/recommendations`, { withCredentials: true })
    );
  }
}
