import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  mobileNumber: string;
  deviceType: string;
  brand: string;
  model: string;
  problemDescription: string;
  dateReceived: string;
  expectedDeliveryDate: string;
  technicianName?: string;
  assignedTechnician?: string;
  assignedTechnicianId?: string;
  estimatedCost: number;
  notes?: string;
  status: string;
  history: string; // JSON string

  // Enhanced fields
  deviceSerialNumber?: string;
  accessoriesReceived?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  deliveryDate?: string;
  paymentStatus: string;
  paymentAmount?: number;
  customerSignature?: string;
  priority: string;
  deviceCondition?: string;

  // Future relations
  serialNumber?: string;
  amcId?: string;
  userId?: string;

  // New Sprint 2 fields
  diagnosis?: string;
  observations?: string;
  internalNotes?: string;
  partsCost?: number;
  labourCost?: number;
  otherCharges?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalCost?: number;
  attachments?: string;

  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tickets`;

  async createTicket(ticketData: Omit<Partial<ServiceTicket>, 'id' | 'ticketNumber' | 'history'>): Promise<{ message: string; ticket: ServiceTicket }> {
    return firstValueFrom(
      this.http.post<{ message: string; ticket: ServiceTicket }>(this.apiUrl, ticketData, { withCredentials: true })
    );
  }

  async getTickets(status?: string, search?: string): Promise<{ tickets: ServiceTicket[] }> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (search) {
      params = params.set('search', search);
    }
    return firstValueFrom(
      this.http.get<{ tickets: ServiceTicket[] }>(this.apiUrl, { params, withCredentials: true })
    );
  }

  async getStats(): Promise<{ open: number; ready: number; waitingParts: number; deliveredToday: number }> {
    return firstValueFrom(
      this.http.get<{ open: number; ready: number; waitingParts: number; deliveredToday: number }>(`${this.apiUrl}/stats`, { withCredentials: true })
    );
  }

  async trackTicket(query: string): Promise<{ tickets: Partial<ServiceTicket>[] }> {
    let params = new HttpParams().set('query', query);
    return firstValueFrom(
      this.http.get<{ tickets: Partial<ServiceTicket>[] }>(`${this.apiUrl}/track`, { params, withCredentials: true })
    );
  }

  async updateTicket(id: string, ticketData: Partial<ServiceTicket>): Promise<{ message: string; ticket: ServiceTicket }> {
    return firstValueFrom(
      this.http.put<{ message: string; ticket: ServiceTicket }>(`${this.apiUrl}/${id}`, ticketData, { withCredentials: true })
    );
  }

  // --- SPRINT 1 SERVICE MANAGEMENT ---
  async createServiceTicket(ticketData: {
    customerName: string;
    mobileNumber: string;
    email?: string;
    deviceType: string;
    brand: string;
    model: string;
    serialNumber?: string;
    problemDescription: string;
  }): Promise<{ message: string; ticket: ServiceTicket }> {
    return firstValueFrom(
      this.http.post<{ message: string; ticket: ServiceTicket }>(
        `${environment.apiUrl}/services`,
        ticketData,
        { withCredentials: true }
      )
    );
  }

  async getServiceTickets(): Promise<{ tickets: ServiceTicket[] }> {
    return firstValueFrom(
      this.http.get<{ tickets: ServiceTicket[] }>(
        `${environment.apiUrl}/services`,
        { withCredentials: true }
      )
    );
  }

  async trackServiceTicket(serviceId: string): Promise<{ ticket: ServiceTicket }> {
    return firstValueFrom(
      this.http.get<{ ticket: ServiceTicket }>(
        `${environment.apiUrl}/services/${serviceId}`,
        { withCredentials: true }
      )
    );
  }

  async updateServiceTicketStatus(id: string, status: string): Promise<{ message: string; ticket: ServiceTicket }> {
    return firstValueFrom(
      this.http.patch<{ message: string; ticket: ServiceTicket }>(
        `${environment.apiUrl}/services/${id}/status`,
        { status },
        { withCredentials: true }
      )
    );
  }

  // --- SPRINT 2 EMPLOYEE & TECHNICIAN WORKFLOW ---

  async getEmployees(): Promise<{ employees: any[] }> {
    return firstValueFrom(
      this.http.get<{ employees: any[] }>(`${environment.apiUrl}/admin/employees`, { withCredentials: true })
    );
  }

  async createEmployee(employeeData: any): Promise<{ message: string; employee: any }> {
    return firstValueFrom(
      this.http.post<{ message: string; employee: any }>(`${environment.apiUrl}/admin/employees`, employeeData, { withCredentials: true })
    );
  }

  async deleteEmployee(id: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.delete<{ message: string }>(`${environment.apiUrl}/admin/employees/${id}`, { withCredentials: true })
    );
  }

  async getTechnicians(): Promise<{ technicians: any[] }> {
    return firstValueFrom(
      this.http.get<{ technicians: any[] }>(`${environment.apiUrl}/admin/technicians`, { withCredentials: true })
    );
  }

  async getTechnicianJobs(): Promise<{ tickets: ServiceTicket[] }> {
    return firstValueFrom(
      this.http.get<{ tickets: ServiceTicket[] }>(`${environment.apiUrl}/technician/jobs`, { withCredentials: true })
    );
  }

  async getTechnicianServiceDetail(id: string): Promise<{ ticket: ServiceTicket & { serviceAuditLogs?: any[] } }> {
    return firstValueFrom(
      this.http.get<{ ticket: ServiceTicket & { serviceAuditLogs?: any[] } }>(`${environment.apiUrl}/technician/service/${id}`, { withCredentials: true })
    );
  }

  async updateTechnicianService(id: string, data: any): Promise<{ message: string; ticket: ServiceTicket }> {
    return firstValueFrom(
      this.http.patch<{ message: string; ticket: ServiceTicket }>(`${environment.apiUrl}/technician/service/${id}`, data, { withCredentials: true })
    );
  }

  async assignTechnician(id: string, technicianId: string | null): Promise<{ message: string; ticket: ServiceTicket }> {
    return firstValueFrom(
      this.http.patch<{ message: string; ticket: ServiceTicket }>(`${environment.apiUrl}/services/${id}/assign`, { technicianId }, { withCredentials: true })
    );
  }

  async getServiceAuditLogs(id: string): Promise<{ logs: any[] }> {
    return firstValueFrom(
      this.http.get<{ logs: any[] }>(`${environment.apiUrl}/services/${id}/audit-logs`, { withCredentials: true })
    );
  }

  async uploadAttachment(id: string, file: File, category: string): Promise<{ message: string; attachment: any; ticket: ServiceTicket }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return firstValueFrom(
      this.http.post<{ message: string; attachment: any; ticket: ServiceTicket }>(
        `${environment.apiUrl}/services/${id}/attachments`,
        formData,
        { withCredentials: true }
      )
    );
  }

  async getTechnicianServiceQueue(): Promise<{ tickets: ServiceTicket[] }> {
    return firstValueFrom(
      this.http.get<{ tickets: ServiceTicket[] }>(`${environment.apiUrl}/technician/service-queue`, { withCredentials: true })
    );
  }
}
