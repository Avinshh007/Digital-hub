import { Injectable, signal, effect } from '@angular/core';
import { Product } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class CompareService {
  private compareItemsSignal = signal<Product[]>([]);

  constructor() {
    this.loadFromLocalStorage();
    
    // Auto persist to localStorage when signal changes
    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('spc_compare_items', JSON.stringify(this.compareItemsSignal()));
      }
    });
  }

  get compareItems() {
    return this.compareItemsSignal.asReadonly();
  }

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('spc_compare_items');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.compareItemsSignal.set(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load compare items', e);
      }
    }
  }

  toggleProduct(product: Product): boolean {
    const current = this.compareItemsSignal();
    const exists = current.find(item => item.id === product.id);

    if (exists) {
      this.compareItemsSignal.set(current.filter(item => item.id !== product.id));
      return false;
    } else {
      if (current.length >= 4) {
        alert('You can compare a maximum of 4 products at a time.');
        return false;
      }
      this.compareItemsSignal.set([...current, product]);
      return true;
    }
  }

  isInCompare(productId: string): boolean {
    return this.compareItemsSignal().some(item => item.id === productId);
  }

  removeFromCompare(productId: string) {
    this.compareItemsSignal.set(this.compareItemsSignal().filter(item => item.id !== productId));
  }

  clear() {
    this.compareItemsSignal.set([]);
  }
}
