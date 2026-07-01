import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../services/ticket.service';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.html',
})
export class AdminServicesComponent implements OnInit {
  private ticketService = inject(TicketService);

  tickets = signal<any[]>([]);
  technicians = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Searchable dropdown state
  activeDropdownTicketId = signal<string | null>(null);
  dropdownSearchQuery = signal<string>('');

  statusStages = [
    'RECEIVED',
    'DIAGNOSING',
    'WAITING_FOR_APPROVAL',
    'WAITING_FOR_PARTS',
    'REPAIRING',
    'TESTING',
    'READY_FOR_PICKUP',
    'DELIVERED',
    'ON_HOLD',
    'CANCELLED'
  ];

  filteredTechnicians = computed(() => {
    const query = this.dropdownSearchQuery().toLowerCase().trim();
    const list = this.technicians();
    if (!query) return list;
    return list.filter(t => 
      t.name.toLowerCase().includes(query) || 
      (t.employeeId && t.employeeId.toLowerCase().includes(query))
    );
  });

  ngOnInit() {
    this.fetchTickets();
    this.fetchTechnicians();
  }

  toggleDropdown(ticketId: string) {
    if (this.activeDropdownTicketId() === ticketId) {
      this.activeDropdownTicketId.set(null);
    } else {
      this.activeDropdownTicketId.set(ticketId);
      this.dropdownSearchQuery.set('');
    }
  }

  setSearchQuery(q: string) {
    this.dropdownSearchQuery.set(q);
  }

  async fetchTickets() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.ticketService.getServiceTickets();
      this.tickets.set(res.tickets || []);
    } catch (e: any) {
      console.error(e);
      this.error.set('Failed to fetch service tickets. Make sure you are logged in as an Administrator.');
    } finally {
      this.loading.set(false);
    }
  }

  async fetchTechnicians() {
    try {
      const res = await this.ticketService.getTechnicians();
      this.technicians.set(res.technicians || []);
    } catch (e) {
      console.error('Failed to load technicians:', e);
    }
  }

  async handleStatusChange(id: string, newStatus: string) {
    try {
      await this.ticketService.updateServiceTicketStatus(id, newStatus);
      // Update local state without full reload
      this.tickets.update(current => 
        current.map(ticket => 
          ticket.id === id ? { ...ticket, status: newStatus } : ticket
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(err.error?.error || 'Failed to update service ticket status.');
    }
  }

  async handleAssignTechnician(ticketId: string, technicianId: string) {
    try {
      const techIdVal = technicianId === 'UNASSIGNED' ? null : technicianId;
      const tech = techIdVal ? this.technicians().find(t => t.id === techIdVal) : null;
      
      await this.ticketService.assignTechnician(ticketId, techIdVal);
      
      // Close dropdown
      this.activeDropdownTicketId.set(null);

      this.successMessage.set(tech ? `Service successfully assigned to ${tech.name}.` : 'Service ticket unassigned.');
      setTimeout(() => this.successMessage.set(null), 4000);

      this.fetchTickets();
      this.fetchTechnicians(); // Refresh workload counts
    } catch (err: any) {
      console.error(err);
      alert(err.error?.error || 'Failed to assign technician.');
    }
  }
}
