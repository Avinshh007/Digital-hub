// src/app/components/homepage/homepage.ts
import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductService, Product, Category, Brand } from '../../services/product.service';
import { LanguageService } from '../../services/language.service';
import { CartService } from '../../services/cart.service';
import { ProductCardComponent } from '../product-card/product-card';

export interface Banner {
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl: string;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './homepage.html',
  styles: [`
    .animate-fade-in-up {
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class HomepageComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private langService = inject(LanguageService);
  private router = inject(Router);

  // Data signals
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  featuredProducts = signal<Product[]>([]);
  allProducts = signal<Product[]>([]);
  loading = signal<boolean>(true);

  // UI state signals
  activeTab = signal<'featured' | 'new'>('featured');
  faqOpen = signal<{ [key: number]: boolean }>({ 0: true });
  currentSlide = signal(0);
  private slideInterval: any;

  // Translations & context
  language = this.langService.language;
  t = this.langService.t;

  // Banners data
  banners: Banner[] = [
    {
      imageUrl: '/uploads/hero_banner.jpg',
      title: ' DIGITAL HUB',
      subtitle: 'Premium Electronics & Computer Repair Store in Kakinada',
      linkUrl: '/products',
    },
    {
      imageUrl: '/uploads/banner_laptops.jpg',
      title: 'Upgrade to High Performance Laptops',
      subtitle: 'Up to 30% OFF on Top Brands like HP, Dell, and Lenovo',
      linkUrl: '/products?category=laptops',
    }
  ];

  benefits = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
      title: 'GST Registered Invoices',
      titleTe: 'GST రిజిస్టర్డ్ ఇన్వాయిస్లు',
      desc: 'Get standard GST-compliant B2B/B2C billing for company accounts.',
      descTe: 'కంపెనీల కోసం ప్రమాణికమైన GST బిల్‌ను పొందండి.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
      title: 'Cash On Delivery (COD)',
      titleTe: 'క్యాష్ ఆన్ డెలివరీ (COD)',
      desc: 'Pay at your doorstep with Cash or UPI upon receiving the items.',
      descTe: 'వస్తువు అందిన తర్వాత నగదు లేదా UPIతో చెల్లించండి.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M22 12h-4c-1.1 0-2 .9-2 2v2c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-2c0-1.1-.9-2-2-2H2"></path></svg>`,
      title: 'Genuine Brands Warranty',
      titleTe: 'ఒరిజినల్ బ్రాండ్ల వారంటీ',
      desc: 'All computers and storage devices come with official manufacturer warranty.',
      descTe: 'అన్ని కంప్యూటర్లు మరియు స్టోరేజ్ పరికరాలకు అధికారిక బ్రాండ్ వారంటీ కలదు.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
      title: 'Professional Service & Repair',
      titleTe: 'కంప్యూటర్ సర్వీస్ & రిపేర్',
      desc: 'Visit our store for chip-level repair, OS installation, and hardware upgrades.',
      descTe: 'ల్యాప్‌టాప్ రిపేర్, OS ఇన్స్టాలేషన్, అప్‌గ్రేడ్ కోసం మా స్టోర్‌ను సందర్శించండి.',
    },
  ];

  faqs = [
    {
      q: 'Do you sell custom-assembled desktop PCs?',
      qTe: 'మీరు కస్టమ్ డెస్క్‌టాప్ కంప్యూటర్లను అసెంబ్లీ చేసి ఇస్తారా?',
      a: 'Yes! We specialize in custom-building desktop PCs for gaming, video editing, and office applications based on your choice of processors, RAM, graphic cards, and budget.',
      aTe: 'అవును! మీ బడ్జెట్ మరియు అవసరాలకు తగినట్లుగా గేమింగ్, ఆఫీస్ మరియు వీడియో ఎడిటింగ్ కోసం డెస్క్‌టాప్ కంప్యూటర్లను అసెంబ్లీ చేసి ఇస్తాము.',
    },
    {
      q: 'Are your laptop screens and accessories genuine?',
      qTe: 'మీ వద్ద ల్యాప్‌టాప్ స్క్రీన్లు మరియు యాక్సెసరీలు ఒరిజినల్ దొరుకుతాయా?',
      a: 'We only supply authentic components directly from certified distributors of Dell, HP, Lenovo, and Logitech. You get standard retail GST invoices.',
      aTe: 'మేము Dell, HP, Lenovo మరియు Logitech బ్రాండ్ల నుండి అధికారిక విడిభాగాలను మాత్రమే సరఫరా చేస్తాము. మీకు అసలైన GST బిల్‌ను అందజేస్తాము.',
    },
    {
      q: 'What is your product return policy?',
      qTe: 'వస్తువుల రిటర్న్ పాలసీ ఏమిటి?',
      a: 'If a product is found defective or damaged upon delivery, contact us immediately within 24 hours. We will arrange a replacement or refund after inspection.',
      aTe: 'డెలివరీ సమయంలో వస్తువు దెబ్బతిన్నట్లు లేదా లోపాలు ఉన్నట్లు గుర్తిస్తే, 24 గంటలలోపు సంప్రదించండి. తనిఖీ చేసిన తర్వాత బదిలీ లేదా రీఫండ్ చేస్తాము.',
    },
    {
      q: 'Do you provide onsite laptop repair service in Kakinada?',
      qTe: 'కాకినాడలో ఇంటి వద్దకే వచ్చి ల్యాప్‌టాప్ రిపేర్ సర్వీస్ చేస్తారా?',
      a: 'Yes, we provide onsite diagnostic and service support for businesses and homes within Kakinada city. For critical chip-level issues, we bring the device to our store.',
      aTe: 'అవును, కాకినాడ సిటీ పరిధిలో ఇళ్లు మరియు ఆఫీసులకు సర్వీస్ సపోర్ట్ అందిస్తాము. పెద్ద సమస్యల కోసం పరికరాన్ని మా స్టోర్‌కు తీసుకువస్తాము.',
    },
  ];

  displayedProducts = computed(() => {
    if (this.activeTab() === 'featured') {
      return this.featuredProducts();
    }
    return this.allProducts().slice(0, 4);
  });

  async ngOnInit() {
    try {
      const data = await this.productService.getProducts();
      this.categories.set(data.categories || []);
      this.brands.set(data.brands || []);
      this.allProducts.set(data.products || []);
      
      // Seed first 4 products as featured/bestsellers for homepage showcase
      this.featuredProducts.set(data.products.slice(0, 4) || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }

    // Start auto slider
    if (typeof window !== 'undefined') {
      this.slideInterval = setInterval(() => {
        this.nextSlide();
      }, 5000);

      // Trigger scroll animations setup
      setTimeout(() => this.setupScrollObserver(), 500);
    }
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  // Scroll Reveal setup using IntersectionObserver (Apple-like smooth clean reveals)
  setupScrollObserver() {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            entry.target.classList.remove('opacity-0');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      el.classList.add('opacity-0');
      observer.observe(el);
    });
  }

  // Slider controls
  prevSlide() {
    const nextIdx = this.currentSlide() === 0 ? this.banners.length - 1 : this.currentSlide() - 1;
    this.currentSlide.set(nextIdx);
  }

  nextSlide() {
    const nextIdx = this.currentSlide() === this.banners.length - 1 ? 0 : this.currentSlide() + 1;
    this.currentSlide.set(nextIdx);
  }

  setSlide(idx: number) {
    this.currentSlide.set(idx);
  }

  // Tabs switcher
  setActiveTab(tab: 'featured' | 'new') {
    this.activeTab.set(tab);
  }

  // FAQ accordion
  toggleFaq(index: number) {
    const current = this.faqOpen();
    this.faqOpen.set({ ...current, [index]: !current[index] });
  }

  isFaqOpen(index: number): boolean {
    return !!this.faqOpen()[index];
  }
}
