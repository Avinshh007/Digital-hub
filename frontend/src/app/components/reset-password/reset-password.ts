// src/app/components/reset-password/reset-password.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LanguageService } from '../../services/language.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private langService = inject(LanguageService);
  private authService = inject(AuthService);

  t = this.langService.t;

  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  loading = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.email.trim() || !this.otp.trim() || !this.newPassword.trim()) {
      this.error.set('All fields are required.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.error.set('Password must be at least 6 characters long.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.success.set(null);
    this.error.set(null);

    try {
      await this.authService.ensureCsrfCookie();
      const res = await firstValueFrom(
        this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, {
          email: this.email.trim(),
          otp: this.otp.trim(),
          newPassword: this.newPassword
        })
      );
      this.success.set(res.message);
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    } catch (err: any) {
      this.error.set(err.error || 'Failed to reset password.');
    } finally {
      this.loading.set(false);
    }
  }
}
