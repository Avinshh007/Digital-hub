// src/app/components/admin/coupons/coupons.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.html',
})
export class AdminCouponsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/coupons`;

  coupons = signal<Coupon[]>([]);
  loading = signal(true);

  // Form State
  formOpen = signal(false);
  code = '';
  discountType = 'PERCENTAGE';
  discountValue = 10;
  minOrderValue = 500;
  maxDiscount = 0;
  expiresAt = '';

  ngOnInit() {
    this.fetchCoupons();
  }

  async fetchCoupons() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<Coupon[]>(this.apiUrl, { withCredentials: true })
      );
      this.coupons.set(res || []);
    } catch (e) {
      console.error('Fetch coupons failed', e);
    } finally {
      this.loading.set(false);
    }
  }

  openAddForm() {
    this.code = '';
    this.discountType = 'PERCENTAGE';
    this.discountValue = 10;
    this.minOrderValue = 500;
    this.maxDiscount = 0;
    // Set default expiry date to 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    this.expiresAt = nextWeek.toISOString().split('T')[0];
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
  }

  async handleSave(e: Event) {
    e.preventDefault();
    if (!this.code || !this.discountType || this.discountValue <= 0 || !this.expiresAt) return;

    const payload = {
      code: this.code.trim().toUpperCase(),
      discountType: this.discountType,
      discountValue: parseFloat(this.discountValue.toString()),
      minOrderValue: parseFloat(this.minOrderValue.toString()) || 0,
      maxDiscount: this.maxDiscount > 0 ? parseFloat(this.maxDiscount.toString()) : undefined,
      expiresAt: new Date(this.expiresAt).toISOString()
    };

    try {
      await firstValueFrom(
        this.http.post(this.apiUrl, payload, { withCredentials: true })
      );
      this.closeForm();
      this.fetchCoupons();
    } catch (err: any) {
      alert(err.error?.error || 'Failed to create coupon.');
    }
  }

  async handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true })
      );
      this.fetchCoupons();
    } catch (e) {
      console.error(e);
      alert('Failed to delete coupon.');
    }
  }
}
