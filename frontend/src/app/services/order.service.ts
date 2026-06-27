// src/app/services/order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  gstAmount: number;
  product?: {
    name: string;
    images: string;
    sku: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  status: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  shippingAddress: string; // JSON string
  trackingNumber?: string;
  courierName?: string;
  couponCode?: string;
  items?: OrderItem[];
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // POST /api/orders
  async placeOrder(orderData: {
    items: { productId: string; quantity: number }[];
    shippingAddress: {
      fullName: string;
      street: string;
      city: string;
      state: string;
      pinCode: string;
      phone: string;
    };
    paymentMethod: 'COD' | 'ONLINE';
    couponCode?: string | null;
  }): Promise<{ message: string; order: Order }> {
    return firstValueFrom(
      this.http.post<{ message: string; order: Order }>(`${this.apiUrl}/orders`, orderData, { withCredentials: true })
    );
  }

  // GET /api/orders
  async getOrders(): Promise<{ orders: Order[] }> {
    return firstValueFrom(
      this.http.get<{ orders: Order[] }>(`${this.apiUrl}/orders`, { withCredentials: true })
    );
  }

  // GET /api/orders/:id
  async getOrderById(id: string): Promise<Order> {
    const res = await firstValueFrom(
      this.http.get<{ order: Order }>(`${this.apiUrl}/orders/${id}`, { withCredentials: true })
    );
    return res.order;
  }

  // PUT /api/orders/:id (Admin update logs)
  async updateOrder(id: string, updateData: {
    status?: string;
    paymentStatus?: string;
    trackingNumber?: string | null;
    courierName?: string | null;
  }): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/orders/${id}`, updateData, { withCredentials: true })
    );
  }

  // GET /api/admin/analytics (Admin analytics metrics)
  async getAnalytics(): Promise<any> {
    return firstValueFrom(
      this.http.get(`${this.apiUrl}/admin/analytics`, { withCredentials: true })
    );
  }
}
