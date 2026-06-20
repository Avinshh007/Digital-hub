import { Injectable, signal, effect } from '@angular/core';
import { Product } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class RecentlyViewedService {
  private recentlyViewedSignal = signal<Product[]>([]);

  constructor() {
    this.loadFromLocalStorage();

    // Auto persist to localStorage when signal changes
    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('spc_recently_viewed', JSON.stringify(this.recentlyViewedSignal()));
      }
    });
  }

  get recentlyViewed() {
    return this.recentlyViewedSignal.asReadonly();
  }

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('spc_recently_viewed');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.recentlyViewedSignal.set(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load recently viewed products', e);
      }
    }
  }

  addProduct(product: Product) {
    const current = this.recentlyViewedSignal();
    // Remove existing if it's already in the list
    const filtered = current.filter(item => item.id !== product.id);
    // Put new product at the beginning, limit to 10 items
    const updated = [product, ...filtered].slice(0, 10);
    this.recentlyViewedSignal.set(updated);
  }

  clear() {
    this.recentlyViewedSignal.set([]);
  }
}
