import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ErpService } from '../../../services/erp.service';

@Component({
  selector: 'app-admin-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.html'
})
export class AdminExpensesComponent implements OnInit {
  private erpService = inject(ErpService);

  loading = signal<boolean>(false);
  expenses = signal<any[]>([]);
  report = signal<any | null>(null);

  // Modal and Form controls
  showAddModal = signal<boolean>(false);
  expenseForm = {
    category: 'RENT',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  };

  categories = [
    { value: 'RENT', label: 'Rent / Office Space' },
    { value: 'SALARY', label: 'Staff Salaries' },
    { value: 'ELECTRICITY', label: 'Electricity Bills' },
    { value: 'INTERNET', label: 'Internet & Networking' },
    { value: 'TRANSPORT', label: 'Transport & Delivery' },
    { value: 'MAINTENANCE', label: 'Hardware Maintenance' },
    { value: 'MISCELLANEOUS', label: 'Miscellaneous Operational' }
  ];

  ngOnInit() {
    this.fetchExpenses();
    this.fetchPnLReport();
  }

  async fetchExpenses() {
    this.loading.set(true);
    try {
      const data = await this.erpService.getExpenses();
      this.expenses.set(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchPnLReport() {
    try {
      const data = await this.erpService.getProfitLossReport();
      this.report.set(data);
    } catch (e) {
      console.error(e);
    }
  }

  openAddExpense() {
    this.expenseForm = {
      category: 'RENT',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    };
    this.showAddModal.set(true);
  }

  async saveExpense() {
    if (this.expenseForm.amount <= 0) {
      alert('Please enter a valid positive expense amount.');
      return;
    }

    try {
      await this.erpService.createExpense(this.expenseForm);
      this.showAddModal.set(false);
      this.fetchExpenses();
      this.fetchPnLReport(); // update stats
    } catch (e) {
      console.error(e);
      alert('Failed to log expense record.');
    }
  }

  // Get Label for Category
  getCategoryLabel(catValue: string): string {
    const found = this.categories.find(c => c.value === catValue);
    return found ? found.label : catValue;
  }

  // Get keys of breakdown map
  getBreakdownKeys(): string[] {
    const rep = this.report();
    if (!rep || !rep.expenseBreakdown) return [];
    return Object.keys(rep.expenseBreakdown);
  }
}
