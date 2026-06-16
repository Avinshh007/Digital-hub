// src/app/components/pc-builder/pc-builder.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';
import { ErpService } from '../../services/erp.service';
import { AuthService } from '../../services/auth.service';

export type BuilderStep = 'cpu' | 'motherboard' | 'ram' | 'gpu' | 'storage' | 'psu' | 'case';

@Component({
  selector: 'app-pc-builder',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pc-builder.html',
})
export class PcBuilderComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private langService = inject(LanguageService);
  private erpService = inject(ErpService);
  private authService = inject(AuthService);

  // Theme & Language context
  theme = this.themeService.theme;
  t = this.langService.t;
  user = this.authService.user;

  // Selections list signals
  selectedCpu = signal<Product | null>(null);
  selectedMotherboard = signal<Product | null>(null);
  selectedRam = signal<Product | null>(null);
  selectedGpu = signal<Product | null>(null);
  selectedStorage = signal<Product | null>(null);
  selectedPsu = signal<Product | null>(null);
  selectedCase = signal<Product | null>(null);

  // Available options
  cpus = signal<Product[]>([]);
  motherboards = signal<Product[]>([]);
  rams = signal<Product[]>([]);
  gpus = signal<Product[]>([]);
  storages = signal<Product[]>([]);
  psus = signal<Product[]>([]);
  cases = signal<Product[]>([]);
  assemblyService = signal<Product | null>(null);

  loading = signal<boolean>(true);
  activeStep = signal<BuilderStep>('cpu');

  // Save/Load dialog fields
  showSaveModal = signal<boolean>(false);
  showLoadModal = signal<boolean>(false);
  buildName = signal<string>('');
  loadBuildId = signal<string>('');
  saveMessage = signal<string>('');
  loadMessage = signal<string>('');
  myBuilds = signal<any[]>([]);
  bundles = signal<any[]>([]);

  ngOnInit() {
    this.fetchComponentsData();
    this.fetchBundles();
    if (this.user()) {
      this.fetchSavedBuilds();
    }
  }

  async fetchComponentsData() {
    this.loading.set(true);
    try {
      const [cpusRes, mbRes, ramRes, gpusRes, storageRes, psuRes, casesRes, serviceRes] = await Promise.all([
        this.productService.getProducts({ category: 'processors' }),
        this.productService.getProducts({ category: 'motherboards' }),
        this.productService.getProducts({ category: 'memory' }),
        this.productService.getProducts({ category: 'graphics-cards' }),
        this.productService.getProducts({ category: 'storage' }),
        this.productService.getProducts({ category: 'power-supplies' }),
        this.productService.getProducts({ category: 'cabinets' }),
        this.productService.getProducts({ q: 'Assembly' })
      ]);

      this.cpus.set(cpusRes.products || []);
      this.motherboards.set(mbRes.products || []);
      this.rams.set(ramRes.products || []);
      this.gpus.set(gpusRes.products || []);
      this.storages.set(storageRes.products || []);
      this.psus.set(psuRes.products || []);
      this.cases.set(casesRes.products || []);
      
      if (serviceRes.products && serviceRes.products.length > 0) {
        this.assemblyService.set(serviceRes.products[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchSavedBuilds() {
    try {
      const list = await this.erpService.getMySavedBuilds();
      this.myBuilds.set(list || []);
    } catch (e) {
      console.error('Failed to load user saved builds', e);
    }
  }

  async fetchBundles() {
    try {
      const list = await this.erpService.getBundles();
      this.bundles.set(list || []);
    } catch (e) {
      console.error('Failed to load bundles', e);
    }
  }

  // Spec helper extractor
  getSpecValue(product: Product | null, searchKeys: string[]): string {
    if (!product) return '';
    try {
      const parsed = JSON.parse(product.specs);
      for (const key of searchKeys) {
        const match = Object.keys(parsed).find(k => k.toLowerCase() === key.toLowerCase());
        if (match) return String(parsed[match]);
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  // Compatibility Warnings Computed Signal
  compatibilityWarnings = computed(() => {
    const warnings: string[] = [];
    const cpu = this.selectedCpu();
    const mb = this.selectedMotherboard();
    const ram = this.selectedRam();
    const gpu = this.selectedGpu();
    const psu = this.selectedPsu();

    // 1. Socket Check
    if (cpu && mb) {
      const cpuSocket = this.getSpecValue(cpu, ['socket', 'socket type', 'socket compatibility']).toLowerCase().trim();
      const mbSocket = this.getSpecValue(mb, ['socket', 'socket type', 'socket compatibility']).toLowerCase().trim();
      if (cpuSocket && mbSocket && !cpuSocket.includes(mbSocket) && !mbSocket.includes(cpuSocket)) {
        warnings.push(`Socket Mismatch: CPU has socket '${cpuSocket.toUpperCase()}' but Motherboard is '${mbSocket.toUpperCase()}'.`);
      }
    }

    // 2. RAM Type Check
    if (mb && ram) {
      const mbRamType = this.getSpecValue(mb, ['ram type', 'memory type', 'ram standard', 'memory standard', 'slots type']).toUpperCase();
      const ramType = this.getSpecValue(ram, ['ram type', 'memory type', 'ram standard', 'memory standard', 'type']).toUpperCase();
      
      const mbDdr = mbRamType.match(/DDR\d/)?.[0] || '';
      const ramDdr = ramType.match(/DDR\d/)?.[0] || '';
      
      if (mbDdr && ramDdr && mbDdr !== ramDdr) {
        warnings.push(`RAM Generation Mismatch: Motherboard requires '${mbDdr}' but selected memory is '${ramDdr}'.`);
      }
    }

    // 3. PSU Wattage Check
    if (psu) {
      const psuWattageStr = this.getSpecValue(psu, ['wattage', 'power output', 'capacity', 'power', 'total power']);
      const psuWattage = parseInt(psuWattageStr.replace(/\D/g, '')) || 0;

      if (psuWattage > 0) {
        let estPower = 120; // 120W buffer for MB, SSD, Fans, RAM
        if (cpu) {
          const cpuPowerStr = this.getSpecValue(cpu, ['tdp', 'power draw', 'wattage', 'power consumption', 'max power']);
          estPower += parseInt(cpuPowerStr.replace(/\D/g, '')) || 65;
        }
        if (gpu) {
          const gpuPowerStr = this.getSpecValue(gpu, ['tdp', 'power draw', 'wattage', 'power consumption', 'gpu power']);
          estPower += parseInt(gpuPowerStr.replace(/\D/g, '')) || 150;
        }

        const recommendedPsu = Math.ceil((estPower * 1.25) / 50) * 50; // 25% safety overhead rounded to 50W
        if (psuWattage < estPower) {
          warnings.push(`Critical Power Warning: Est. power draw is ${estPower}W, but selected PSU only supports ${psuWattage}W. The system will crash under load!`);
        } else if (psuWattage < recommendedPsu) {
          warnings.push(`Low Power Overhead: System needs ${estPower}W. We recommend a ${recommendedPsu}W+ PSU for optimal health. Current: ${psuWattage}W.`);
        }
      }
    }

    return warnings;
  });

  // Check socket compatibility on display selection
  getSocket(product: Product | null): string {
    return this.getSpecValue(product, ['socket', 'socket type', 'socket compatibility']);
  }

  isMotherboardCompatible(mb: Product): boolean {
    const cpu = this.selectedCpu();
    if (!cpu) return true;
    const cpuSocket = this.getSpecValue(cpu, ['socket', 'socket type']).toLowerCase().trim();
    const mbSocket = this.getSpecValue(mb, ['socket', 'socket type']).toLowerCase().trim();
    if (!cpuSocket || !mbSocket) return true;
    return cpuSocket.includes(mbSocket) || mbSocket.includes(cpuSocket);
  }

  // Step selection managers
  selectItem(step: BuilderStep, item: Product) {
    if (step === 'cpu') {
      this.selectedCpu.set(item);
      const mb = this.selectedMotherboard();
      if (mb && !this.isMotherboardCompatible(mb)) {
        this.selectedMotherboard.set(null);
      }
    }
    if (step === 'motherboard') this.selectedMotherboard.set(item);
    if (step === 'ram') this.selectedRam.set(item);
    if (step === 'gpu') this.selectedGpu.set(item);
    if (step === 'storage') this.selectedStorage.set(item);
    if (step === 'psu') this.selectedPsu.set(item);
    if (step === 'case') this.selectedCase.set(item);
  }

  removeItem(step: BuilderStep) {
    if (step === 'cpu') {
      this.selectedCpu.set(null);
      this.selectedMotherboard.set(null);
    }
    if (step === 'motherboard') this.selectedMotherboard.set(null);
    if (step === 'ram') this.selectedRam.set(null);
    if (step === 'gpu') this.selectedGpu.set(null);
    if (step === 'storage') this.selectedStorage.set(null);
    if (step === 'psu') this.selectedPsu.set(null);
    if (step === 'case') this.selectedCase.set(null);
  }

  setActiveStep(step: string) {
    this.activeStep.set(step as BuilderStep);
  }

  // Selections list
  selectedParts = computed(() => {
    const list = [];
    if (this.selectedCpu()) list.push(this.selectedCpu()!);
    if (this.selectedMotherboard()) list.push(this.selectedMotherboard()!);
    if (this.selectedRam()) list.push(this.selectedRam()!);
    if (this.selectedGpu()) list.push(this.selectedGpu()!);
    if (this.selectedStorage()) list.push(this.selectedStorage()!);
    if (this.selectedPsu()) list.push(this.selectedPsu()!);
    if (this.selectedCase()) list.push(this.selectedCase()!);
    return list;
  });

  subtotal = computed(() => {
    let sum = this.selectedParts().reduce((acc, p) => acc + p.price, 0);
    if (this.selectedParts().length > 0 && this.assemblyService()) {
      sum += this.assemblyService()!.price;
    }
    return sum;
  });

  taxAmount = computed(() => {
    return this.selectedParts().reduce((acc, p) => {
      const rate = p.gstRate || 18.0;
      const base = p.price / (1 + rate / 100);
      return acc + (p.price - base);
    }, 0) + (this.assemblyService() ? (this.assemblyService()!.price - (this.assemblyService()!.price / 1.18)) : 0);
  });

  isConfigComplete = computed(() => {
    return (
      this.selectedCpu() !== null &&
      this.selectedMotherboard() !== null &&
      this.selectedRam() !== null &&
      this.selectedStorage() !== null &&
      this.selectedPsu() !== null &&
      this.selectedCase() !== null
    );
  });

  // Add configuration items to cart
  addAllToCart() {
    if (this.selectedParts().length === 0) return;

    for (const item of this.selectedParts()) {
      const parsedImage = this.parseProductImage(item.images);
      this.cartService.addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        image: parsedImage,
        stock: item.stock,
        sku: item.sku,
        gstRate: item.gstRate,
      });
    }

    const service = this.assemblyService();
    if (service) {
      this.cartService.addToCart({
        id: service.id,
        name: service.name,
        price: service.price,
        originalPrice: service.originalPrice,
        image: this.parseProductImage(service.images),
        stock: service.stock,
        sku: service.sku,
        gstRate: service.gstRate,
      });
    }

    alert('Your custom PC configuration has been added to your shopping cart!');
    this.router.navigate(['/cart']);
  }

  // Load a dynamic system package bundle
  async loadBundle(bundle: any) {
    if (!bundle || !bundle.items) return;
    
    // Clear current choices
    this.selectedCpu.set(null);
    this.selectedMotherboard.set(null);
    this.selectedRam.set(null);
    this.selectedGpu.set(null);
    this.selectedStorage.set(null);
    this.selectedPsu.set(null);
    this.selectedCase.set(null);

    // Apply bundle components
    for (const item of bundle.items) {
      const cat = item.category?.slug;
      if (cat === 'processors') this.selectedCpu.set(item);
      else if (cat === 'motherboards') this.selectedMotherboard.set(item);
      else if (cat === 'memory') this.selectedRam.set(item);
      else if (cat === 'graphics-cards') this.selectedGpu.set(item);
      else if (cat === 'storage') this.selectedStorage.set(item);
      else if (cat === 'power-supplies') this.selectedPsu.set(item);
      else if (cat === 'cabinets') this.selectedCase.set(item);
    }
    
    alert(`Successfully loaded: "${bundle.name}". Adjust parts as you like!`);
  }

  // Save Current PC Build profile
  async saveCurrentBuild() {
    const name = this.buildName().trim();
    if (!name) {
      this.saveMessage.set('Please enter a name for your configuration.');
      return;
    }

    try {
      const res = await this.erpService.saveBuild({
        name,
        cpuId: this.selectedCpu()?.id,
        motherboardId: this.selectedMotherboard()?.id,
        ramId: this.selectedRam()?.id,
        gpuId: this.selectedGpu()?.id,
        storageId: this.selectedStorage()?.id,
        psuId: this.selectedPsu()?.id,
        caseId: this.selectedCase()?.id
      });
      
      this.saveMessage.set(`Build saved successfully! Code ID: ${res.build.id}`);
      this.buildName.set('');
      if (this.user()) {
        this.fetchSavedBuilds();
      }
      setTimeout(() => this.showSaveModal.set(false), 2500);
    } catch (err: any) {
      console.error(err);
      this.saveMessage.set(err.error || 'Failed to save build configuration.');
    }
  }

  // Load a custom PC build by unique ID string
  async loadCustomBuild(buildId: string) {
    const cleanId = buildId.trim();
    if (!cleanId) {
      this.loadMessage.set('Please enter a valid Save Code.');
      return;
    }

    this.loading.set(true);
    try {
      const res = await this.erpService.loadBuild(cleanId);
      
      // Clear current choices
      this.selectedCpu.set(null);
      this.selectedMotherboard.set(null);
      this.selectedRam.set(null);
      this.selectedGpu.set(null);
      this.selectedStorage.set(null);
      this.selectedPsu.set(null);
      this.selectedCase.set(null);

      // Map loaded products
      const products: Product[] = res.products || [];
      const build = res.build;

      for (const p of products) {
        if (p.id === build.cpuId) this.selectedCpu.set(p);
        else if (p.id === build.motherboardId) this.selectedMotherboard.set(p);
        else if (p.id === build.ramId) this.selectedRam.set(p);
        else if (p.id === build.gpuId) this.selectedGpu.set(p);
        else if (p.id === build.storageId) this.selectedStorage.set(p);
        else if (p.id === build.psuId) this.selectedPsu.set(p);
        else if (p.id === build.caseId) this.selectedCase.set(p);
      }

      this.loadMessage.set('PC build configuration loaded successfully!');
      setTimeout(() => {
        this.showLoadModal.set(false);
        this.loadMessage.set('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      this.loadMessage.set(err.error || 'Saved configuration not found.');
    } finally {
      this.loading.set(false);
    }
  }

  parseProductImage(imagesStr: string): string {
    try {
      const parsed = JSON.parse(imagesStr);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '/uploads/hero_banner.jpg';
    } catch (e) {
      return '/uploads/hero_banner.jpg';
    }
  }

  parseProductSpecs(specsStr: string): { key: string; val: string }[] {
    try {
      const parsed = JSON.parse(specsStr);
      return Object.entries(parsed).map(([key, val]) => ({ key, val: String(val) })).slice(0, 3);
    } catch (e) {
      return [];
    }
  }
}
