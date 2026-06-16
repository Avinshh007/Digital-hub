// src/app/components/wishlist/wishlist.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService, WishlistItem } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.html',
})
export class WishlistComponent {
  cartService = inject(CartService);
  private langService = inject(LanguageService);

  wishlist = this.cartService.wishlist;
  t = this.langService.t;

  handleRemove(item: WishlistItem) {
    this.cartService.toggleWishlist(item);
  }

  handleMoveToCart(item: WishlistItem) {
    // Add to cart
    this.cartService.addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      stock: item.stock,
      sku: 'WSH-' + item.id.slice(0, 4).toUpperCase(),
      gstRate: 18.0
    });
    // Remove from wishlist
    this.cartService.toggleWishlist(item);
  }
}
