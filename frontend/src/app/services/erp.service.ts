import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ErpService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ==========================================
  // VENDORS
  // ==========================================
  async getVendors(): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ vendors: any[] }>(`${this.apiUrl}/admin/vendors`, { withCredentials: true })
    );
    return res.vendors;
  }

  async createVendor(data: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/admin/vendors`, data, { withCredentials: true })
    );
  }

  async updateVendor(id: string, data: any): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/admin/vendors/${id}`, data, { withCredentials: true })
    );
  }

  async deleteVendor(id: string): Promise<any> {
    return firstValueFrom(
      this.http.delete(`${this.apiUrl}/admin/vendors/${id}`, { withCredentials: true })
    );
  }

  async getVendorLedger(vendorId: string): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ ledger: any[] }>(`${this.apiUrl}/admin/vendors/${vendorId}/ledger`, { withCredentials: true })
    );
    return res.ledger;
  }

  async addVendorLedgerEntry(vendorId: string, data: { amount: number; transactionType: 'PURCHASE' | 'PAYMENT'; reference?: string }): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/admin/vendors/${vendorId}/ledger`, data, { withCredentials: true })
    );
  }

  // ==========================================
  // PURCHASE ORDERS (PO)
  // ==========================================
  async getPurchaseOrders(): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ pos: any[] }>(`${this.apiUrl}/admin/pos`, { withCredentials: true })
    );
    return res.pos;
  }

  async createPurchaseOrder(data: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/admin/pos`, data, { withCredentials: true })
    );
  }

  async updatePurchaseOrder(id: string, data: any): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/admin/pos/${id}`, data, { withCredentials: true })
    );
  }

  async receivePurchaseOrder(id: string, items: { productId: string; receivedQty: number; serialNumbers: string[] }[]): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/admin/pos/${id}/receive`, { items }, { withCredentials: true })
    );
  }

  // ==========================================
  // EXPENSES & P&L
  // ==========================================
  async getExpenses(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/admin/expenses`, { withCredentials: true })
    );
  }

  async createExpense(data: { category: string; amount: number; description?: string; date?: string }): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/admin/expenses`, data, { withCredentials: true })
    );
  }

  async getProfitLossReport(startDate?: string, endDate?: string): Promise<any> {
    let url = `${this.apiUrl}/admin/reports/profit-loss`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return firstValueFrom(
      this.http.get<any>(url, { withCredentials: true })
    );
  }

  // ==========================================
  // SERIAL NUMBERS & WARRANTIES
  // ==========================================
  async checkWarranty(serial: string): Promise<any> {
    const res = await firstValueFrom(
      this.http.get<{ warranty: any }>(`${this.apiUrl}/warranty/check/${serial}`, { withCredentials: true })
    );
    return res.warranty;
  }

  async registerWarranty(data: {
    productId: string;
    serialNumber: string;
    orderId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    startDate: string;
    endDate: string;
  }): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/admin/warranties`, data, { withCredentials: true })
    );
  }

  async getExpiringWarranties(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/admin/warranties/expiring`, { withCredentials: true })
    );
  }

  // ==========================================
  // ANNUAL MAINTENANCE CONTRACTS (AMC)
  // ==========================================
  async getAMCs(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/admin/amcs`, { withCredentials: true })
    );
  }

  async createAMC(data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    device: string;
    startDate: string;
    endDate: string;
    contractValue: number;
    serviceHistory?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/admin/amcs`, data, { withCredentials: true })
    );
  }

  async renewAMC(id: string, data: { endDate: string; contractValue: number }): Promise<any> {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/admin/amcs/${id}`, { endDate: data.endDate, contractValue: data.contractValue, status: 'ACTIVE' }, { withCredentials: true })
    );
  }

  async addAmcServiceHistory(id: string, note: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/admin/amcs/${id}/service`, { note }, { withCredentials: true })
    );
  }

  // ==========================================
  // SAVED PC BUILDS & BUNDLES
  // ==========================================
  async saveBuild(data: {
    name: string;
    cpuId?: string;
    motherboardId?: string;
    ramId?: string;
    gpuId?: string;
    storageId?: string;
    psuId?: string;
    caseId?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/pc-builder/save`, data, { withCredentials: true })
    );
  }

  async loadBuild(id: string): Promise<any> {
    const res = await firstValueFrom(
      this.http.get<{ build: any; products: any[] }>(`${this.apiUrl}/pc-builder/load/${id}`, { withCredentials: true })
    );
    return res;
  }

  async getMySavedBuilds(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/pc-builder/my-builds`, { withCredentials: true })
    );
  }

  async getBundles(): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ bundles: any[] }>(`${this.apiUrl}/bundles`, { withCredentials: true })
    );
    return res.bundles;
  }

  // ==========================================
  // AUDIT LOGS & WHATSAPP LOGS
  // ==========================================
  async getAuditLogs(): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ logs: any[] }>(`${this.apiUrl}/admin/audit-logs`, { withCredentials: true })
    );
    return res.logs;
  }

  async getWhatsAppLogs(): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ logs: any[] }>(`${this.apiUrl}/admin/notifications/whatsapp-logs`, { withCredentials: true })
    );
    return res.logs;
  }
}
