// src/app/components/verify-email/verify-email.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-email.html',
})
export class VerifyEmailComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  email = '';
  otp = '';
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
    if (!this.email.trim() || !this.otp.trim()) return;

    this.loading.set(true);
    this.success.set(null);
    this.error.set(null);

    try {
      await this.authService.ensureCsrfCookie();
      const res = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/auth/verify-email`, {
          email: this.email.trim(),
          otp: this.otp.trim()
        }, { withCredentials: true })
      );
      this.success.set(res.message);
      
      // Load user profile details into session
      await this.authService.checkSession();

      setTimeout(() => {
        this.router.navigate(['/profile']);
      }, 2000);
    } catch (err: any) {
      this.error.set(err.error || 'OTP verification failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
