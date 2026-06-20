// src/app/components/checkout/checkout.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { AddressService, Address } from '../../services/address.service';
import { LanguageService } from '../../services/language.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './checkout.html',
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private addressService = inject(AddressService);
  private langService = inject(LanguageService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Bind cart values
  items = this.cartService.items;
  subtotal = this.cartService.subtotal;
  tax = this.cartService.tax;
  discount = this.cartService.discount;
  total = this.cartService.total;
  coupon = this.cartService.coupon;

  t = this.langService.t;
  user = this.authService.user;

  // Saved Addresses State
  addresses = signal<Address[]>([]);
  selectedAddressId = signal<string>('new');

  // Form State
  fullName = '';
  street = '';
  city = '';
  state = '';
  pinCode = '';
  phone = '';
  paymentMethod: 'COD' | 'ONLINE' = 'COD';

  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    // Check if cart is empty
    if (this.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    // Check auth session
    if (!this.authService.user()) {
      alert('Please login to proceed to checkout.');
      this.router.navigate(['/login']);
      return;
    }

    // Prepopulate name
    this.fullName = this.authService.user()!.name;

    // Load customer addresses
    this.loadAddresses();
  }

  async loadAddresses() {
    try {
      const res = await this.addressService.getAddresses();
      this.addresses.set(res.addresses || []);
      
      // Auto-select default address
      const defaultAddr = res.addresses.find(a => a.isDefault);
      if (defaultAddr) {
        this.selectedAddressId.set(defaultAddr.id);
        this.prepopulateAddressFields(defaultAddr);
      }
    } catch (e) {
      console.error('Failed to load user addresses', e);
    }
  }

  onAddressChange() {
    const id = this.selectedAddressId();
    if (id === 'new') {
      this.fullName = this.authService.user()!.name;
      this.street = '';
      this.city = '';
      this.state = '';
      this.pinCode = '';
      this.phone = '';
    } else {
      const addr = this.addresses().find(a => a.id === id);
      if (addr) {
        this.prepopulateAddressFields(addr);
      }
    }
  }

  prepopulateAddressFields(addr: Address) {
    this.fullName = addr.fullName;
    this.street = `${addr.houseNumber}, ${addr.street}${addr.landmark ? ', ' + addr.landmark : ''}`;
    this.city = addr.city;
    this.state = addr.state;
    this.pinCode = addr.pinCode;
    this.phone = addr.phone;
  }

  async handlePlaceOrder(e: Event) {
    e.preventDefault();
    this.loading.set(true);
    this.error.set(null);

    const shippingAddress = {
      fullName: this.fullName.trim(),
      street: this.street.trim(),
      city: this.city.trim(),
      state: this.state.trim(),
      pinCode: this.pinCode.trim(),
      phone: this.phone.trim(),
    };

    if (!shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pinCode || !shippingAddress.phone) {
      this.error.set('Please fill out all address details.');
      this.loading.set(false);
      return;
    }

    if (this.paymentMethod === 'COD') {
      // Direct Cash on Delivery placement
      try {
        const res = await this.orderService.placeOrder({
          items: this.items().map((i) => ({ productId: i.id, quantity: i.quantity })),
          shippingAddress,
          paymentMethod: 'COD',
          couponCode: this.coupon()?.code || null,
        });
        this.cartService.clearCart();
        this.router.navigate(['/checkout/success'], { queryParams: { orderId: res.order.id } });
      } catch (err: any) {
        this.error.set(err.error || 'Failed to place order. Review stock availability.');
      } finally {
        this.loading.set(false);
      }
    } else {
      // ONLINE Payment flow (Razorpay)
      try {
        const loaded = await this.loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load payment gateway script.');
        }

        // 1. Create Razorpay transaction order
        const rzpOrder = await firstValueFrom(
          this.http.post<any>(`${this.apiUrl}/payments/create-order`, {
            items: this.items().map((i) => ({ productId: i.id, quantity: i.quantity })),
            couponCode: this.coupon()?.code || null
          }, { withCredentials: true })
        );

        // 2. Configure and Open Razorpay Checkout modal
        const options = {
          key: rzpOrder.key_id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: ' DIGITAL HUB',
          description: 'Payment for Order Purchase',
          order_id: rzpOrder.razorpayOrderId,
          handler: async (response: any) => {
            // Callback: verify payment signature on backend
            this.loading.set(true);
            try {
              const verifyRes = await firstValueFrom(
                this.http.post<any>(`${this.apiUrl}/payments/verify`, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData: {
                    items: this.items().map((i) => ({ productId: i.id, quantity: i.quantity })),
                    shippingAddress,
                    couponCode: this.coupon()?.code || null
                  }
                }, { withCredentials: true })
              );
              this.cartService.clearCart();
              this.router.navigate(['/checkout/success'], { queryParams: { orderId: verifyRes.order.id } });
            } catch (verErr: any) {
              this.error.set(verErr.error || 'Payment signature verification failed.');
            } finally {
              this.loading.set(false);
            }
          },
          prefill: {
            name: this.fullName,
            email: this.authService.user()?.email || '',
            contact: this.phone
          },
          theme: {
            color: '#0f4c81'
          },
          modal: {
            ondismiss: () => {
              this.loading.set(false);
              this.error.set('Payment was cancelled by the customer.');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();

      } catch (err: any) {
        this.error.set(err.error || err.message || 'Payment initiation failed.');
        this.loading.set(false);
      }
    }
  }

  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
}
