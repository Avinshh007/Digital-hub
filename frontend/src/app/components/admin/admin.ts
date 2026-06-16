// src/app/components/admin/admin.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-100 flex flex-col md:flex-row pt-16">
      
      <!-- Sidebar Drawer -->
      <aside class="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 border-r border-slate-800">
        <div class="p-6 border-b border-slate-800 flex items-center justify-between">
          <span class="text-white font-black tracking-tight text-base uppercase">Admin Panel</span>
        </div>

        <nav class="p-4 space-y-2 font-bold text-sm">
          <a routerLink="/admin" routerLinkActive="bg-indigo-600 text-white" [routerLinkActiveOptions]="{exact: true}" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span>Analytics Dashboard</span>
          </a>
          <a routerLink="/admin/products" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            <span>Inventory Management</span>
          </a>
          <a routerLink="/admin/categories" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            <span>Categories Catalog</span>
          </a>
          <a routerLink="/admin/orders" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            <span>Orders Fulfillment</span>
          </a>
          <a routerLink="/admin/services" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span>Service Requests</span>
          </a>
          <a routerLink="/admin/quotes" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span>Quotes Management</span>
          </a>
          <a routerLink="/admin/bulk-orders" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Bulk Order Inquiries</span>
          </a>
          <a routerLink="/admin/coupons" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            <span>Promotions & Coupons</span>
          </a>
          <a routerLink="/admin/vendors" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Vendors & POs</span>
          </a>
          <a routerLink="/admin/expenses" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <span>Expenses & P&L</span>
          </a>
          <a routerLink="/admin/warranties" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>Warranties & AMC</span>
          </a>
          <a routerLink="/admin/audit" routerLinkActive="bg-indigo-600 text-white" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Activity Audit Logs</span>
          </a>
          
          <div class="border-t border-slate-800 my-4 pt-4">
            <a routerLink="/" class="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Back to Storefront</span>
            </a>
          </div>
        </nav>
      </aside>

      <!-- Main Dashboard view -->
      <main class="flex-grow p-6 sm:p-10 overflow-y-auto">
        <router-outlet></router-outlet>
      </main>

    </div>
  `
})
export class AdminComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // Protect route: Verify user role is ADMIN
    const user = this.authService.user();
    if (!user || user.role !== 'ADMIN') {
      alert('Access Forbidden: Administrator rights required.');
      this.router.navigate(['/']);
    }
  }
}
