import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ErpService } from '../../../services/erp.service';
import { ProductService, Product } from '../../../services/product.service';

@Component({
  selector: 'app-admin-vendors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendors.html'
})
export class AdminVendorsComponent implements OnInit {
  private erpService = inject(ErpService);
  private productService = inject(ProductService);

  activeTab = signal<'vendors' | 'pos'>('vendors');
  loading = signal<boolean>(false);

  // Vendor list and form signals
  vendors = signal<any[]>([]);
  showVendorModal = signal<boolean>(false);
  editingVendor = signal<any | null>(null);
  vendorForm = {
    name: '',
    contactPerson: '',
    mobile: '',
    email: '',
    gstNumber: '',
    address: ''
  };

  // Vendor Ledger signals
  showLedgerModal = signal<boolean>(false);
  selectedVendor = signal<any | null>(null);
  ledgerEntries = signal<any[]>([]);
  paymentForm = {
    amount: 0,
    reference: ''
  };

  // PO list and form signals
  purchaseOrders = signal<any[]>([]);
  products = signal<Product[]>([]);
  showPoModal = signal<boolean>(false);
  poForm = {
    vendorId: '',
    items: [] as { productId: string; quantity: number; costPrice: number }[]
  };

  // PO Receive signals
  showReceiveModal = signal<boolean>(false);
  receivingPo = signal<any | null>(null);
  receiveItems = signal<any[]>([]); // items with inputs for serials

  ngOnInit() {
    this.fetchVendors();
    this.fetchPurchaseOrders();
    this.fetchProducts();
  }

  // ==========================================
  // DATA FETCHING
  // ==========================================
  async fetchVendors() {
    this.loading.set(true);
    try {
      const list = await this.erpService.getVendors();
      this.vendors.set(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchPurchaseOrders() {
    try {
      const list = await this.erpService.getPurchaseOrders();
      this.purchaseOrders.set(list || []);
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
  // VENDOR CRUD
  // ==========================================
  openAddVendor() {
    this.editingVendor.set(null);
    this.vendorForm = { name: '', contactPerson: '', mobile: '', email: '', gstNumber: '', address: '' };
    this.showVendorModal.set(true);
  }

  openEditVendor(vendor: any) {
    this.editingVendor.set(vendor);
    this.vendorForm = { ...vendor };
    this.showVendorModal.set(true);
  }

  async saveVendor() {
    if (!this.vendorForm.name || !this.vendorForm.mobile || !this.vendorForm.email) {
      alert('Name, Mobile, and Email are required.');
      return;
    }

    try {
      if (this.editingVendor()) {
        await this.erpService.updateVendor(this.editingVendor().id, this.vendorForm);
      } else {
        await this.erpService.createVendor(this.vendorForm);
      }
      this.showVendorModal.set(false);
      this.fetchVendors();
    } catch (e) {
      console.error(e);
      alert('Failed to save vendor details.');
    }
  }

  async deleteVendor(id: string) {
    if (!confirm('Are you sure you want to delete this vendor and all their records?')) return;
    try {
      await this.erpService.deleteVendor(id);
      this.fetchVendors();
    } catch (e) {
      console.error(e);
      alert('Failed to delete vendor.');
    }
  }

  // ==========================================
  // VENDOR LEDGER & PAYMENTS
  // ==========================================
  async viewLedger(vendor: any) {
    this.selectedVendor.set(vendor);
    this.paymentForm = { amount: 0, reference: '' };
    this.loading.set(true);
    try {
      const list = await this.erpService.getVendorLedger(vendor.id);
      this.ledgerEntries.set(list || []);
      this.showLedgerModal.set(true);
    } catch (e) {
      console.error(e);
      alert('Failed to load ledger records.');
    } finally {
      this.loading.set(false);
    }
  }

  getLedgerBalance(): number {
    return this.ledgerEntries().reduce((sum, item) => sum + item.amount, 0);
  }

  async recordPayment() {
    const val = this.paymentForm.amount;
    if (val <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    try {
      // Payment reduces ledger liability (so we pass negative amount)
      await this.erpService.addVendorLedgerEntry(this.selectedVendor().id, {
        amount: -val,
        transactionType: 'PAYMENT',
        reference: this.paymentForm.reference
      });
      this.viewLedger(this.selectedVendor()); // reload
    } catch (e) {
      console.error(e);
      alert('Failed to record payment.');
    }
  }

  // ==========================================
  // PURCHASE ORDERS (PO)
  // ==========================================
  openAddPo() {
    this.poForm = {
      vendorId: '',
      items: [{ productId: '', quantity: 1, costPrice: 0 }]
    };
    this.showPoModal.set(true);
  }

  addPoItem() {
    this.poForm.items.push({ productId: '', quantity: 1, costPrice: 0 });
  }

  removePoItem(idx: number) {
    this.poForm.items.splice(idx, 1);
  }

  async savePo() {
    if (!this.poForm.vendorId || this.poForm.items.length === 0) {
      alert('Please select a vendor and add at least one item.');
      return;
    }

    // validate items
    const invalid = this.poForm.items.some(i => !i.productId || i.quantity <= 0 || i.costPrice <= 0);
    if (invalid) {
      alert('Please fill out all product, quantity, and cost fields with positive numbers.');
      return;
    }

    try {
      await this.erpService.createPurchaseOrder(this.poForm);
      this.showPoModal.set(false);
      this.fetchPurchaseOrders();
    } catch (e) {
      console.error(e);
      alert('Failed to create purchase order.');
    }
  }

  async approvePo(po: any) {
    try {
      await this.erpService.updatePurchaseOrder(po.id, { status: 'APPROVED' });
      this.fetchPurchaseOrders();
    } catch (e) {
      console.error(e);
      alert('Failed to approve purchase order.');
    }
  }

  async cancelPo(po: any) {
    if (!confirm('Are you sure you want to cancel this PO?')) return;
    try {
      await this.erpService.updatePurchaseOrder(po.id, { status: 'CANCELLED' });
      this.fetchPurchaseOrders();
    } catch (e) {
      console.error(e);
      alert('Failed to cancel purchase order.');
    }
  }

  // ==========================================
  // RECEIVING PO & SERIALS MAPPING
  // ==========================================
  openReceivePo(po: any) {
    this.receivingPo.set(po);
    const items = po.items.map((item: any) => {
      const serials = Array.from({ length: item.quantity }, () => '');
      return {
        productId: item.productId,
        productName: item.product?.name || 'Item',
        quantity: item.quantity,
        costPrice: item.costPrice,
        serialNumbers: serials
      };
    });
    this.receiveItems.set(items);
    this.showReceiveModal.set(true);
  }

  async confirmReceive() {
    // Validate that all serials are filled in
    for (const item of this.receiveItems()) {
      const empty = item.serialNumbers.some((s: string) => !s.trim());
      if (empty) {
        alert(`Please input all serial numbers for: ${item.productName}`);
        return;
      }
    }

    try {
      const payload = this.receiveItems().map(item => ({
        productId: item.productId,
        receivedQty: item.quantity,
        serialNumbers: item.serialNumbers.map((s: string) => s.trim())
      }));

      await this.erpService.receivePurchaseOrder(this.receivingPo().id, payload);
      this.showReceiveModal.set(false);
      this.fetchPurchaseOrders();
      this.fetchVendors(); // reload vendor ledgers since PO receipt bills the ledger
      alert('Purchase order inventory successfully received and logged!');
    } catch (e: any) {
      console.error(e);
      alert(e.error || 'Failed to complete PO stock receipt.');
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
