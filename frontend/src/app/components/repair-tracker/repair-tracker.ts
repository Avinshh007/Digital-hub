import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-repair-tracker',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './repair-tracker.html',
  styleUrl: './repair-tracker.css'
})
export class RepairTrackerComponent {
  private ticketService = inject(TicketService);

  searchQuery = signal<string>('');
  tickets = signal<any[]>([]);
  searched = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  statusStages = [
    'Received',
    'Diagnosing',
    'Waiting For Approval',
    'Waiting For Parts',
    'Repair In Progress',
    'Ready For Delivery',
    'Delivered'
  ];

  async handleSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      this.errorMessage.set('Please enter a ticket number or mobile number.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.searched.set(true);

    try {
      const response = await this.ticketService.trackTicket(trimmed);
      this.tickets.set(response.tickets);
      if (response.tickets.length === 0) {
        this.errorMessage.set('No tickets found matching that criteria. Please check the details or contact us.');
      }
    } catch (error) {
      console.error('Error tracking ticket:', error);
      this.errorMessage.set('Failed to search database. Please try again later.');
    } finally {
      this.loading.set(false);
    }
  }

  parseHistory(historyStr: string): any[] {
    try {
      return JSON.parse(historyStr);
    } catch (e) {
      return [];
    }
  }

  getStageIndex(status: string): number {
    if (status === 'Cancelled') return -1;
    return this.statusStages.indexOf(status);
  }
}
