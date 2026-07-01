import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <nav [ngClass]="{
      'bg-white/90 text-slate-800 shadow-md border-b border-slate-200/80 backdrop-blur-md': scrolled(),
      'bg-blue-950 text-white': !scrolled()
    }" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 sm:h-20">
          
          <!-- Business Logo -->
          <div class="flex-shrink-0 flex items-center">
            <a routerLink="/" class="flex flex-col">
              <span [ngClass]="scrolled() ? 'from-blue-900 to-indigo-700' : 'from-amber-400 to-amber-300'" 
                    class="font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent uppercase bg-gradient-to-r transition-all">
                   DIGITAL HUB
              </span>
              <span [ngClass]="scrolled() ? 'text-slate-500' : 'text-slate-300'" 
                    class="text-[10px] sm:text-xs tracking-widest font-semibold uppercase -mt-1 transition-all">
                Computers
              </span>
            </a>
          </div>

          <!-- Search Bar (Desktop) -->
          <div class="hidden md:flex flex-1 max-w-md mx-8">
            <form (submit)="handleSearch($event)" class="relative w-full">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                name="searchQuery"
                [placeholder]="t().searchPlaceholder"
                [ngClass]="scrolled() ? 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200' : 'bg-blue-900/40 text-slate-100 placeholder-slate-400 border border-blue-800'"
                class="w-full rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm font-semibold"
              />
              <button type="submit" [ngClass]="scrolled() ? 'text-slate-400 hover:text-blue-600' : 'text-slate-400 hover:text-amber-400'" class="absolute right-3 top-2.5 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
            </form>
          </div>

          <!-- Controls & Badges (Desktop) -->
          <div class="hidden lg:flex items-center space-x-6">
            
            <!-- Nav Links -->
            <div class="flex space-x-4 text-sm font-semibold tracking-wide">
              <a routerLink="/products" routerLinkActive="text-amber-500" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'" class="transition-colors">{{ t().shop }}</a>
              <a routerLink="/pc-builder" routerLinkActive="text-amber-500" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'" class="transition-colors">PC Builder</a>
              <a routerLink="/services" routerLinkActive="text-amber-500" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'" class="transition-colors">Services</a>
              <a routerLink="/warranty" routerLinkActive="text-amber-500" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'" class="transition-colors">Warranty Check</a>
              <a routerLink="/track-repair" routerLinkActive="text-amber-500" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'" class="transition-colors">Track Repair</a>
              <a routerLink="/about" routerLinkActive="text-amber-500" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'" class="transition-colors">{{ t().aboutUs }}</a>
              <a routerLink="/contact" routerLinkActive="text-amber-500" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'" class="transition-colors">{{ t().contactUs }}</a>
              <a routerLink="/faq" routerLinkActive="text-amber-500" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'" class="transition-colors">{{ t().faq }}</a>
            </div>

            <!-- Theme Switcher -->
            <button
              (click)="toggleTheme()"
              [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-300 hover:text-amber-400 hover:bg-blue-900/40'"
              class="p-2 rounded-full transition-all cursor-pointer flex items-center justify-center"
              [title]="theme() === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
            >
              <!-- Sun Icon (theme is dark) -->
              <svg *ngIf="theme() === 'dark'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              <!-- Moon Icon (theme is light) -->
              <svg *ngIf="theme() === 'light'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>

            <!-- Language Switcher -->
            <button
              (click)="toggleLanguage()"
              [ngClass]="scrolled() ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600' : 'border-slate-700 bg-blue-900/30 text-white hover:bg-amber-500 hover:text-blue-950'"
              class="text-xs font-bold border px-2.5 py-1 rounded-md transition-all cursor-pointer"
            >
              {{ language() === 'en' ? 'TE' : 'EN' }}
            </button>

            <!-- Wishlist -->
            <a routerLink="/wishlist" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-300 hover:text-amber-400 hover:bg-blue-900/40'" class="relative p-1.5 rounded-full transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span *ngIf="wishlistCount() > 0" class="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                {{ wishlistCount() }}
              </span>
            </a>

            <!-- Cart -->
            <a routerLink="/cart" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-300 hover:text-amber-400 hover:bg-blue-900/40'" class="relative p-1.5 rounded-full transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span *ngIf="cartCount() > 0" [ngClass]="scrolled() ? 'bg-blue-600 text-white' : 'bg-amber-50 text-blue-950'" class="absolute -top-1 -right-1 font-extrabold text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                {{ cartCount() }}
              </span>
            </a>

            <!-- Auth/Profile -->
            <div *ngIf="user(); else guestTpl" [ngClass]="scrolled() ? 'border-slate-200' : 'border-blue-800'" class="flex items-center space-x-3 pl-4 border-l">
              <a *ngIf="user()?.role === 'ADMIN'" routerLink="/admin" [ngClass]="scrolled() ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-amber-400/10 text-amber-400 hover:text-amber-300'" class="flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1.5 rounded-md transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                <span>{{ t().adminDashboard }}</span>
              </a>
              <a *ngIf="user()?.role === 'TECHNICIAN' || user()?.role === 'SERVICE_MANAGER'" routerLink="/technician/dashboard" [ngClass]="scrolled() ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-amber-400/10 text-amber-400 hover:text-amber-300'" class="flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1.5 rounded-md transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>
                <span>Workspace</span>
              </a>
              <a routerLink="/profile" [ngClass]="scrolled() ? 'text-slate-700 hover:text-blue-600' : 'text-slate-200 hover:text-amber-400'" class="flex items-center space-x-1.5 text-sm font-semibold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span class="max-w-[100px] truncate">{{ firstName() }}</span>
              </a>
              <button (click)="handleLogout()" [ngClass]="scrolled() ? 'text-slate-400 hover:text-rose-600' : 'text-slate-400 hover:text-rose-400'" class="transition-colors p-1 cursor-pointer" [title]="t().logout">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
            
            <ng-template #guestTpl>
              <a routerLink="/login" [ngClass]="scrolled() ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10' : 'bg-amber-50 hover:bg-amber-400 text-blue-950 shadow-amber-500/10'" class="flex items-center space-x-1.5 font-bold text-sm px-4 py-2 rounded-full transition-all shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>{{ t().login }}</span>
              </a>
            </ng-template>

          </div>

          <!-- Controls (Mobile) -->
          <div class="flex lg:hidden items-center space-x-3">
            <!-- Mobile Theme Switcher -->
            <button
              (click)="toggleTheme()"
              [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-300 hover:text-amber-400'"
              class="p-1.5 transition-colors cursor-pointer flex items-center justify-center"
            >
              <svg *ngIf="theme() === 'dark'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              <svg *ngIf="theme() === 'light'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>

            <!-- Mobile Lang switcher -->
            <button
              (click)="toggleLanguage()"
              [ngClass]="scrolled() ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white' : 'border-slate-700 bg-blue-900/30 text-white hover:bg-amber-500 hover:text-blue-950'"
              class="text-[10px] font-bold border px-1.5 py-0.5 rounded transition-all cursor-pointer"
            >
              {{ language() === 'en' ? 'TE' : 'EN' }}
            </button>

            <!-- Mobile Cart -->
            <a routerLink="/cart" [ngClass]="scrolled() ? 'text-slate-600 hover:text-blue-600' : 'text-slate-300 hover:text-amber-400'" class="relative p-1 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span *ngIf="cartCount() > 0" [ngClass]="scrolled() ? 'bg-blue-600 text-white' : 'bg-amber-50 text-blue-950'" class="absolute -top-1 -right-1 font-extrabold text-[8px] w-4.5 h-4.5 flex items-center justify-center rounded-full">
                {{ cartCount() }}
              </span>
            </a>

            <!-- Mobile Hamburger menu -->
            <button
              (click)="toggleMobileMenu()"
              [ngClass]="scrolled() ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'"
              class="focus:outline-none p-1 cursor-pointer transition-colors"
            >
              <svg *ngIf="!isMobileMenuOpen()" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              <svg *ngIf="isMobileMenuOpen()" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

        </div>
      </div>

      <!-- Mobile Drawer menu -->
      <div *ngIf="isMobileMenuOpen()" 
           [ngClass]="scrolled() ? 'bg-white border-t border-slate-200 text-slate-800' : 'bg-blue-950 border-t border-blue-900 text-white'"
           class="lg:hidden py-4 px-4 space-y-4 shadow-inner animate-fade-in">
        
        <!-- Mobile Search input -->
        <form (submit)="handleSearch($event)" class="relative w-full">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            name="searchQuery"
            [placeholder]="t().searchPlaceholder"
            [ngClass]="scrolled() ? 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200' : 'bg-blue-900/30 text-slate-100 placeholder-slate-400 border border-blue-800'"
            class="w-full rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-xs font-semibold"
          />
          <button type="submit" [ngClass]="scrolled() ? 'text-slate-400 hover:text-blue-600' : 'text-slate-400 hover:text-amber-400'" class="absolute right-3 top-2.5 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </form>

        <!-- Links list -->
        <div class="flex flex-col space-y-3 font-semibold text-sm">
          <a routerLink="/products" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-slate-700 hover:text-blue-600 border-slate-100' : 'text-slate-200 hover:text-amber-400 border-blue-900/50'" class="py-1 border-b transition-colors">{{ t().shop }}</a>
          <a routerLink="/pc-builder" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-slate-700 hover:text-blue-600 border-slate-100' : 'text-slate-200 hover:text-amber-400 border-blue-900/50'" class="py-1 border-b transition-colors">PC Builder</a>
          <a routerLink="/services" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-slate-700 hover:text-blue-600 border-slate-100' : 'text-slate-200 hover:text-amber-400 border-blue-900/50'" class="py-1 border-b transition-colors">Services</a>
          <a routerLink="/track-repair" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-slate-700 hover:text-blue-600 border-slate-100' : 'text-slate-200 hover:text-amber-400 border-blue-900/50'" class="py-1 border-b transition-colors">Track Repair</a>
          <a routerLink="/wishlist" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-slate-700 hover:text-blue-600 border-slate-100' : 'text-slate-200 hover:text-amber-400 border-blue-900/50'" class="py-1 border-b transition-colors flex items-center justify-between">
            <span>{{ t().wishlist }}</span>
            <span *ngIf="wishlistCount() > 0" class="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ wishlistCount() }}</span>
          </a>
          <a routerLink="/about" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-slate-700 hover:text-blue-600 border-slate-100' : 'text-slate-200 hover:text-amber-400 border-blue-900/50'" class="py-1 border-b transition-colors">{{ t().aboutUs }}</a>
          <a routerLink="/contact" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-slate-700 hover:text-blue-600 border-slate-100' : 'text-slate-200 hover:text-amber-400 border-blue-900/50'" class="py-1 border-b transition-colors">{{ t().contactUs }}</a>
          <a routerLink="/faq" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-slate-700 hover:text-blue-600 border-slate-100' : 'text-slate-200 hover:text-amber-400 border-blue-900/50'" class="py-1 border-b transition-colors">{{ t().faq }}</a>
          
          <a *ngIf="user()?.role === 'ADMIN'" routerLink="/admin" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-blue-600 hover:text-blue-700 border-slate-100' : 'text-amber-400 hover:text-amber-300 border-blue-900/50'" class="py-1 border-b transition-colors flex items-center space-x-2 font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            <span>{{ t().adminDashboard }}</span>
          </a>
          <a *ngIf="user()?.role === 'TECHNICIAN' || user()?.role === 'SERVICE_MANAGER'" routerLink="/technician/dashboard" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'text-blue-600 hover:text-blue-700 border-slate-100' : 'text-amber-400 hover:text-amber-300 border-blue-900/50'" class="py-1 border-b transition-colors flex items-center space-x-2 font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>
            <span>Technician Workspace</span>
          </a>
        </div>

        <!-- Mobile Profile & Logout -->
        <div class="pt-2">
          <div *ngIf="user(); else guestMobile" [ngClass]="scrolled() ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-blue-900/20 border-blue-900 text-white'" class="flex items-center justify-between p-3 rounded-lg border">
            <a routerLink="/profile" (click)="closeMobileMenu()" class="flex items-center space-x-2 font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span class="truncate max-w-[150px]">{{ user()?.name }}</span>
            </a>
            <button (click)="handleLogout(); closeMobileMenu()" class="text-rose-500 hover:text-rose-600 flex items-center space-x-1 font-bold text-xs bg-rose-500/10 px-2.5 py-1 rounded cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>{{ t().logout }}</span>
            </button>
          </div>
          <ng-template #guestMobile>
            <a routerLink="/login" (click)="closeMobileMenu()" [ngClass]="scrolled() ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10' : 'bg-amber-50 hover:bg-amber-400 text-blue-950 shadow-amber-500/10'" class="block text-center font-bold py-2.5 rounded-lg transition-all shadow-md">
              {{ t().login }}
            </a>
          </ng-template>
        </div>

      </div>
    </nav>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class NavbarComponent {
  private cartService = inject(CartService);
  private langService = inject(LanguageService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  theme = this.themeService.theme;

  scrolled = signal(false);
  isMobileMenuOpen = signal(false);
  searchQuery = '';

  cartCount = this.cartService.cartCount;
  wishlistCount = computed(() => this.cartService.wishlist().length);
  language = this.langService.language;
  t = this.langService.t;
  user = this.authService.user;

  firstName = computed(() => {
    const name = this.user()?.name || '';
    return name.split(' ')[0];
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll);
    }

    // Sync search input with router queries
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
    });
  }

  handleScroll = () => {
    this.scrolled.set(window.scrollY > 20);
  };

  toggleMobileMenu() {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  toggleLanguage() {
    this.langService.setLanguage(this.language() === 'en' ? 'te' : 'en');
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  handleSearch(e: Event) {
    e.preventDefault();
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { q: this.searchQuery.trim() } });
    } else {
      this.router.navigate(['/products']);
    }
    this.closeMobileMenu();
  }

  async handleLogout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
