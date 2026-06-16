// src/app/services/cart.service.ts
import { Injectable, signal, computed, inject, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  stock: number;
  sku: string;
  quantity: number;
  gstRate: number;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  stock: number;
}

export interface CouponInfo {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  // Signals for cart, wishlist, and active coupon
  private cartItems = signal<CartItem[]>([]);
  private wishlistItems = signal<WishlistItem[]>([]);
  private activeCoupon = signal<CouponInfo | null>(null);

  constructor() {
    // Load guest/local cart & wishlist first
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try { this.cartItems.set(JSON.parse(savedCart)); } catch (e) {}
      }

      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        try { this.wishlistItems.set(JSON.parse(savedWishlist)); } catch (e) {}
      }
    }

    // Effect to auto-sync with backend on auth state changes
    effect(async () => {
      const user = this.authService.user();
      if (user) {
        // Logged in: Sync local cart with DB, then fetch the authoritative cart & wishlist from DB
        try {
          const items = untracked(() => this.cartItems());
          const localCart = items.map(item => ({ productId: item.id, quantity: item.quantity }));
          if (localCart.length > 0) {
            await firstValueFrom(
              this.http.post<any>(`${this.apiUrl}/cart/sync`, { items: localCart }, { withCredentials: true })
            );
          }
          await this.loadCartFromDb();
          await this.loadWishlistFromDb();
        } catch (err) {
          console.error('Failed to sync cart/wishlist with DB', err);
        }
      } else {
        // Logged out: fallback to local storage (or clear if desired, but keep local for guest cart)
        this.activeCoupon.set(null);
      }
    });
  }

  // Read-only accessors
  get items() {
    return this.cartItems.asReadonly();
  }

  get wishlist() {
    return this.wishlistItems.asReadonly();
  }

  get coupon() {
    return this.activeCoupon.asReadonly();
  }

  // Computed totals
  cartCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));

  subtotal = computed(() => this.cartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0));

  tax = computed(() => {
    // 18% standard GST is embedded inside item prices in India.
    // Calculate backwards: basePrice = price / (1 + gstRate / 100), tax = price - basePrice
    return this.cartItems().reduce((sum, item) => {
      const rate = item.gstRate || 18.0;
      const basePrice = item.price / (1 + rate / 100);
      return sum + ((item.price - basePrice) * item.quantity);
    }, 0);
  });

  discount = computed(() => {
    const coupon = this.activeCoupon();
    if (!coupon) return 0;
    
    const sub = this.subtotal();
    if (coupon.discountType === 'PERCENTAGE') {
      return (sub * coupon.discountValue) / 100;
    }
    return coupon.discountValue;
  });

  total = computed(() => Math.max(0, this.subtotal() - this.discount()));

  // DB Load Helpers
  private async loadCartFromDb() {
    try {
      const res = await firstValueFrom(
        this.http.get<{ cartItems: any[] }>(`${this.apiUrl}/cart`, { withCredentials: true })
      );
      const items: CartItem[] = res.cartItems.map((ci: any) => ({
        id: ci.product.id,
        name: ci.product.name,
        price: ci.product.price,
        originalPrice: ci.product.originalPrice,
        image: this.parseProductImage(ci.product.images),
        stock: ci.product.stock,
        sku: ci.product.sku,
        quantity: ci.quantity,
        gstRate: ci.product.gstRate
      }));
      this.cartItems.set(items);
      this.saveCartToLocalStorage();
    } catch (e) {
      console.error('Load cart from DB failed', e);
    }
  }

  private async loadWishlistFromDb() {
    try {
      const res = await firstValueFrom(
        this.http.get<{ wishlist: any[] }>(`${this.apiUrl}/wishlist`, { withCredentials: true })
      );
      const items: WishlistItem[] = res.wishlist.map((wi: any) => ({
        id: wi.product.id,
        name: wi.product.name,
        price: wi.product.price,
        originalPrice: wi.product.originalPrice,
        image: this.parseProductImage(wi.product.images),
        stock: wi.product.stock
      }));
      this.wishlistItems.set(items);
      this.saveWishlistToLocalStorage();
    } catch (e) {
      console.error('Load wishlist from DB failed', e);
    }
  }

  private parseProductImage(imagesStr: string): string {
    try {
      const parsed = JSON.parse(imagesStr);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '/uploads/hero_banner.jpg';
    } catch (e) {
      return imagesStr || '/uploads/hero_banner.jpg';
    }
  }

  // Cart operations
  async addToCart(item: Omit<CartItem, 'quantity'>) {
    const current = this.cartItems();
    const existing = current.find((i) => i.id === item.id);
    let newQty = 1;

    if (existing) {
      if (existing.quantity >= item.stock) {
        alert('Cannot add more items than available in stock.');
        return;
      }
      newQty = existing.quantity + 1;
      this.cartItems.set(
        current.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
      );
    } else {
      this.cartItems.set([...current, { ...item, quantity: 1 }]);
    }
    this.saveCartToLocalStorage();

    // Sync to DB if logged in
    if (this.authService.user()) {
      try {
        await firstValueFrom(
          this.http.post(`${this.apiUrl}/cart`, { productId: item.id, quantity: newQty }, { withCredentials: true })
        );
      } catch (err) {
        console.error('Failed to add to DB cart', err);
      }
    }
  }

  async updateQuantity(id: string, qty: number) {
    const current = this.cartItems();
    const item = current.find((i) => i.id === id);
    if (!item) return;

    if (qty <= 0) {
      await this.removeFromCart(id);
      return;
    }

    if (qty > item.stock) {
      alert(`Only ${item.stock} items are available in stock.`);
      return;
    }

    this.cartItems.set(
      current.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
    this.saveCartToLocalStorage();
    
    // Re-verify coupon discount value if cart changed
    if (this.activeCoupon()) {
      this.applyCoupon(this.activeCoupon()!.code);
    }

    // Sync to DB if logged in
    if (this.authService.user()) {
      try {
        await firstValueFrom(
          this.http.post(`${this.apiUrl}/cart`, { productId: id, quantity: qty }, { withCredentials: true })
        );
      } catch (err) {
        console.error('Failed to update DB cart quantity', err);
      }
    }
  }

  async removeFromCart(id: string) {
    this.cartItems.set(this.cartItems().filter((i) => i.id !== id));
    this.saveCartToLocalStorage();

    if (this.cartItems().length === 0) {
      this.activeCoupon.set(null);
    } else if (this.activeCoupon()) {
      this.applyCoupon(this.activeCoupon()!.code);
    }

    // Sync to DB if logged in
    if (this.authService.user()) {
      try {
        await firstValueFrom(
          this.http.delete(`${this.apiUrl}/cart/${id}`, { withCredentials: true })
        );
      } catch (err) {
        console.error('Failed to delete from DB cart', err);
      }
    }
  }

  async clearCart() {
    this.cartItems.set([]);
    this.activeCoupon.set(null);
    this.saveCartToLocalStorage();

    // Sync to DB if logged in
    if (this.authService.user()) {
      try {
        await firstValueFrom(
          this.http.delete(`${this.apiUrl}/cart`, { withCredentials: true })
        );
      } catch (err) {
        console.error('Failed to clear DB cart', err);
      }
    }
  }

  // Wishlist operations
  async toggleWishlist(item: WishlistItem) {
    const current = this.wishlistItems();
    const exists = current.some((i) => i.id === item.id);

    if (exists) {
      this.wishlistItems.set(current.filter((i) => i.id !== item.id));
    } else {
      this.wishlistItems.set([...current, item]);
    }
    this.saveWishlistToLocalStorage();

    // Sync to DB if logged in
    if (this.authService.user()) {
      try {
        if (exists) {
          await firstValueFrom(
            this.http.delete(`${this.apiUrl}/wishlist/${item.id}`, { withCredentials: true })
          );
        } else {
          await firstValueFrom(
            this.http.post(`${this.apiUrl}/wishlist`, { productId: item.id }, { withCredentials: true })
          );
        }
      } catch (err) {
        console.error('Failed to sync DB wishlist', err);
      }
    }
  }

  isInWishlist(id: string): boolean {
    return this.wishlistItems().some((i) => i.id === id);
  }

  // Coupon handling
  async applyCoupon(code: string): Promise<void> {
    if (!code || this.subtotal() === 0) return;
    try {
      const res = await firstValueFrom(
        this.http.post<{ valid: boolean; code: string; discountType: string; discountValue: number; discountAmount: number }>(
          `${this.apiUrl}/coupons/validate`,
          { code, subtotal: this.subtotal() }
        )
      );
      this.activeCoupon.set({
        code: res.code,
        discountType: res.discountType,
        discountValue: res.discountValue,
        discountAmount: res.discountAmount,
      });
    } catch (e: any) {
      this.activeCoupon.set(null);
      throw e.error || { error: 'Coupon code is invalid' };
    }
  }

  removeCoupon() {
    this.activeCoupon.set(null);
  }

  // Local storage helpers
  private saveCartToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(this.cartItems()));
    }
  }

  private saveWishlistToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(this.wishlistItems()));
    }
  }
}
