// src/app/components/bulk-order/bulk-order.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { BulkOrderService } from '../../services/bulk-order.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-bulk-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './bulk-order.html',
})
export class BulkOrderComponent implements OnInit {
  private bulkService = inject(BulkOrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private langService = inject(LanguageService);

  // Form fields
  organizationName = '';
  contactName = '';
  email = '';
  phone = '';
  quantity = 10;
  requirements = '';

  loading = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  t = this.langService.t;

  ngOnInit() {
    if (this.authService.user()) {
      this.contactName = this.authService.user()!.name;
      this.email = this.authService.user()!.email;
    }
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.organizationName || !this.contactName || !this.email || !this.phone || !this.quantity || !this.requirements) {
      this.error.set('Please fill out all required fields.');
      return;
    }

    this.loading.set(true);
    this.success.set(null);
    this.error.set(null);

    try {
      await this.bulkService.submitBulkOrder({
        organizationName: this.organizationName.trim(),
        contactName: this.contactName.trim(),
        email: this.email.toLowerCase().trim(),
        phone: this.phone.trim(),
        quantity: this.quantity,
        requirements: this.requirements.trim()
      });
      this.success.set('Your bulk order inquiry has been submitted. Our enterprise sales team will contact you shortly.');
      
      // Clear form
      this.organizationName = '';
      this.requirements = '';
      
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 3000);

    } catch (err: any) {
      this.error.set(err.error || 'Failed to submit bulk inquiry.');
    } finally {
      this.loading.set(false);
    }
  }
}
