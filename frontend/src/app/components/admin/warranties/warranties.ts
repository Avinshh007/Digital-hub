import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ErpService } from '../../../services/erp.service';
import { ProductService, Product } from '../../../services/product.service';

@Component({
  selector: 'app-admin-warranties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warranties.html'
})
export class AdminWarrantiesComponent implements OnInit {
  private erpService = inject(ErpService);
  private productService = inject(ProductService);

  activeTab = signal<'warranties' | 'amcs'>('warranties');
  loading = signal<boolean>(false);

  // Warranties lists
  expiringWarranties = signal<any[]>([]);
  products = signal<Product[]>([]);

  // Warranty form modal signals
  showRegisterModal = signal<boolean>(false);
  registerForm = {
    productId: '',
    serialNumber: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    durationMonths: 12
  };

  // AMCs list and modal signals
  amcs = signal<any[]>([]);
  showAmcModal = signal<boolean>(false);
  amcForm = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    device: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    contractValue: 0
  };

  // AMC Service log signals
  showServiceModal = signal<boolean>(false);
  selectedAmc = signal<any | null>(null);
  serviceHistoryList = signal<any[]>([]);
  serviceNote = signal<string>('');

  // AMC Renew modal signals
  showRenewModal = signal<boolean>(false);
  renewForm = {
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    contractValue: 0
  };

  ngOnInit() {
    this.fetchWarranties();
    this.fetchAMCs();
    this.fetchProducts();
  }

  // ==========================================
  // FETCH DATA
  // ==========================================
  async fetchWarranties() {
    this.loading.set(true);
    try {
      // Fetch expiring warranties
      const list = await this.erpService.getExpiringWarranties();
      this.expiringWarranties.set(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchAMCs() {
    try {
      const list = await this.erpService.getAMCs();
      this.amcs.set(list || []);
    } catch (e) {
      console.error(e);
    }
  }

  async fetchProducts() {
    try {
      const res = await this.productService.getProducts({ limit: 100 });
      this.products.set(res.products || []);
    } catch (e) {
      console.error(e);
    }
  }

  // ==========================================
  // REGISTER WARRANTY
  // ==========================================
  openRegisterWarranty() {
    this.registerForm = {
      productId: '',
      serialNumber: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      durationMonths: 12
    };
    this.showRegisterModal.set(true);
  }

  async registerWarranty() {
    const f = this.registerForm;
    if (!f.productId || !f.serialNumber || !f.customerName || f.durationMonths <= 0) {
      alert('Product, Serial number, Customer name, and Duration are required.');
      return;
    }

    try {
      await this.erpService.registerWarranty({
        productId: f.productId,
        serialNumber: f.serialNumber,
        customerName: f.customerName,
        customerEmail: f.customerEmail,
        customerPhone: f.customerPhone,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + f.durationMonths)).toISOString()
      });
      this.showRegisterModal.set(false);
      this.fetchWarranties();
      alert('Warranty registered successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to register warranty. Please check if serial is already registered.');
    }
  }

  // ==========================================
  // ANNUAL MAINTENANCE CONTRACTS (AMC)
  // ==========================================
  openRegisterAmc() {
    this.amcForm = {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      device: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      contractValue: 0
    };
    this.showAmcModal.set(true);
  }

  async registerAmc() {
    const f = this.amcForm;
    if (!f.customerName || !f.customerEmail || !f.device || f.contractValue <= 0) {
      alert('Customer Name, Email, Device, and Contract Value are required.');
      return;
    }

    try {
      await this.erpService.createAMC(f);
      this.showAmcModal.set(false);
      this.fetchAMCs();
      alert('AMC contract registered successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to register AMC.');
    }
  }

  // AMC Maintenance Logs
  openServiceAmc(amc: any) {
    this.selectedAmc.set(amc);
    this.serviceNote.set('');
    try {
      const history = JSON.parse(amc.serviceHistory);
      this.serviceHistoryList.set(Array.isArray(history) ? history : []);
    } catch (e) {
      this.serviceHistoryList.set([]);
    }
    this.showServiceModal.set(true);
  }

  async addServiceLog() {
    const note = this.serviceNote().trim();
    if (!note) {
      alert('Please enter a maintenance note.');
      return;
    }

    try {
      const res = await this.erpService.addAmcServiceHistory(this.selectedAmc().id, note);
      if (res && res.amc) {
        this.selectedAmc.set(res.amc);
        try {
          const history = JSON.parse(res.amc.serviceHistory);
          this.serviceHistoryList.set(Array.isArray(history) ? history : []);
        } catch (e) {
          this.serviceHistoryList.set([]);
        }
      }
      this.serviceNote.set('');
      this.fetchAMCs();
      alert('Service log recorded successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save service log.');
    }
  }

  openRenewAmc(amc: any) {
    this.selectedAmc.set(amc);
    this.renewForm = {
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      contractValue: amc.contractValue
    };
    this.showRenewModal.set(true);
  }

  async renewAmc() {
    try {
      await this.erpService.renewAMC(this.selectedAmc().id, this.renewForm);
      this.showRenewModal.set(false);
      this.fetchAMCs();
      alert('AMC contract renewed successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to renew AMC.');
    }
  }

  isAmcActive(amc: any): boolean {
    return new Date(amc.endDate) > new Date() && amc.status === 'ACTIVE';
  }
}
