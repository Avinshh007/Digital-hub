// src/app/components/admin/analytics/analytics.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
})
export class AdminAnalyticsComponent implements OnInit {
  private orderService = inject(OrderService);

  loading = signal(true);
  aggregates = signal<any>(null);
  lowStockProducts = signal<any[]>([]);
  categorySales = signal<any[]>([]);
  recentOrders = signal<any[]>([]);
  salesTrend = signal<any[]>([]);

  ngOnInit() {
    this.loadAnalyticsData();
  }

  async loadAnalyticsData() {
    try {
      const data = await this.orderService.getAnalytics();
      this.aggregates.set(data.aggregates);
      this.lowStockProducts.set(data.lowStockProducts || []);
      this.categorySales.set(data.categorySales || []);
      this.recentOrders.set(data.recentOrders || []);
      this.salesTrend.set(data.salesTrend || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  getMaxRevenue(): number {
    const trends = this.salesTrend();
    if (!trends || trends.length === 0) return 1;
    return Math.max(...trends.map(t => t.revenue), 1);
  }

  getTotalCategorySales(): number {
    const cats = this.categorySales();
    if (!cats || cats.length === 0) return 1;
    return cats.reduce((sum, c) => sum + c.sales, 0);
  }

  getChartPoints(): { x: number; y: number; revenue: number; date: string; orders: number }[] {
    const trends = this.salesTrend();
    if (!trends || trends.length === 0) return [];
    const maxRev = this.getMaxRevenue();
    const width = 600;
    const height = 240;
    const paddingX = 40;
    const paddingY = 30;

    return trends.map((t, i) => {
      const x = paddingX + (i * (width - 2 * paddingX)) / (trends.length - 1 || 1);
      const ratio = t.revenue / maxRev;
      const y = height - paddingY - ratio * (height - 2 * paddingY);
      return { x, y, revenue: t.revenue, date: t.date, orders: t.orders };
    });
  }

  getLinePath(): string {
    const points = this.getChartPoints();
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }

  getAreaPath(): string {
    const points = this.getChartPoints();
    if (points.length === 0) return '';
    const linePath = this.getLinePath();
    const width = 600;
    const height = 240;
    const paddingY = 30;
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${linePath} L ${lastPoint.x.toFixed(1)} ${(height - paddingY).toFixed(1)} L ${firstPoint.x.toFixed(1)} ${(height - paddingY).toFixed(1)} Z`;
  }

  getCategoryDonutSlices() {
    const cats = this.categorySales();
    const total = this.getTotalCategorySales();
    if (total === 0 || cats.length === 0) return [];

    const r = 50;
    const circ = 2 * Math.PI * r; // ~314.16
    let accumulatedPercent = 0;

    const colors = [
      '#6366f1', // indigo-500
      '#3b82f6', // blue-500
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#ec4899', // pink-500
      '#8b5cf6', // violet-500
      '#f43f5e', // rose-500
    ];

    return cats.map((cat, i) => {
      const percent = cat.sales / total;
      const strokeDashArray = `${(percent * circ).toFixed(2)} ${circ.toFixed(2)}`;
      const strokeDashOffset = (-accumulatedPercent * circ).toFixed(2);
      accumulatedPercent += percent;

      return {
        ...cat,
        color: colors[i % colors.length],
        strokeDashArray,
        strokeDashOffset,
        percentage: Math.round(percent * 100)
      };
    });
  }
}
