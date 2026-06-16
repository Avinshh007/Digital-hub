// src/app/components/service-booking/service-booking.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ServiceBookingService } from '../../services/service-booking.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-service-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './service-booking.html',
})
export class ServiceBookingComponent implements OnInit {
  private bookingService = inject(ServiceBookingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private langService = inject(LanguageService);

  // Form fields
  customerName = '';
  mobileNumber = '';
  deviceType = 'LAPTOP'; // Default
  problemDescription = '';
  preferredDate = '';

  loading = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  t = this.langService.t;
  user = this.authService.user;

  ngOnInit() {
    if (this.authService.user()) {
      this.customerName = this.authService.user()!.name;
    }
  }

  async handleBooking(e: Event) {
    e.preventDefault();
    if (!this.customerName || !this.mobileNumber || !this.deviceType || !this.problemDescription || !this.preferredDate) {
      this.error.set('Please fill out all booking fields.');
      return;
    }

    this.loading.set(true);
    this.success.set(null);
    this.error.set(null);

    try {
      const res = await this.bookingService.createBooking({
        customerName: this.customerName.trim(),
        mobileNumber: this.mobileNumber.trim(),
        deviceType: this.deviceType,
        problemDescription: this.problemDescription.trim(),
        preferredDate: this.preferredDate
      });
      this.success.set('Your service request has been booked successfully!');
      
      // Clear form
      this.problemDescription = '';
      this.preferredDate = '';
      
      setTimeout(() => {
        if (this.authService.user()) {
          this.router.navigate(['/profile']);
        } else {
          this.router.navigate(['/']);
        }
      }, 3000);

    } catch (err: any) {
      this.error.set(err.error || 'Failed to submit service booking.');
    } finally {
      this.loading.set(false);
    }
  }
}
