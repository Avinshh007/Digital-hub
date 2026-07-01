import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TicketService } from '../../../services/ticket.service';

@Component({
  selector: 'app-services-track',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './track.html',
})
export class ServicesTrackComponent implements OnInit {
  private ticketService = inject(TicketService);
  private route = inject(ActivatedRoute);

  serviceIdInput = '';
  ticket = signal<any | null>(null);
  searched = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  statusStages = [
    'Received',
    'Diagnosing',
    'Waiting For Approval',
    'Repairing',
    'Testing',
    'Ready For Pickup',
    'Delivered'
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.serviceIdInput = id;
        this.handleTrack(id);
      }
    });
  }

  async handleTrack(id?: string) {
    const targetId = (id || this.serviceIdInput).trim();
    if (!targetId) {
      this.error.set('Please enter a valid Service ID.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.ticket.set(null);
    this.searched.set(true);

    try {
      const res = await this.ticketService.trackServiceTicket(targetId);
      this.ticket.set(res.ticket);
    } catch (err: any) {
      console.error(err);
      this.error.set(err.error || 'No repair ticket found matching this Service ID. Please verify and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  getStageIndex(status: string): number {
    // Normalize status names if different
    const matched = this.statusStages.findIndex(s => s.toLowerCase() === status.toLowerCase());
    return matched !== -1 ? matched : 0;
  }
}
