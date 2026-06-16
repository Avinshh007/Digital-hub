// src/app/components/admin/quotes/quotes.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteRequestService, QuoteRequest } from '../../../services/quote-request.service';

@Component({
  selector: 'app-admin-quotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotes.html',
})
export class AdminQuotesComponent implements OnInit {
  private quoteService = inject(QuoteRequestService);

  quotes = signal<QuoteRequest[]>([]);
  loading = signal(true);

  // Modal response pricing state
  activeQuote = signal<QuoteRequest | null>(null);
  customPricing = 0;

  ngOnInit() {
    this.fetchQuotes();
  }

  async fetchQuotes() {
    this.loading.set(true);
    try {
      const res = await this.quoteService.getQuotes();
      this.quotes.set(res.quotes || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  openPricingModal(quote: QuoteRequest) {
    this.activeQuote.set(quote);
    this.customPricing = quote.customPricing || 0;
  }

  closePricingModal() {
    this.activeQuote.set(null);
  }

  async handleSavePricing() {
    const quote = this.activeQuote();
    if (!quote || this.customPricing <= 0) return;

    try {
      await this.quoteService.updateQuote(quote.id, {
        customPricing: this.customPricing,
        status: 'RESPONDED'
      });
      this.closePricingModal();
      this.fetchQuotes(); // reload
    } catch (err) {
      console.error(err);
      alert('Failed to update quote price.');
    }
  }

  async handleCloseQuote(id: string) {
    if (!confirm('Are you sure you want to close this quote request?')) return;
    try {
      await this.quoteService.updateQuote(id, { status: 'CLOSED' });
      this.fetchQuotes();
    } catch (e) {
      console.error(e);
    }
  }
}
