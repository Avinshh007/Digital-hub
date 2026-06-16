// src/app/components/request-quote/request-quote.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { QuoteRequestService } from '../../services/quote-request.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-request-quote',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './request-quote.html',
})
export class RequestQuoteComponent implements OnInit {
  private quoteService = inject(QuoteRequestService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private langService = inject(LanguageService);

  // Form fields
  customerName = '';
  email = '';
  phone = '';
  requirements = '';
  documentUrl = ''; // Mock document upload path

  loading = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  t = this.langService.t;

  ngOnInit() {
    if (this.authService.user()) {
      this.customerName = this.authService.user()!.name;
      this.email = this.authService.user()!.email;
    }
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.customerName || !this.email || !this.phone || !this.requirements) {
      this.error.set('Please fill out all required fields.');
      return;
    }

    this.loading.set(true);
    this.success.set(null);
    this.error.set(null);

    try {
      await this.quoteService.submitQuote({
        customerName: this.customerName.trim(),
        email: this.email.toLowerCase().trim(),
        phone: this.phone.trim(),
        requirements: this.requirements.trim(),
        documentUrl: this.documentUrl || undefined
      });
      this.success.set('Your quotation request has been submitted. Our sales team will get back to you shortly.');
      
      // Clear form
      this.requirements = '';
      this.documentUrl = '';
      
      setTimeout(() => {
        if (this.authService.user()) {
          this.router.navigate(['/profile']);
        } else {
          this.router.navigate(['/']);
        }
      }, 3000);

    } catch (err: any) {
      this.error.set(err.error || 'Failed to submit quote request.');
    } finally {
      this.loading.set(false);
    }
  }
}
