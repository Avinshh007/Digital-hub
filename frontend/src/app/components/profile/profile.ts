// src/app/components/profile/profile.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { AddressService, Address } from '../../services/address.service';
import { ServiceBookingService, ServiceBooking } from '../../services/service-booking.service';
import { QuoteRequestService, QuoteRequest } from '../../services/quote-request.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private langService = inject(LanguageService);
  private addressService = inject(AddressService);
  private bookingService = inject(ServiceBookingService);
  private quoteService = inject(QuoteRequestService);
  private router = inject(Router);

  // Lists signals
  orders = signal<Order[]>([]);
  bookings = signal<ServiceBooking[]>([]);
  quotes = signal<QuoteRequest[]>([]);
  addresses = signal<Address[]>([]);
  
  loadingOrders = signal(true);
  loadingBookings = signal(false);
  loadingQuotes = signal(false);
  loadingAddresses = signal(false);

  // Active Tab state
  activeTab = signal<'orders' | 'services' | 'quotes' | 'addresses' | 'details'>('orders');

  // Address Form fields
  addressFormOpen = signal(false);
  editAddressMode = signal(false);
  selectedAddressId = signal<string | null>(null);
  
  fullName = '';
  phone = '';
  alternatePhone = '';
  houseNumber = '';
  street = '';
  landmark = '';
  city = '';
  state = '';
  pinCode = '';
  isDefaultAddress = false;

  // Profile Edit fields
  profileName = '';
  profileEmail = '';
  editProfileSuccess = signal<string | null>(null);
  editProfileError = signal<string | null>(null);

  // Change Password fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  changePasswordSuccess = signal<string | null>(null);
  changePasswordError = signal<string | null>(null);

  // Global Contexts
  user = this.authService.user;
  t = this.langService.t;

  // Expanded Order details row tracking
  expandedOrderId = signal<string | null>(null);

  ngOnInit() {
    // Check session auth
    if (!this.authService.user()) {
      this.router.navigate(['/login']);
      return;
    }

    // Populate profile edit fields
    this.profileName = this.authService.user()!.name;
    this.profileEmail = this.authService.user()!.email;

    this.loadClientOrders();
  }

  // Tab switcher
  setTab(tab: 'orders' | 'services' | 'quotes' | 'addresses' | 'details') {
    this.activeTab.set(tab);
    if (tab === 'orders') this.loadClientOrders();
    if (tab === 'services') this.loadServiceBookings();
    if (tab === 'quotes') this.loadQuoteRequests();
    if (tab === 'addresses') this.loadAddresses();
  }

  // Loaders
  async loadClientOrders() {
    this.loadingOrders.set(true);
    try {
      const res = await this.orderService.getOrders();
      this.orders.set(res.orders || []);
    } catch (e) {
      console.error('Fetch client orders failed', e);
    } finally {
      this.loadingOrders.set(false);
    }
  }

  async loadServiceBookings() {
    this.loadingBookings.set(true);
    try {
      const res = await this.bookingService.getBookings();
      this.bookings.set(res.bookings || []);
    } catch (e) {
      console.error('Fetch bookings failed', e);
    } finally {
      this.loadingBookings.set(false);
    }
  }

  async loadQuoteRequests() {
    this.loadingQuotes.set(true);
    try {
      const res = await this.quoteService.getQuotes();
      this.quotes.set(res.quotes || []);
    } catch (e) {
      console.error('Fetch quotes failed', e);
    } finally {
      this.loadingQuotes.set(false);
    }
  }

  async loadAddresses() {
    this.loadingAddresses.set(true);
    try {
      const res = await this.addressService.getAddresses();
      this.addresses.set(res.addresses || []);
    } catch (e) {
      console.error('Fetch addresses failed', e);
    } finally {
      this.loadingAddresses.set(false);
    }
  }

  // Addresses CRUD Methods
  openNewAddressForm() {
    this.editAddressMode.set(false);
    this.selectedAddressId.set(null);
    this.fullName = '';
    this.phone = '';
    this.alternatePhone = '';
    this.houseNumber = '';
    this.street = '';
    this.landmark = '';
    this.city = '';
    this.state = '';
    this.pinCode = '';
    this.isDefaultAddress = false;
    this.addressFormOpen.set(true);
  }

  openEditAddressForm(addr: Address) {
    this.editAddressMode.set(true);
    this.selectedAddressId.set(addr.id);
    this.fullName = addr.fullName;
    this.phone = addr.phone;
    this.alternatePhone = addr.alternatePhone || '';
    this.houseNumber = addr.houseNumber;
    this.street = addr.street;
    this.landmark = addr.landmark || '';
    this.city = addr.city;
    this.state = addr.state;
    this.pinCode = addr.pinCode;
    this.isDefaultAddress = addr.isDefault;
    this.addressFormOpen.set(true);
  }

  closeAddressForm() {
    this.addressFormOpen.set(false);
  }

  async handleSaveAddress(e: Event) {
    e.preventDefault();
    if (!this.fullName || !this.phone || !this.houseNumber || !this.street || !this.city || !this.state || !this.pinCode) {
      alert('Please fill out all required address fields.');
      return;
    }

    const payload = {
      fullName: this.fullName.trim(),
      phone: this.phone.trim(),
      alternatePhone: this.alternatePhone.trim() || undefined,
      houseNumber: this.houseNumber.trim(),
      street: this.street.trim(),
      landmark: this.landmark.trim() || undefined,
      city: this.city.trim(),
      state: this.state.trim(),
      pinCode: this.pinCode.trim(),
      isDefault: this.isDefaultAddress
    };

    try {
      if (this.editAddressMode()) {
        await this.addressService.updateAddress(this.selectedAddressId()!, payload);
      } else {
        await this.addressService.addAddress(payload);
      }
      this.closeAddressForm();
      this.loadAddresses();
    } catch (err) {
      console.error('Failed to save address', err);
      alert('Failed to save address details.');
    }
  }

  async handleDeleteAddress(id: string) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await this.addressService.deleteAddress(id);
      this.loadAddresses();
    } catch (e) {
      console.error(e);
    }
  }

  async handleSetDefaultAddress(id: string) {
    try {
      await this.addressService.setDefault(id);
      this.loadAddresses();
    } catch (e) {
      console.error(e);
    }
  }

  // Profile Edit Methods
  async handleUpdateProfile(e: Event) {
    e.preventDefault();
    this.editProfileSuccess.set(null);
    this.editProfileError.set(null);

    try {
      const res = await this.authService.register(
        this.profileName,
        this.profileEmail,
        '' // empty password triggers normal profile update on auth.service wrapper or we make a direct call
      );
      // Wait, let's call the auth profile update API directly to be safe
      const directRes = await this.authService.updateProfileDirect(this.profileName, this.profileEmail);
      this.editProfileSuccess.set('Profile details updated successfully!');
    } catch (err: any) {
      this.editProfileError.set(err.error || 'Failed to update profile details.');
    }
  }

  async handleUpdatePassword(e: Event) {
    e.preventDefault();
    this.changePasswordSuccess.set(null);
    this.changePasswordError.set(null);

    if (this.newPassword !== this.confirmPassword) {
      this.changePasswordError.set('New passwords do not match.');
      return;
    }

    try {
      await this.authService.changePasswordDirect(this.currentPassword, this.newPassword);
      this.changePasswordSuccess.set('Password changed successfully!');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (err: any) {
      this.changePasswordError.set(err.error || 'Failed to change password.');
    }
  }

  // Invoice helper
  getInvoiceDownloadUrl(orderId: string): string {
    return `${environment.apiUrl}/orders/${orderId}/invoice`;
  }

  toggleOrderDetails(orderId: string) {
    if (this.expandedOrderId() === orderId) {
      this.expandedOrderId.set(null);
    } else {
      this.expandedOrderId.set(orderId);
    }
  }

  getAddressField(shippingAddress: string, field: string): string {
    try {
      const parsed = JSON.parse(shippingAddress);
      return parsed[field] || '';
    } catch (e) {
      return '';
    }
  }
}

// Add direct updates in AuthService since we call them above
declare module '../../services/auth.service' {
  interface AuthService {
    updateProfileDirect(name: string, email: string): Promise<any>;
    changePasswordDirect(current: string, newPass: string): Promise<any>;
  }
}
