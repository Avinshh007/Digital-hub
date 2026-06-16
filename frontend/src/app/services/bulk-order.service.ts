// src/app/services/bulk-order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BulkOrder {
  id: string;
  organizationName: string;
  contactName: string;
  email: string;
  phone: string;
  quantity: number;
  requirements: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class BulkOrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  async submitBulkOrder(bulkData: {
    organizationName: string;
    contactName: string;
    email: string;
    phone: string;
    quantity: number;
    requirements: string;
  }): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/bulk-orders`, bulkData)
    );
  }

  async getBulkOrders(): Promise<{ bulkOrders: BulkOrder[] }> {
    return firstValueFrom(
      this.http.get<{ bulkOrders: BulkOrder[] }>(`${this.apiUrl}/admin/bulk-orders`, { withCredentials: true })
    );
  }
}
