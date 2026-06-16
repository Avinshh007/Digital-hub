import { TestBed } from '@angular/core/testing';
import { PcBuilderComponent } from './pc-builder';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Product } from '../../services/product.service';

describe('PcBuilderComponent Compatibility Logic', () => {
  let component: PcBuilderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PcBuilderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PcBuilderComponent);
    component = fixture.componentInstance;
  });

  it('should detect socket mismatch between CPU and motherboard', () => {
    const mockCpu = {
      id: 'cpu-1',
      name: 'Intel Core i7-13700K',
      description: 'Intel CPU',
      price: 350,
      originalPrice: 350,
      stock: 10,
      sku: 'CPU13700K',
      gstRate: 18.0,
      categoryId: 'cat-cpu',
      brandId: 'brand-intel',
      images: '[]',
      specs: JSON.stringify({ 'Socket': 'LGA1700' }),
      rating: 0,
      ratingCount: 0,
      status: 'ACTIVE',
      source: 'MANUAL',
    } as any as Product;

    const mockMotherboard = {
      id: 'mb-1',
      name: 'ASUS ROG AM5 Motherboard',
      description: 'AM5 Motherboard',
      price: 200,
      originalPrice: 200,
      stock: 5,
      sku: 'MBASUSAM5',
      gstRate: 18.0,
      categoryId: 'cat-mb',
      brandId: 'brand-asus',
      images: '[]',
      specs: JSON.stringify({ 'Socket': 'AM5' }),
      rating: 0,
      ratingCount: 0,
      status: 'ACTIVE',
      source: 'MANUAL',
    } as any as Product;

    component.selectedCpu.set(mockCpu);
    component.selectedMotherboard.set(mockMotherboard);

    const warnings = component.compatibilityWarnings();
    expect(warnings.some(w => w.includes('Socket Mismatch'))).toBe(true);
  });

  it('should detect RAM generation mismatch between motherboard and RAM', () => {
    const mockMotherboard = {
      id: 'mb-1',
      name: 'ASUS ROG DDR5 Motherboard',
      description: 'DDR5 MB',
      price: 200,
      originalPrice: 200,
      stock: 5,
      sku: 'MBDDR5',
      gstRate: 18.0,
      categoryId: 'cat-mb',
      brandId: 'brand-asus',
      images: '[]',
      specs: JSON.stringify({ 'RAM Type': 'DDR5' }),
      rating: 0,
      ratingCount: 0,
      status: 'ACTIVE',
      source: 'MANUAL',
    } as any as Product;

    const mockRam = {
      id: 'ram-1',
      name: 'Corsair Vengeance DDR4 16GB',
      description: 'DDR4 RAM',
      price: 80,
      originalPrice: 80,
      stock: 15,
      sku: 'RAMDDR4',
      gstRate: 18.0,
      categoryId: 'cat-ram',
      brandId: 'brand-corsair',
      images: '[]',
      specs: JSON.stringify({ 'Memory Type': 'DDR4' }),
      rating: 0,
      ratingCount: 0,
      status: 'ACTIVE',
      source: 'MANUAL',
    } as any as Product;

    component.selectedMotherboard.set(mockMotherboard);
    component.selectedRam.set(mockRam);

    const warnings = component.compatibilityWarnings();
    expect(warnings.some(w => w.includes('RAM Generation Mismatch'))).toBe(true);
  });

  it('should trigger warnings for insufficient PSU capacity and low power overhead', () => {
    const mockCpu = {
      id: 'cpu-1',
      name: 'Power Hungry CPU',
      description: 'TDP 125W',
      price: 300,
      originalPrice: 300,
      stock: 10,
      sku: 'CPU125W',
      gstRate: 18.0,
      categoryId: 'cat-cpu',
      brandId: 'brand-intel',
      images: '[]',
      specs: JSON.stringify({ 'TDP': '125W' }),
      rating: 0,
      ratingCount: 0,
      status: 'ACTIVE',
      source: 'MANUAL',
    } as any as Product;

    const mockGpu = {
      id: 'gpu-1',
      name: 'Power Hungry GPU',
      description: 'TDP 300W',
      price: 800,
      originalPrice: 800,
      stock: 5,
      sku: 'GPU300W',
      gstRate: 18.0,
      categoryId: 'cat-gpu',
      brandId: 'brand-nvidia',
      images: '[]',
      specs: JSON.stringify({ 'TDP': '300W' }),
      rating: 0,
      ratingCount: 0,
      status: 'ACTIVE',
      source: 'MANUAL',
    } as any as Product;

    // Est power = 120 (buffer) + 125 (CPU) + 300 (GPU) = 545W.
    // Recommended PSU = Math.ceil((545 * 1.25) / 50) * 50 = Math.ceil(681.25 / 50) * 50 = 700W.

    // Scenario A: 500W PSU (less than 545W est power) -> Critical warning
    const mockPsu500 = {
      id: 'psu-500',
      name: '500W PSU',
      description: '500W PSU',
      price: 50,
      originalPrice: 50,
      stock: 10,
      sku: 'PSU500W',
      gstRate: 18.0,
      categoryId: 'cat-psu',
      brandId: 'brand-corsair',
      images: '[]',
      specs: JSON.stringify({ 'Wattage': '500W' }),
      rating: 0,
      ratingCount: 0,
      status: 'ACTIVE',
      source: 'MANUAL',
    } as any as Product;

    component.selectedCpu.set(mockCpu);
    component.selectedGpu.set(mockGpu);
    component.selectedPsu.set(mockPsu500);

    let warnings = component.compatibilityWarnings();
    expect(warnings.some(w => w.includes('Critical Power Warning'))).toBe(true);

    // Scenario B: 600W PSU (more than 545W est power, but less than 700W recommended) -> Low Power Overhead
    const mockPsu600 = {
      id: 'psu-600',
      name: '600W PSU',
      description: '600W PSU',
      price: 70,
      originalPrice: 70,
      stock: 10,
      sku: 'PSU600W',
      gstRate: 18.0,
      categoryId: 'cat-psu',
      brandId: 'brand-corsair',
      images: '[]',
      specs: JSON.stringify({ 'Wattage': '600W' }),
      rating: 0,
      ratingCount: 0,
      status: 'ACTIVE',
      source: 'MANUAL',
    } as any as Product;

    component.selectedPsu.set(mockPsu600);
    warnings = component.compatibilityWarnings();
    expect(warnings.some(w => w.includes('Low Power Overhead'))).toBe(true);

    // Scenario C: 750W PSU (more than 700W recommended) -> No warnings
    const mockPsu750 = {
      id: 'psu-750',
      name: '750W PSU',
      description: '750W PSU',
      price: 100,
      originalPrice: 100,
      stock: 10,
      sku: 'PSU750W',
      gstRate: 18.0,
      categoryId: 'cat-psu',
      brandId: 'brand-corsair',
      images: '[]',
      specs: JSON.stringify({ 'Wattage': '750W' }),
      rating: 0,
      ratingCount: 0,
      status: 'ACTIVE',
      source: 'MANUAL',
    } as any as Product;

    component.selectedPsu.set(mockPsu750);
    warnings = component.compatibilityWarnings();
    expect(warnings.length).toBe(0);
  });
});
