import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/homepage/homepage').then(m => m.HomepageComponent) 
  },
  { 
    path: 'products', 
    loadComponent: () => import('./components/shop/shop').then(m => m.ShopComponent) 
  },
  { 
    path: 'pc-builder', 
    loadComponent: () => import('./components/pc-builder/pc-builder').then(m => m.PcBuilderComponent) 
  },
  { 
    path: 'products/:id', 
    loadComponent: () => import('./components/product-detail/product-detail').then(m => m.ProductDetailComponent) 
  },
  { 
    path: 'cart', 
    loadComponent: () => import('./components/cart/cart').then(m => m.CartComponent) 
  },
  { 
    path: 'checkout', 
    loadComponent: () => import('./components/checkout/checkout').then(m => m.CheckoutComponent) 
  },
  { 
    path: 'checkout/success', 
    loadComponent: () => import('./components/success/success').then(m => m.SuccessComponent) 
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./components/profile/profile').then(m => m.ProfileComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent) 
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) 
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPasswordComponent) 
  },
  { 
    path: 'verify-email', 
    loadComponent: () => import('./components/verify-email/verify-email').then(m => m.VerifyEmailComponent) 
  },
  { 
    path: 'wishlist', 
    loadComponent: () => import('./components/wishlist/wishlist').then(m => m.WishlistComponent) 
  },
  { 
    path: 'services/book', 
    loadComponent: () => import('./components/service-booking/service-booking').then(m => m.ServiceBookingComponent) 
  },
  { 
    path: 'request-quote', 
    loadComponent: () => import('./components/request-quote/request-quote').then(m => m.RequestQuoteComponent) 
  },
  { 
    path: 'bulk-order', 
    loadComponent: () => import('./components/bulk-order/bulk-order').then(m => m.BulkOrderComponent) 
  },
  { 
    path: 'warranty', 
    loadComponent: () => import('./components/warranty/warranty').then(m => m.WarrantyComponent) 
  },
  
  // Admin Dashboard routes
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin').then(m => m.AdminComponent),
    children: [
      { 
        path: '', 
        loadComponent: () => import('./components/admin/analytics/analytics').then(m => m.AdminAnalyticsComponent) 
      },
      { 
        path: 'orders', 
        loadComponent: () => import('./components/admin/orders/orders').then(m => m.AdminOrdersComponent) 
      },
      { 
        path: 'products', 
        loadComponent: () => import('./components/admin/products/products').then(m => m.AdminProductsComponent) 
      },
      { 
        path: 'categories', 
        loadComponent: () => import('./components/admin/categories/categories').then(m => m.AdminCategoriesComponent) 
      },
      { 
        path: 'services', 
        loadComponent: () => import('./components/admin/services/services').then(m => m.AdminServicesComponent) 
      },
      { 
        path: 'quotes', 
        loadComponent: () => import('./components/admin/quotes/quotes').then(m => m.AdminQuotesComponent) 
      },
      { 
        path: 'bulk-orders', 
        loadComponent: () => import('./components/admin/bulk-orders/bulk-orders').then(m => m.AdminBulkOrdersComponent) 
      },
      { 
        path: 'coupons', 
        loadComponent: () => import('./components/admin/coupons/coupons').then(m => m.AdminCouponsComponent) 
      },
      { 
        path: 'vendors', 
        loadComponent: () => import('./components/admin/vendors/vendors').then(m => m.AdminVendorsComponent) 
      },
      { 
        path: 'expenses', 
        loadComponent: () => import('./components/admin/expenses/expenses').then(m => m.AdminExpensesComponent) 
      },
      { 
        path: 'warranties', 
        loadComponent: () => import('./components/admin/warranties/warranties').then(m => m.AdminWarrantiesComponent) 
      },
      { 
        path: 'audit', 
        loadComponent: () => import('./components/admin/audit/audit').then(m => m.AdminAuditComponent) 
      },
    ]
  },
  
  // Redirect unknown routes to home
  { path: '**', redirectTo: '' }
];
