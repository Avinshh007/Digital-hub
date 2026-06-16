// src/app/services/service-booking.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ServiceBooking {
  id: string;
  customerName: string;
  mobileNumber: string;
  deviceType: string;
  problemDescription: string;
  preferredDate: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceBookingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  async createBooking(bookingData: {
    customerName: string;
    mobileNumber: string;
    deviceType: string;
    problemDescription: string;
    preferredDate: string;
  }): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/services/bookings`, bookingData, { withCredentials: true })
    );
  }

  async getBookings(): Promise<{ bookings: ServiceBooking[] }> {
    return firstValueFrom(
      this.http.get<{ bookings: ServiceBooking[] }>(`${this.apiUrl}/services/bookings`, { withCredentials: true })
    );
  }

  // Admin method
  async updateBookingStatus(id: string, status: string): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/admin/services/${id}`, { status }, { withCredentials: true })
    );
  }
}
