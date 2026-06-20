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
}
