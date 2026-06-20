// src/app/components/shop/shop.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { ProductService, Product, Category, Brand } from '../../services/product.service';
import { LanguageService } from '../../services/language.service';
import { ProductCardComponent } from '../product-card/product-card';
import { CompareService } from '../../services/compare.service';
import { RecentlyViewedComponent } from '../recently-viewed/recently-viewed';
import { TrustSectionComponent } from '../trust-section/trust-section';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent, RecentlyViewedComponent, TrustSectionComponent],
  templateUrl: './shop.html',
})
export class ShopComponent implements OnInit {
  private productService = inject(ProductService);
  private langService = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  private meta = inject(Meta);
  compareService = inject(CompareService);

  // Data
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  loading = signal<boolean>(true);

  // Filters State
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('');
  selectedBrand = signal<string>('');
  minPrice = signal<number>(0);
  maxPrice = signal<number>(200000);
  inStockOnly = signal<boolean>(false);
  sortBy = signal<string>('createdAt');

  // Pagination State
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);
  totalProducts = signal<number>(0);
  totalPages = computed(() => Math.ceil(this.totalProducts() / this.pageSize()));

  // Translations
  t = this.langService.t;

  ngOnInit() {
    // Listen to query params for search or category selection
    this.route.queryParams.subscribe((params) => {
      this.searchQuery.set(params['q'] || '');
      this.selectedCategory.set(params['category'] || '');
      this.selectedBrand.set(params['brand'] || '');
      this.sortBy.set(params['sortBy'] || 'createdAt');
      this.currentPage.set(parseInt(params['page'] || '1'));
      this.loadFilteredProducts();
    });
  }

  async loadFilteredProducts() {
    this.loading.set(true);
    try {
      const data = await this.productService.getProducts({
        q: this.searchQuery(),
        category: this.selectedCategory(),
        brand: this.selectedBrand(),
        minPrice: this.minPrice(),
        maxPrice: this.maxPrice(),
        inStock: this.inStockOnly(),
        sortBy: this.sortBy(),
        page: this.currentPage(),
        limit: this.pageSize(),
      });
      
      this.products.set(data.products || []);
      this.categories.set(data.categories || []);
      this.brands.set(data.brands || []);
      this.totalProducts.set(data.total || 0);

      this.updateSeoTags();
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  updateSeoTags() {
    let titleStr = 'Shop Computer Components & Services |  DIGITAL HUB';
    let descStr = 'Browse our wide range of computing components, peripherals, custom PCs, and professional services. Genuine warranty and GST invoices on all purchases.';
    
    const catSlug = this.selectedCategory();
    if (catSlug) {
      const catObj = this.categories().find(c => c.slug === catSlug);
      if (catObj) {
        titleStr = `Buy ${catObj.name} Online - Best Prices |  DIGITAL HUB`;
        descStr = `Purchase premium ${catObj.name} products at  DIGITAL HUB. Get genuine brand warranty, fast shipping, and tax invoice options.`;
      }
    }
    
    const brandSlug = this.selectedBrand();
    if (brandSlug) {
      const brandObj = this.brands().find(b => b.slug === brandSlug);
      if (brandObj) {
        titleStr = `${brandObj.name} Products Store |  DIGITAL HUB`;
        descStr = `Explore computing hardware and products from ${brandObj.name}. Order online with official brand warranty.`;
      }
    }
    
    if (this.searchQuery()) {
      titleStr = `Search results for "${this.searchQuery()}" |  DIGITAL HUB`;
    }

    this.title.setTitle(titleStr);
    
    this.meta.removeTag("name='description'");
    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:type'");
    this.meta.removeTag("property='og:url'");
    
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000/products';

    this.meta.addTags([
      { name: 'description', content: descStr },
      { property: 'og:title', content: titleStr },
      { property: 'og:description', content: descStr },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: currentUrl }
    ]);
  }

  // Handle filter changes
  applyFilters() {
    this.currentPage.set(1);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        q: this.searchQuery() || null,
        category: this.selectedCategory() || null,
        brand: this.selectedBrand() || null,
        sortBy: this.sortBy() || null,
      },
      queryParamsHandling: 'merge'
    });
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedBrand.set('');
    this.minPrice.set(0);
    this.maxPrice.set(200000);
    this.inStockOnly.set(false);
    this.sortBy.set('createdAt');
    this.currentPage.set(1);
    
    // Clear route query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  onSortChange(val: string) {
    this.sortBy.set(val);
    this.applyFilters();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page },
        queryParamsHandling: 'merge',
      });
    }
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
}
