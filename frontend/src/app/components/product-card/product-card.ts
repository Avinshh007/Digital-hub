// src/app/components/product-card/product-card.ts
import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';
import { CompareService } from '../../services/compare.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="group relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-indigo-100/80 dark:hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-500 flex flex-col h-full animate-fade-in">
      
      <!-- Product Image Container -->
      <a [routerLink]="['/products', product.id]" class="relative block aspect-[4/3] bg-slate-50/50 dark:bg-slate-800/20 overflow-hidden rounded-t-[2rem]">
        <img
          [src]="imageUrl"
          [alt]="product.name"
          class="w-full h-full object-contain p-4 group-hover:scale-110 group-hover:-rotate-2 transition-transform duration-700 mix-blend-multiply dark:mix-blend-normal dark:bg-slate-800/10"
          loading="lazy"
        />

        <!-- Discount Badge -->
        <span *ngIf="discount > 0" class="absolute top-3 left-3 bg-emerald-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md z-10">
          {{ discount }}% OFF
        </span>

        <!-- Compare Button -->
        <button
          (click)="handleCompareToggle($event)"
          [ngClass]="{
            'bg-indigo-50 dark:bg-indigo-950/45 border-indigo-200 dark:border-indigo-900/50 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-100': isInCompare(),
            'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600': !isInCompare()
          }"
          [style.left]="discount > 0 ? '5.5rem' : '0.75rem'"
          class="absolute top-3 p-1.5 rounded-full shadow-md backdrop-blur-md transition-all duration-200 z-10 border cursor-pointer flex items-center justify-center text-xs"
          [title]="isInCompare() ? 'Remove from Compare' : 'Add to Compare'"
        >
          ⚖️
        </button>

        <!-- Out of Stock Overlay -->
        <div *ngIf="outOfStock" class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10">
          <span class="bg-red-600 text-white font-bold text-sm px-4 py-1.5 rounded-full shadow-lg">
            {{ t().outOfStock }}
          </span>
        </div>

        <!-- Wishlist Button -->
        <button
          (click)="handleWishlistToggle($event)"
          [ngClass]="{
            'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-100': isInWishlist(),
            'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-rose-500': !isInWishlist()
          }"
          class="absolute top-3 right-3 p-2 rounded-full shadow-md backdrop-blur-md transition-all duration-200 z-10 border cursor-pointer"
          [title]="isInWishlist() ? 'Remove from Wishlist' : 'Add to Wishlist'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" [attr.fill]="isInWishlist() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform active:scale-125"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </a>

      <!-- Product Information -->
      <div class="p-4 flex flex-col flex-grow">
        
        <!-- Brand & Category -->
        <div class="flex items-center justify-between text-xs text-slate-400 dark:text-slate-550 font-bold mb-1">
          <span class="uppercase tracking-wider">{{ product.brand?.name || 'SPC' }}</span>
          <span>{{ product.category?.name }}</span>
        </div>

        <!-- Title -->
        <a [routerLink]="['/products', product.id]" class="block flex-grow mb-1.5">
          <h3 class="font-extrabold text-sm sm:text-base line-clamp-2 hover:text-blue-600 dark:hover:text-amber-550 transition-colors text-slate-800 dark:text-slate-200 leading-snug">
            {{ product.name }}
          </h3>
        </a>

        <!-- Rating -->
        <div class="flex items-center space-x-1 mb-2">
          <div class="flex text-amber-400">
            <svg *ngFor="let star of [1,2,3,4,5]; let i = index" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" [attr.fill]="i < Math.round(product.rating) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <span class="text-xs text-slate-400 dark:text-slate-550 font-semibold">({{ product.ratingCount }})</span>
        </div>

        <!-- Price & Action -->
        <div class="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <div class="flex flex-col">
            <span class="text-lg font-black text-slate-900 dark:text-white">
              ₹{{ product.price.toLocaleString('en-IN') }}
            </span>
            <span *ngIf="product.originalPrice > product.price" class="text-xs text-slate-400 dark:text-slate-500 line-through font-semibold">
              ₹{{ product.originalPrice.toLocaleString('en-IN') }}
            </span>
          </div>

          <button
            (click)="handleAddToCart($event)"
            [disabled]="outOfStock"
            [ngClass]="{
              'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none': outOfStock,
              'bg-blue-600 text-white dark:bg-amber-500 dark:text-blue-950 hover:bg-blue-700 dark:hover:bg-amber-400 hover:shadow-lg active:scale-95': !outOfStock
            }"
            class="flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 shadow-md cursor-pointer"
            [title]="outOfStock ? 'Out of Stock' : t().addToCart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </button>
        </div>

      </div>

    </div>
  `
})
export class ProductCardComponent {
  protected readonly Math = Math;
  private cartService = inject(CartService);
  private langService = inject(LanguageService);
  private compareService = inject(CompareService);

  @Input() product!: any;

  t = this.langService.t;

  get imageUrl(): string {
    try {
      const parsed = JSON.parse(this.product.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (e) {}
    return '/uploads/hero_banner.jpg';
  }

  get discount(): number {
    if (this.product.originalPrice > this.product.price) {
      return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
    }
    return 0;
  }

  get outOfStock(): boolean {
    return this.product.stock <= 0;
  }

  isInWishlist(): boolean {
    return this.cartService.isInWishlist(this.product.id);
  }

  handleAddToCart(e: MouseEvent) {
    e.preventDefault();
    this.cartService.addToCart({
      id: this.product.id,
      name: this.product.name,
      price: this.product.price,
      originalPrice: this.product.originalPrice,
      image: this.imageUrl,
      stock: this.product.stock,
      sku: this.product.sku,
      gstRate: this.product.gstRate,
    });
  }

  handleWishlistToggle(e: MouseEvent) {
    e.preventDefault();
    this.cartService.toggleWishlist({
      id: this.product.id,
      name: this.product.name,
      price: this.product.price,
      originalPrice: this.product.originalPrice,
      image: this.imageUrl,
      stock: this.product.stock,
    });
  }

  isInCompare(): boolean {
    return this.compareService.isInCompare(this.product.id);
  }

  handleCompareToggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.compareService.toggleProduct(this.product);
  }
}
