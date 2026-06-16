// src/app/components/admin/bulk-orders/bulk-orders.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulkOrderService, BulkOrder } from '../../../services/bulk-order.service';

@Component({
  selector: 'app-admin-bulk-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-orders.html',
})
export class AdminBulkOrdersComponent implements OnInit {
  private bulkService = inject(BulkOrderService);

  bulkOrders = signal<BulkOrder[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.fetchBulkOrders();
  }

  async fetchBulkOrders() {
    this.loading.set(true);
    try {
      const res = await this.bulkService.getBulkOrders();
      this.bulkOrders.set(res.bulkOrders || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }
}
