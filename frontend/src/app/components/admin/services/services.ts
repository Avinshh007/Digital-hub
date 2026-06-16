// src/app/components/admin/services/services.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceBookingService, ServiceBooking } from '../../../services/service-booking.service';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.html',
})
export class AdminServicesComponent implements OnInit {
  private bookingService = inject(ServiceBookingService);

  bookings = signal<ServiceBooking[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.fetchBookings();
  }

  async fetchBookings() {
    this.loading.set(true);
    try {
      const res = await this.bookingService.getBookings();
      this.bookings.set(res.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async handleStatusChange(id: string, newStatus: string) {
    try {
      await this.bookingService.updateBookingStatus(id, newStatus);
      this.fetchBookings(); // Reload list
    } catch (err) {
      console.error(err);
      alert('Failed to update booking status.');
    }
  }
}
