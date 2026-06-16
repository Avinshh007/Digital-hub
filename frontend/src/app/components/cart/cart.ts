// src/app/components/cart/cart.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
})
export class CartComponent {
  cartService = inject(CartService);
  private langService = inject(LanguageService);
  private router = inject(Router);

  couponCode = '';
  couponError = signal<string | null>(null);
  applyingCoupon = signal(false);

  // Bind cart signals to local bindings
  items = this.cartService.items;
  subtotal = this.cartService.subtotal;
  tax = this.cartService.tax;
  discount = this.cartService.discount;
  total = this.cartService.total;
  coupon = this.cartService.coupon;

  t = this.langService.t;

  trackById(index: number, item: CartItem): string {
    return item.id;
  }

  updateQty(id: string, newQty: number) {
    this.cartService.updateQuantity(id, newQty);
  }

  removeItem(id: string) {
    this.cartService.removeFromCart(id);
  }

  async applyCoupon() {
    if (!this.couponCode.trim()) return;
    this.applyingCoupon.set(true);
    this.couponError.set(null);
    try {
      await this.cartService.applyCoupon(this.couponCode);
      this.couponCode = '';
    } catch (e: any) {
      this.couponError.set(e.error || 'Failed to apply coupon.');
    } finally {
      this.applyingCoupon.set(false);
    }
  }

  removeCoupon() {
    this.cartService.removeCoupon();
  }

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
