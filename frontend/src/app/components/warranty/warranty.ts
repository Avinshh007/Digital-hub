import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ErpService } from '../../services/erp.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-warranty-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warranty.html'
})
export class WarrantyComponent {
  private erpService = inject(ErpService);
  private themeService = inject(ThemeService);

  theme = this.themeService.theme;

  serialNumber = signal<string>('');
  loading = signal<boolean>(false);
  warranty = signal<any | null>(null);
  error = signal<string>('');

  async checkWarranty() {
    const serial = this.serialNumber().trim();
    if (!serial) {
      this.error.set('Please enter a hardware serial number.');
      this.warranty.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.warranty.set(null);

    try {
      const data = await this.erpService.checkWarranty(serial);
      if (data) {
        this.warranty.set(data);
      } else {
        this.error.set('Serial number not found or has no active warranty contract.');
      }
    } catch (err: any) {
      console.error(err);
      this.error.set(err.error || 'Failed to verify warranty.');
    } finally {
      this.loading.set(false);
    }
  }

  // Draw and download warranty certificate
  downloadCertificate() {
    const w = this.warranty();
    if (!w) return;

    // Create virtual canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background certificate border
    const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(1, '#1e293b'); // slate-800
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);

    // Decorative outer gold border
    ctx.strokeStyle = '#d97706'; // amber-600
    ctx.lineWidth = 15;
    ctx.strokeRect(30, 30, 1140, 740);

    ctx.strokeStyle = '#f59e0b'; // amber-500
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, 1110, 710);

    // Typography setup & Brand header
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(' DIGITAL HUB', 600, 120);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText('OFFICIAL WARRANTY & AVAILABILITY CERTIFICATE', 600, 160);

    // Certificate details title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'normal 48px Georgia, serif';
    ctx.fillText('Certificate of Warranty Coverage', 600, 260);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText('This document certifies that the hardware item described below has been registered under', 600, 320);
    ctx.fillText('active support warranty matching the manufacturer guidelines.', 600, 350);

    // Grid details box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(150, 400, 900, 200);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(150, 400, 900, 200);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px sans-serif';

    // Left Column
    ctx.fillText('HARDWARE ITEM:', 180, 440);
    ctx.fillText('SERIAL NUMBER:', 180, 490);
    ctx.fillText('REGISTERED TO:', 180, 540);

    // Right Column
    ctx.fillText('COVERAGE START:', 620, 440);
    ctx.fillText('COVERAGE END:', 620, 490);
    ctx.fillText('CONTRACT STATUS:', 620, 540);

    // Populate data values
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText(w.product?.name || 'Computer Component', 320, 440);
    ctx.fillText(w.serialNumber, 320, 490);
    ctx.fillText(w.customerName || 'Retail Customer', 320, 540);

    const start = new Date(w.startDate).toLocaleDateString('en-IN', { dateStyle: 'long' });
    const end = new Date(w.endDate).toLocaleDateString('en-IN', { dateStyle: 'long' });
    ctx.fillText(start, 790, 440);
    ctx.fillText(end, 790, 490);

    // Status Badge
    const isActive = new Date(w.endDate) > new Date() && w.status === 'ACTIVE';
    ctx.fillStyle = isActive ? '#10b981' : '#f43f5e'; // emerald or rose
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(isActive ? 'ACTIVE / COVERED' : 'EXPIRED / VOID', 790, 540);

    // Signatures footer
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Authorized Signature', 300, 700);
    ctx.fillText(' DIGITAL HUBERP system verified log', 900, 700);

    // Draw lines for signature
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(200, 680);
    ctx.lineTo(400, 680);
    ctx.moveTo(800, 680);
    ctx.lineTo(1000, 680);
    ctx.stroke();

    // Trigger download
    const link = document.createElement('a');
    link.download = `warranty_cert_${w.serialNumber}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }
}
