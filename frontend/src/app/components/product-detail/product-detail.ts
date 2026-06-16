// src/app/components/product-detail/product-detail.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { ProductService, Product, Review } from '../../services/product.service';
import { LanguageService } from '../../services/language.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.html',
})
export class ProductDetailComponent implements OnInit {
  protected readonly Math = Math;
  private productService = inject(ProductService);
  private langService = inject(LanguageService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  private meta = inject(Meta);

  // Signals for state
  product = signal<Product | null>(null);
  recommendations = signal<Product[]>([]);
  loading = signal<boolean>(true);
  
  // Gallery and options state
  selectedImageIndex = signal<number>(0);
  quantity = signal<number>(1);
  
  // Review submission form
  reviewRating = signal<number>(5);
  reviewComment = signal<string>('');
  submittingReview = signal<boolean>(false);
  reviewError = signal<string | null>(null);

  // Global Contexts
  t = this.langService.t;
  user = this.authService.user;

  // Parsed JSON properties
  imagesList = computed(() => {
    const p = this.product();
    if (!p) return [];
    try {
      const parsed = JSON.parse(p.images);
      return Array.isArray(parsed) ? parsed : [p.images];
    } catch (e) {
      return [p.images || '/uploads/hero_banner.jpg'];
    }
  });

  parsedSpecs = computed(() => {
    const p = this.product();
    if (!p) return [];
    try {
      const parsed = JSON.parse(p.specs);
      return Object.entries(parsed).map(([key, val]) => ({ key, val }));
    } catch (e) {
      return [];
    }
  });

  get discount(): number {
    const p = this.product();
    if (p && p.originalPrice > p.price) {
      return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
    }
    return 0;
  }

  get whatsappInquiryUrl(): string {
    const p = this.product();
    if (!p) return '#';
    const text = `Hi Sri Pavan Computers, I am interested in purchasing: "${p.name}" (Price: ₹${p.price.toLocaleString('en-IN')}, SKU: ${p.sku}). Please let me know its availability.`;
    return `https://wa.me/919848257578?text=${encodeURIComponent(text)}`;
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  async loadProductDetails(id: string) {
    this.loading.set(true);
    try {
      const prod = await this.productService.getProductById(id);
      this.product.set(prod);
      this.selectedImageIndex.set(0);
      this.quantity.set(1);

      // SEO Metadata injection
      this.title.setTitle(`${prod.name} | Sri Pavan Computers`);
      
      this.meta.removeTag("name='description'");
      this.meta.removeTag("property='og:title'");
      this.meta.removeTag("property='og:description'");
      this.meta.removeTag("property='og:image'");
      this.meta.removeTag("property='og:type'");
      this.meta.removeTag("property='og:url'");
      
      const prodDescription = prod.description || `Buy ${prod.name} online at Sri Pavan Computers. Get the best pricing, deals and GST invoice options.`;
      const prodImage = this.imagesList()[0] || '/uploads/hero_banner.jpg';
      const prodUrl = typeof window !== 'undefined' ? window.location.href : `http://localhost:3000/products/${prod.id}`;

      this.meta.addTags([
        { name: 'description', content: prodDescription },
        { property: 'og:title', content: prod.name },
        { property: 'og:description', content: prodDescription },
        { property: 'og:image', content: prodImage },
        { property: 'og:type', content: 'product' },
        { property: 'og:url', content: prodUrl }
      ]);
      
      this.injectProductJsonLd(prod, prodDescription, prodImage, prodUrl);

      // Load related products based on category
      const catalog = await this.productService.getProducts({ category: prod.category?.slug });
      this.recommendations.set(catalog.products.filter(p => p.id !== id).slice(0, 4));

      // Append to recently viewed list in LocalStorage
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('recently_viewed');
        let ids: string[] = saved ? JSON.parse(saved) : [];
        ids = [prod.id, ...ids.filter(val => val !== prod.id)].slice(0, 4);
        localStorage.setItem('recently_viewed', JSON.stringify(ids));
      }
    } catch (e) {
      console.error(e);
      this.product.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  injectProductJsonLd(prod: any, description: string, image: string, url: string) {
    if (typeof document === 'undefined') return;
    
    // Remove existing LD+JSON scripts to avoid duplicates
    const oldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    oldScripts.forEach(script => script.remove());
    
    const schema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      'name': prod.name,
      'image': image,
      'description': description,
      'sku': prod.sku,
      'mpn': prod.sku,
      'brand': {
        '@type': 'Brand',
        'name': prod.brand?.name || 'Sri Pavan Computers'
      },
      'offers': {
        '@type': 'Offer',
        'url': url,
        'priceCurrency': 'INR',
        'price': prod.price,
        'priceValidUntil': '2028-12-31',
        'itemCondition': 'https://schema.org/NewCondition',
        'availability': prod.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  // Gallery action
  setImageIndex(idx: number) {
    this.selectedImageIndex.set(idx);
  }

  // Cart actions
  incrementQty() {
    const p = this.product();
    if (!p) return;
    if (this.quantity() < p.stock) {
      this.quantity.set(this.quantity() + 1);
    } else {
      alert('Cannot order more items than currently in stock.');
    }
  }

  decrementQty() {
    if (this.quantity() > 1) {
      this.quantity.set(this.quantity() - 1);
    }
  }

  handleAddToCart() {
    const p = this.product();
    if (!p) return;
    for (let i = 0; i < this.quantity(); i++) {
      this.cartService.addToCart({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        image: this.imagesList()[0],
        stock: p.stock,
        sku: p.sku,
        gstRate: p.gstRate,
      });
    }
    alert('Items added to cart!');
  }

  handleWishlistToggle() {
    const p = this.product();
    if (!p) return;
    this.cartService.toggleWishlist({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      image: this.imagesList()[0],
      stock: p.stock,
    });
  }

  isInWishlist(): boolean {
    const p = this.product();
    return p ? this.cartService.isInWishlist(p.id) : false;
  }

  // Review submission
  async submitReview(e: Event) {
    e.preventDefault();
    const p = this.product();
    if (!p) return;

    if (!this.reviewComment().trim()) {
      this.reviewError.set('Please write a comment for your review.');
      return;
    }

    this.submittingReview.set(true);
    this.reviewError.set(null);

    try {
      await this.productService.submitReview(p.id, this.reviewRating(), this.reviewComment());
      this.reviewComment.set('');
      this.reviewRating.set(5);
      alert('Review submitted successfully!');
      this.loadProductDetails(p.id); // reload reviews
    } catch (err: any) {
      this.reviewError.set(err.error || 'Failed to submit review.');
    } finally {
      this.submittingReview.set(false);
    }
  }
}
