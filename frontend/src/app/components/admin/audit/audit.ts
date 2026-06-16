import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ErpService } from '../../../services/erp.service';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.html'
})
export class AdminAuditComponent implements OnInit {
  private erpService = inject(ErpService);

  activeTab = signal<'audit' | 'whatsapp'>('audit');
  loading = signal<boolean>(false);

  auditLogs = signal<any[]>([]);
  whatsappLogs = signal<any[]>([]);

  ngOnInit() {
    this.fetchAuditLogs();
    this.fetchWhatsAppLogs();
  }

  async fetchAuditLogs() {
    this.loading.set(true);
    try {
      const list = await this.erpService.getAuditLogs();
      this.auditLogs.set(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchWhatsAppLogs() {
    try {
      const list = await this.erpService.getWhatsAppLogs();
      this.whatsappLogs.set(list || []);
    } catch (e) {
      console.error(e);
    }
  }

  // Helper to parse JSON details for display
  parseDetails(detailsStr: string): string {
    try {
      const obj = JSON.parse(detailsStr);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return detailsStr;
    }
  }
}
