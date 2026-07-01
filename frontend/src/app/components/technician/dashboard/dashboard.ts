import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TicketService, ServiceTicket } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-technician-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class TechnicianDashboardComponent implements OnInit {
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private router = inject(Router);

  tickets = signal<ServiceTicket[]>([]);
  departmentQueue = signal<ServiceTicket[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Main Workspace Tab: ASSIGNED or DEPT_QUEUE
  workspaceTab = signal<'ASSIGNED' | 'DEPT_QUEUE'>('ASSIGNED');
  // Filters for My Assigned Jobs
  currentFilter = signal<string>('ALL'); // ALL, HIGH_PRIORITY, WAITING_APPROVAL, WAITING_PARTS, OVERDUE

  userName = computed(() => this.authService.user()?.name || 'Technician');

  // Stats computed properties
  myActiveJobsCount = computed(() => {
    return this.tickets().filter(t => t.status !== 'DELIVERED' && t.status !== 'CANCELLED').length;
  });

  completedTodayCount = computed(() => {
    const today = new Date().toDateString();
    return this.tickets().filter(t => t.status === 'DELIVERED' && t.deliveryDate && new Date(t.deliveryDate).toDateString() === today).length;
  });

  waitingPartsCount = computed(() => {
    return this.tickets().filter(t => t.status === 'WAITING_FOR_PARTS').length;
  });

  highPriorityCount = computed(() => {
    return this.tickets().filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length;
  });

  deptActiveJobsCount = computed(() => {
    return this.departmentQueue().length;
  });

  hasOverdueJobs = computed(() => {
    const now = new Date();
    return this.tickets().some(t => {
      if (t.status === 'DELIVERED' || t.status === 'CANCELLED' || !t.estimatedCompletionDate) return false;
      return new Date(t.estimatedCompletionDate) < now;
    });
  });

  // Assigned tickets with filter applied
  filteredTickets = computed(() => {
    const list = this.tickets();
    const now = new Date();
    switch (this.currentFilter()) {
      case 'HIGH_PRIORITY':
        return list.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT');
      case 'WAITING_APPROVAL':
        return list.filter(t => t.status === 'WAITING_FOR_APPROVAL');
      case 'WAITING_PARTS':
        return list.filter(t => t.status === 'WAITING_FOR_PARTS');
      case 'OVERDUE':
        return list.filter(t => {
          if (t.status === 'DELIVERED' || t.status === 'CANCELLED' || !t.estimatedCompletionDate) return false;
          return new Date(t.estimatedCompletionDate) < now;
        });
      case 'ALL':
      default:
        return list;
    }
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [jobsRes, queueRes] = await Promise.all([
        this.ticketService.getTechnicianJobs(),
        this.ticketService.getTechnicianServiceQueue()
      ]);
      this.tickets.set(jobsRes.tickets || []);
      this.departmentQueue.set(queueRes.tickets || []);
    } catch (e: any) {
      console.error(e);
      this.error.set('Failed to load workspace data. Make sure you are logged in as an employee.');
    } finally {
      this.loading.set(false);
    }
  }

  setWorkspaceTab(tab: 'ASSIGNED' | 'DEPT_QUEUE') {
    this.workspaceTab.set(tab);
  }

  setFilter(filter: string) {
    this.currentFilter.set(filter);
  }

  isOverdue(ticket: ServiceTicket): boolean {
    if (ticket.status === 'DELIVERED' || ticket.status === 'CANCELLED' || !ticket.estimatedCompletionDate) return false;
    return new Date(ticket.estimatedCompletionDate) < new Date();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
