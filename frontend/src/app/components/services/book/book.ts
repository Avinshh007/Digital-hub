import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TicketService } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-services-book',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './book.html',
})
export class ServicesBookComponent implements OnInit {
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  // Form fields
  customerName = '';
  mobileNumber = '';
  email = '';
  deviceType = 'LAPTOP'; // Default
  brand = '';
  model = '';
  serialNumber = '';
  problemDescription = '';

  loading = signal(false);
  successTicketNumber = signal<string | null>(null);
  error = signal<string | null>(null);

  ngOnInit() {
    // Prefill user details if logged in
    const user = this.authService.user();
    if (user) {
      this.customerName = user.name || '';
      this.email = user.email || '';
    }

    // Prefill device type from query params if available
    this.route.queryParams.subscribe(params => {
      const type = params['type'];
      if (type) {
        this.deviceType = type.toUpperCase();
      }
    });
  }

  async handleBooking(e: Event) {
    e.preventDefault();
    if (!this.customerName || !this.mobileNumber || !this.deviceType || !this.brand || !this.model || !this.problemDescription) {
      this.error.set('Please fill out all required fields.');
      return;
    }

    this.loading.set(true);
    this.successTicketNumber.set(null);
    this.error.set(null);

    try {
      const res = await this.ticketService.createServiceTicket({
        customerName: this.customerName.trim(),
        mobileNumber: this.mobileNumber.trim(),
        email: this.email ? this.email.trim() : undefined,
        deviceType: this.deviceType,
        brand: this.brand.trim(),
        model: this.model.trim(),
        serialNumber: this.serialNumber ? this.serialNumber.trim() : undefined,
        problemDescription: this.problemDescription.trim()
      });

      this.successTicketNumber.set(res.ticket.ticketNumber);
      
      // Clear form except contact details
      this.brand = '';
      this.model = '';
      this.serialNumber = '';
      this.problemDescription = '';

    } catch (err: any) {
      this.error.set(err.error || 'Failed to submit service booking. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
