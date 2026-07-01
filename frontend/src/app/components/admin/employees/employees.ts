import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../services/ticket.service';

@Component({
  selector: 'app-admin-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.html',
  styleUrls: []
})
export class AdminEmployeesComponent implements OnInit {
  private ticketService = inject(TicketService);

  employees: any[] = [];
  errorMessage = '';
  successMessage = '';

  // Form Model
  form = {
    name: '',
    email: '',
    password: '',
    role: 'TECHNICIAN',
    employeeId: '',
    department: '',
    designation: '',
    phone: '',
    joiningDate: ''
  };

  ngOnInit() {
    this.loadEmployees();
  }

  async loadEmployees() {
    try {
      const res = await this.ticketService.getEmployees();
      this.employees = res.employees;
    } catch (e: any) {
      this.errorMessage = e.error?.error || 'Failed to fetch employee list';
    }
  }

  async onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    try {
      const res = await this.ticketService.createEmployee(this.form);
      this.successMessage = res.message || 'Employee created successfully';
      // Reset form
      this.form = {
        name: '',
        email: '',
        password: '',
        role: 'TECHNICIAN',
        employeeId: '',
        department: '',
        designation: '',
        phone: '',
        joiningDate: ''
      };
      this.loadEmployees();
    } catch (e: any) {
      this.errorMessage = e.error?.error || 'Failed to create employee';
    }
  }

  async deleteEmployee(id: string) {
    if (!confirm('Are you sure you want to delete this employee account?')) return;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      const res = await this.ticketService.deleteEmployee(id);
      this.successMessage = res.message || 'Employee account deleted successfully';
      this.loadEmployees();
    } catch (e: any) {
      this.errorMessage = e.error?.error || 'Failed to delete employee account';
    }
  }
}
