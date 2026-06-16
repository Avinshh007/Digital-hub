// src/app/components/footer/footer.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <!-- Column 1: Store Intro -->
          <div class="space-y-4">
            <h3 class="text-white font-extrabold text-lg tracking-wider uppercase">
              Sri Pavan <span class="text-amber-400">Computers</span>
            </h3>
            <p class="text-sm text-slate-400 leading-relaxed font-semibold">
              Serving Kakinada with premium computers, laptops, authorized accessories, and state-of-the-art repair services. Authorized GST billing.
            </p>
            <div class="flex space-x-4">
              <!-- WhatsApp Quick contact icon -->
              <a [href]="'https://wa.me/919848257578'" target="_blank" rel="noopener noreferrer" class="p-2 bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-full transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fill-current"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </a>
            </div>
          </div>

          <!-- Column 2: Quick Links -->
          <div class="space-y-4">
            <h4 class="text-white font-black text-sm uppercase tracking-widest">Navigation</h4>
            <ul class="space-y-2.5 text-sm font-semibold">
              <li><a routerLink="/products" class="hover:text-amber-400 transition-colors">Shop Products</a></li>
              <li><a routerLink="/about" class="hover:text-amber-400 transition-colors">About Our Journey</a></li>
              <li><a routerLink="/contact" class="hover:text-amber-400 transition-colors">Contact Support</a></li>
              <li><a routerLink="/faq" class="hover:text-amber-400 transition-colors">Help & FAQ</a></li>
            </ul>
          </div>

          <!-- Column 3: Contact Info -->
          <div class="space-y-4 lg:col-span-2">
            <h4 class="text-white font-black text-sm uppercase tracking-widest">Store Location</h4>
            <div class="space-y-3.5 text-sm">
              
              <!-- MapPin -->
              <div class="flex items-start space-x-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500 shrink-0 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>
                  21-9-9, Krishna Kanth Plaza, R R Road, near Sanjay Nagar PHC, Kakinada - 533001, Andhra Pradesh, India
                </span>
              </div>

              <!-- Phone -->
              <div class="flex items-center space-x-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500 shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <a href="tel:+919848257578" class="font-extrabold hover:text-amber-400 transition-colors">+91 98482 57578</a>
              </div>

              <!-- Mail -->
              <div class="flex items-center space-x-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500 shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <a href="mailto:info@sripavancomputers.com" class="hover:text-amber-400 transition-colors">info@sripavancomputers.com</a>
              </div>

            </div>
          </div>

        </div>

        <!-- Divider and operating hours -->
        <div class="border-t border-slate-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-widest gap-4">
          <div class="flex flex-col md:flex-row gap-2 md:gap-6 items-center">
            <span>Operating: Mon - Sat (9:30 AM - 8:30 PM)</span>
            <span class="text-rose-500">Sunday Holiday (ఆదివారం సెలవు)</span>
          </div>
          <span>&copy; {{ currentYear }} Sri Pavan Computers. {{ t().gstText }}.</span>
        </div>

      </div>
    </footer>
  `
})
export class FooterComponent {
  private langService = inject(LanguageService);
  t = this.langService.t;
  currentYear = new Date().getFullYear();
}
