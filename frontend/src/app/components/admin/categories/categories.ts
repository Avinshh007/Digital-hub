// src/app/components/admin/categories/categories.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
})
export class AdminCategoriesComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/categories`;

  categories = signal<Category[]>([]);
  loading = signal(true);

  // Form State
  formOpen = signal(false);
  editMode = signal(false);
  selectedId = signal<string | null>(null);
  name = '';
  slug = '';
  image = '';

  ngOnInit() {
    this.fetchCategories();
  }

  async fetchCategories() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<Category[]>(this.apiUrl, { withCredentials: true })
      );
      this.categories.set(res || []);
    } catch (e) {
      console.error('Fetch admin categories failed', e);
    } finally {
      this.loading.set(false);
    }
  }

  openAddForm() {
    this.editMode.set(false);
    this.selectedId.set(null);
    this.name = '';
    this.slug = '';
    this.image = '';
    this.formOpen.set(true);
  }

  openEditForm(cat: Category) {
    this.editMode.set(true);
    this.selectedId.set(cat.id);
    this.name = cat.name;
    this.slug = cat.slug;
    this.image = cat.image || '';
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
  }

  async handleSave(e: Event) {
    e.preventDefault();
    if (!this.name || !this.slug) return;

    const payload = {
      name: this.name.trim(),
      slug: this.slug.trim().toLowerCase(),
      image: this.image.trim() || undefined
    };

    try {
      if (this.editMode()) {
        await firstValueFrom(
          this.http.put(`${this.apiUrl}/${this.selectedId()}`, payload, { withCredentials: true })
        );
      } else {
        await firstValueFrom(
          this.http.post(this.apiUrl, payload, { withCredentials: true })
        );
      }
      this.closeForm();
      this.fetchCategories();
    } catch (err: any) {
      alert(err.error?.error || 'Failed to save category.');
    }
  }

  async handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true })
      );
      this.fetchCategories();
    } catch (e) {
      console.error(e);
      alert('Failed to delete category.');
    }
  }
}
