// src/app/components/admin/orders/orders.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../../services/order.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.html',
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  searchQuery = '';
  updatingOrderId = signal<string | null>(null);

  // Buffer state arrays for order updates
  tempStatus: { [key: string]: string } = {};
  tempPaymentStatus: { [key: string]: string } = {};
  tempTracking: { [key: string]: string } = {};

  // Detail panel expansion
  expandedOrderId = signal<string | null>(null);

  ngOnInit() {
    this.fetchOrdersList();
  }

  async fetchOrdersList() {
    this.loading.set(true);
    try {
      const res = await this.orderService.getOrders();
      this.orders.set(res.orders || []);

      // Populate buffers
      for (const order of res.orders || []) {
        this.tempStatus[order.id] = order.status;
        this.tempPaymentStatus[order.id] = order.paymentStatus;
        this.tempTracking[order.id] = order.trackingNumber || '';
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  get filteredOrders(): Order[] {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.orders();

    return this.orders().filter((order) =>
      order.id.toLowerCase().includes(query) ||
      (order.user?.name || '').toLowerCase().includes(query) ||
      (order.user?.email || '').toLowerCase().includes(query)
    );
  }

  toggleOrderExpand(orderId: string) {
    if (this.expandedOrderId() === orderId) {
      this.expandedOrderId.set(null);
    } else {
      this.expandedOrderId.set(orderId);
    }
  }

  getAddressField(shippingAddress: string, field: string): string {
    try {
      const parsed = JSON.parse(shippingAddress);
      return parsed[field] || '';
    } catch (e) {
      return '';
    }
  }

  // Update logistics logs
  async handleUpdate(id: string) {
    this.updatingOrderId.set(id);
    try {
      await this.orderService.updateOrder(id, {
        status: this.tempStatus[id],
        paymentStatus: this.tempPaymentStatus[id],
        trackingNumber: this.tempTracking[id] || null,
      });
      alert('Order status log updated successfully!');
      this.fetchOrdersList();
    } catch (e) {
      console.error(e);
      alert('Failed to update order details.');
    } finally {
      this.updatingOrderId.set(null);
    }
  }

  handleInputChange(id: string, field: 'status' | 'pay' | 'track', value: string) {
    if (field === 'status') this.tempStatus[id] = value;
    if (field === 'pay') this.tempPaymentStatus[id] = value;
    if (field === 'track') this.tempTracking[id] = value;
  }
}
