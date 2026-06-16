// src/app/services/quote-request.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QuoteRequest {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  requirements: string;
  documentUrl?: string;
  customPricing?: number;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class QuoteRequestService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  async submitQuote(quoteData: {
    customerName: string;
    email: string;
    phone: string;
    requirements: string;
    documentUrl?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/quotes`, quoteData, { withCredentials: true })
    );
  }

  async getQuotes(): Promise<{ quotes: QuoteRequest[] }> {
    return firstValueFrom(
      this.http.get<{ quotes: QuoteRequest[] }>(`${this.apiUrl}/quotes`, { withCredentials: true })
    );
  }

  // Admin response
  async updateQuote(id: string, updateData: { customPricing?: number; status?: string }): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/admin/quotes/${id}`, updateData, { withCredentials: true })
    );
  }
}
