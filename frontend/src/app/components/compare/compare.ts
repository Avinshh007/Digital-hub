import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompareService } from '../../services/compare.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../services/product.service';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compare.html'
})
export class CompareComponent {
  private compareService = inject(CompareService);
  private cartService = inject(CartService);

  compareItems = this.compareService.compareItems;

  removeItem(id: string) {
    this.compareService.removeFromCompare(id);
  }

  getImageUrl(product: any): string {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (e) {}
    return '/uploads/hero_banner.jpg';
  }

  getSpec(product: any, key: string): string {
    if (!product || !product.specs) return '-';
    try {
      const parsed = JSON.parse(product.specs);
      return parsed[key] || parsed[key.toLowerCase()] || parsed[key.toUpperCase()] || '-';
    } catch (e) {
      return '-';
    }
  }

  addToCart(product: Product) {
    this.cartService.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: this.getImageUrl(product),
      stock: product.stock,
      sku: product.sku,
      gstRate: product.gstRate,
    });
  }
}
