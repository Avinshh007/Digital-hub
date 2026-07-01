import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TicketService, ServiceTicket } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-technician-service-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './service-detail.html',
})
export class TechnicianServiceDetailComponent implements OnInit {
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ticketId = '';
  ticket = signal<any | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Read-only state for technicians viewing unassigned or other's tickets
  isReadOnly = signal(false);

  // Form inputs
  status = '';
  priority = '';
  diagnosis = '';
  observations = '';
  internalNotes = '';
  partsCost = 0;
  labourCost = 0;
  otherCharges = 0;
  taxAmount = 0; // GST
  discountAmount = 0;
  estimatedCompletionDate = '';
  remarks = ''; // For audit log description

  // Attachment upload
  selectedFile: File | null = null;
  uploadCategory = 'REPAIR_PHOTO';
  uploading = false;

  // Attachment list parsed from JSON string
  attachmentsList: any[] = [];

  statusList = [
    { value: 'RECEIVED', label: 'Received' },
    { value: 'DIAGNOSING', label: 'Diagnosing' },
    { value: 'WAITING_FOR_APPROVAL', label: 'Waiting For Approval' },
    { value: 'WAITING_FOR_PARTS', label: 'Waiting For Parts' },
    { value: 'REPAIRING', label: 'Repairing' },
    { value: 'TESTING', label: 'Testing' },
    { value: 'READY_FOR_PICKUP', label: 'Ready For Pickup' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  priorityList = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  ngOnInit() {
    this.ticketId = this.route.snapshot.paramMap.get('id') || '';
    if (this.ticketId) {
      this.loadTicketDetails();
    }
  }

  async loadTicketDetails() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.ticketService.getTechnicianServiceDetail(this.ticketId);
      const ticket = res.ticket;
      this.ticket.set(ticket);
      
      // Determine if read-only
      const user = this.authService.user();
      if (user) {
        this.isReadOnly.set(user.role === 'TECHNICIAN' && ticket.assignedTechnicianId !== user.id);
      } else {
        this.isReadOnly.set(true);
      }

      // Populate form values
      this.status = ticket.status;
      this.priority = ticket.priority;
      this.diagnosis = ticket.diagnosis || '';
      this.observations = ticket.observations || '';
      this.internalNotes = ticket.internalNotes || '';
      this.partsCost = ticket.partsCost || 0;
      this.labourCost = ticket.labourCost || 0;
      this.otherCharges = ticket.otherCharges || 0;
      this.taxAmount = ticket.taxAmount || 0;
      this.discountAmount = ticket.discountAmount || 0;
      this.estimatedCompletionDate = ticket.estimatedCompletionDate ? new Date(ticket.estimatedCompletionDate).toISOString().slice(0,10) : '';
      
      // Parse attachments list
      try {
        this.attachmentsList = ticket.attachments ? JSON.parse(ticket.attachments) : [];
      } catch (e) {
        this.attachmentsList = [];
      }

    } catch (e: any) {
      console.error(e);
      this.error.set(e.error?.error || 'Failed to load ticket details.');
    } finally {
      this.loading.set(false);
    }
  }

  // Auto calculate grand total
  get grandTotal(): number {
    return (this.partsCost + this.labourCost + this.otherCharges + this.taxAmount) - this.discountAmount;
  }

  async onSaveWorkflow() {
    if (this.isReadOnly()) return;
    this.error.set(null);
    this.successMessage.set(null);
    try {
      const res = await this.ticketService.updateTechnicianService(this.ticketId, {
        status: this.status,
        priority: this.priority,
        diagnosis: this.diagnosis,
        observations: this.observations,
        internalNotes: this.internalNotes,
        partsCost: this.partsCost,
        labourCost: this.labourCost,
        otherCharges: this.otherCharges,
        taxAmount: this.taxAmount,
        discountAmount: this.discountAmount,
        estimatedCompletionDate: this.estimatedCompletionDate || null,
        remarks: this.remarks
      });
      this.successMessage.set('Work order details updated successfully.');
      this.remarks = ''; // Reset remarks
      this.loadTicketDetails();
    } catch (e: any) {
      console.error(e);
      this.error.set(e.error?.error || 'Failed to update work order.');
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onUploadAttachment() {
    if (this.isReadOnly() || !this.selectedFile) return;
    this.uploading = true;
    this.error.set(null);
    this.successMessage.set(null);
    try {
      await this.ticketService.uploadAttachment(this.ticketId, this.selectedFile, this.uploadCategory);
      this.successMessage.set('Attachment uploaded successfully.');
      this.selectedFile = null;
      // Reset input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      this.loadTicketDetails();
    } catch (e: any) {
      console.error(e);
      this.error.set(e.error?.error || 'Failed to upload attachment.');
    } finally {
      this.uploading = false;
    }
  }
}
