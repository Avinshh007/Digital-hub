// src/app/components/forgot-password/forgot-password.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LanguageService } from '../../services/language.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  private http = inject(HttpClient);
  private langService = inject(LanguageService);
  private authService = inject(AuthService);
  private router = inject(Router);

  t = this.langService.t;

  email = '';
  loading = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  async handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.email.trim()) return;

    this.loading.set(true);
    this.success.set(null);
    this.error.set(null);

    try {
      await this.authService.ensureCsrfCookie();
      const res = await firstValueFrom(
        this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email: this.email.trim() })
      );
      this.success.set('OTP verification code sent! Redirecting to reset page...');
      setTimeout(() => {
        this.router.navigate(['/reset-password'], { queryParams: { email: this.email.trim() } });
      }, 2000);
    } catch (err: any) {
      this.error.set(err.error || 'Failed to send reset OTP code.');
    } finally {
      this.loading.set(false);
    }
  }
}
