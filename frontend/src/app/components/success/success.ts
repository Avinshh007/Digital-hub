// src/app/components/success/success.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OrderService, Order, OrderItem } from '../../services/order.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './success.html',
})
export class SuccessComponent implements OnInit {
  private orderService = inject(OrderService);
  private langService = inject(LanguageService);
  private route = inject(ActivatedRoute);

  order = signal<Order | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  t = this.langService.t;

  // Parsed Shipping Address
  parsedAddress = computed(() => {
    const o = this.order();
    if (!o) return null;
    try {
      return JSON.parse(o.shippingAddress);
    } catch (e) {
      return null;
    }
  });

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const orderId = params['orderId'];
      if (orderId) {
        this.loadOrderInvoice(orderId);
      } else {
        this.error.set('No order ID provided.');
        this.loading.set(false);
      }
    });
  }

  async loadOrderInvoice(orderId: string) {
    try {
      const ord = await this.orderService.getOrderById(orderId);
      this.order.set(ord);
    } catch (e) {
      console.error(e);
      this.error.set('Order not found or unauthorized view.');
    } finally {
      this.loading.set(false);
    }
  }

  printInvoice() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
