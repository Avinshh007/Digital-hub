import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketService, ServiceTicket } from '../../../services/ticket.service';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-tickets.html',
  styleUrl: './admin-tickets.css'
})
export class AdminTicketsComponent implements OnInit {
  private ticketService = inject(TicketService);

  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;

  // Data signals
  tickets = signal<ServiceTicket[]>([]);
  stats = signal({ open: 0, ready: 0, waitingParts: 0, deliveredToday: 0 });
  loading = signal(false);

  // Filter signals
  selectedStatus = signal<string>('All');
  searchQuery = signal<string>('');

  // Form modals / drawers state
  isCreateDrawerOpen = signal(false);
  isEditDrawerOpen = signal(false);
  selectedTicket = signal<ServiceTicket | null>(null);

  // Signature canvas state
  isDrawing = false;
  private ctx!: CanvasRenderingContext2D;

  statusOptions = [
    'Received',
    'Diagnosing',
    'Waiting For Approval',
    'Waiting For Parts',
    'Repair In Progress',
    'Ready For Delivery',
    'Delivered',
    'Cancelled'
  ];

  deviceTypes = ['Laptop', 'Desktop', 'Printer', 'Networking', 'Upgrade', 'HomeService'];
  priorities = ['Low', 'Medium', 'High', 'Urgent'];

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const ticketsRes = await this.ticketService.getTickets(this.selectedStatus(), this.searchQuery());
      this.tickets.set(ticketsRes.tickets);

      const statsRes = await this.ticketService.getStats();
      this.stats.set(statsRes);
    } catch (e) {
      console.error('Error loading tickets admin data:', e);
    } finally {
      this.loading.set(false);
    }
  }

  handleStatusFilter(status: string) {
    this.selectedStatus.set(status);
    this.loadData();
  }

  handleSearch(query: string) {
    this.searchQuery.set(query);
    this.loadData();
  }

  openCreateDrawer() {
    this.isCreateDrawerOpen.set(true);
  }

  closeCreateDrawer() {
    this.isCreateDrawerOpen.set(false);
  }

  openEditDrawer(ticket: ServiceTicket) {
    this.selectedTicket.set(ticket);
    this.isEditDrawerOpen.set(true);
    
    // Setup signature drawing canvas after it renders
    setTimeout(() => {
      this.initSignatureCanvas();
      if (ticket.customerSignature && this.signatureCanvas) {
        const img = new Image();
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0);
        };
        img.src = ticket.customerSignature;
      }
    }, 100);
  }

  closeEditDrawer() {
    this.isEditDrawerOpen.set(false);
    this.selectedTicket.set(null);
  }

  // Create ticket submission
  async handleCreateTicket(event: SubmitEvent, form: HTMLFormElement) {
    event.preventDefault();
    const formData = new FormData(form);
    
    const data = {
      customerName: formData.get('customerName') as string,
      mobileNumber: formData.get('mobileNumber') as string,
      deviceType: formData.get('deviceType') as string,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      problemDescription: formData.get('problemDescription') as string,
      expectedDeliveryDate: formData.get('expectedDeliveryDate') as string,
      assignedTechnician: formData.get('assignedTechnician') as string,
      estimatedCost: parseFloat(formData.get('estimatedCost') as string || '0'),
      notes: formData.get('notes') as string,
      deviceSerialNumber: formData.get('deviceSerialNumber') as string,
      accessoriesReceived: formData.get('accessoriesReceived') as string,
      estimatedCompletionDate: formData.get('estimatedCompletionDate') as string || undefined,
      priority: formData.get('priority') as string,
      deviceCondition: formData.get('deviceCondition') as string,
      paymentStatus: formData.get('paymentStatus') as string,
      paymentAmount: parseFloat(formData.get('paymentAmount') as string || '0')
    };

    try {
      await this.ticketService.createTicket(data);
      this.closeCreateDrawer();
      form.reset();
      this.loadData();
    } catch (e) {
      console.error('Error creating ticket:', e);
      alert('Failed to create ticket. Please check input data.');
    }
  }

  // Edit ticket submission
  async handleEditTicket(event: SubmitEvent, form: HTMLFormElement) {
    event.preventDefault();
    const ticketId = this.selectedTicket()?.id;
    if (!ticketId) return;

    const formData = new FormData(form);
    
    // Extract base64 signature from canvas if drawn
    let signatureData: string | undefined = undefined;
    if (this.signatureCanvas) {
      // Check if canvas has been drawn on (simple pixel audit)
      const buffer = this.ctx.getImageData(0, 0, this.signatureCanvas.nativeElement.width, this.signatureCanvas.nativeElement.height);
      const isBlank = !buffer.data.some(colorVal => colorVal !== 0);
      if (!isBlank) {
        signatureData = this.signatureCanvas.nativeElement.toDataURL();
      }
    }

    const data: any = {
      customerName: formData.get('customerName') as string,
      mobileNumber: formData.get('mobileNumber') as string,
      deviceType: formData.get('deviceType') as string,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      problemDescription: formData.get('problemDescription') as string,
      expectedDeliveryDate: formData.get('expectedDeliveryDate') as string,
      assignedTechnician: formData.get('assignedTechnician') as string,
      estimatedCost: parseFloat(formData.get('estimatedCost') as string || '0'),
      notes: formData.get('notes') as string,
      status: formData.get('status') as string,
      deviceSerialNumber: formData.get('deviceSerialNumber') as string,
      accessoriesReceived: formData.get('accessoriesReceived') as string,
      estimatedCompletionDate: formData.get('estimatedCompletionDate') as string || null,
      priority: formData.get('priority') as string,
      deviceCondition: formData.get('deviceCondition') as string,
      paymentStatus: formData.get('paymentStatus') as string,
      paymentAmount: parseFloat(formData.get('paymentAmount') as string || '0')
    };

    if (signatureData) {
      data.customerSignature = signatureData;
    }

    // Capture manual date logs if status set to Complete
    if (data.status === 'Delivered') {
      data.deliveryDate = new Date().toISOString();
    }
    if (data.status === 'Ready For Delivery' || data.status === 'Delivered') {
      data.actualCompletionDate = new Date().toISOString();
    }

    try {
      await this.ticketService.updateTicket(ticketId, data);
      this.closeEditDrawer();
      this.loadData();
    } catch (e) {
      console.error('Error updating ticket:', e);
      alert('Failed to update ticket.');
    }
  }

  parseHistory(historyStr: string): any[] {
    try {
      return JSON.parse(historyStr);
    } catch (e) {
      return [];
    }
  }

  // Signature Canvas Helpers
  private initSignatureCanvas() {
    if (!this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    canvas.width = canvas.parentElement?.clientWidth || 350;
    canvas.height = 120;
    
    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#22c55e'; // Green paint color matching  DIGITAL HUBtheme accent
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    
    // Desktop event bindings
    canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    canvas.addEventListener('mousemove', (e) => this.draw(e));
    canvas.addEventListener('mouseup', () => this.stopDrawing());
    canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Mobile touch event bindings
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.isDrawing = true;
      this.ctx.beginPath();
      this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.isDrawing) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
      this.ctx.stroke();
    });
    canvas.addEventListener('touchend', () => this.stopDrawing());
  }

  private startDrawing(e: MouseEvent) {
    this.isDrawing = true;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  private draw(e: MouseEvent) {
    if (!this.isDrawing) return;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    this.ctx.stroke();
  }

  private stopDrawing() {
    this.isDrawing = false;
  }

  clearSignature() {
    if (!this.signatureCanvas) return;
    this.ctx.clearRect(0, 0, this.signatureCanvas.nativeElement.width, this.signatureCanvas.nativeElement.height);
  }
}
