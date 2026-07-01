// src/app/services/auth.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN' | 'TECHNICIAN' | 'SERVICE_MANAGER';
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private currentUser = signal<User | null>(null);
  private loadingUser = signal<boolean>(true);

  constructor() {
    this.checkSession();
  }

  get user() {
    return this.currentUser.asReadonly();
  }

  get loading() {
    return this.loadingUser.asReadonly();
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
  }

  async ensureCsrfCookie(): Promise<void> {
    if (!this.getCookie('XSRF-TOKEN')) {
      try {
        // Fetch health endpoint to initialize the CSRF cookie
        await firstValueFrom(
          this.http.get(`${environment.apiUrl}/health`, { withCredentials: true })
        );
      } catch (e) {
        console.error('Failed to initialize CSRF cookie', e);
      }
    }
  }

  async checkSession() {
    try {
      const res = await firstValueFrom(
        this.http.get<{ user: User | null }>(`${this.apiUrl}/me`, { withCredentials: true })
      );
      this.currentUser.set(res.user);
    } catch (e) {
      console.error('Check session failed', e);
      this.currentUser.set(null);
    } finally {
      this.loadingUser.set(false);
    }
  }

  async login(email: string, password: string, rememberMe: boolean = false): Promise<any> {
    try {
      await this.ensureCsrfCookie();
      const res = await firstValueFrom(
        this.http.post<{ message: string; user: User }>(`${this.apiUrl}/login`, { email, password, rememberMe }, { withCredentials: true })
      );
      this.currentUser.set(res.user);
      return res;
    } catch (error: any) {
      this.currentUser.set(null);
      throw error.error || { error: 'Login failed' };
    }
  }

  async register(name: string, email: string, password: string): Promise<any> {
    try {
      await this.ensureCsrfCookie();
      const res = await firstValueFrom(
        this.http.post<{ message: string; user: User }>(`${this.apiUrl}/register`, { name, email, password }, { withCredentials: true })
      );
      this.currentUser.set(res.user);
      return res;
    } catch (error: any) {
      this.currentUser.set(null);
      throw error.error || { error: 'Registration failed' };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.ensureCsrfCookie();
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      );
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      this.currentUser.set(null);
    }
  }

  async updateProfileDirect(name: string, email: string): Promise<any> {
    try {
      await this.ensureCsrfCookie();
      const res = await firstValueFrom(
        this.http.put<{ message: string; user: User }>(`${this.apiUrl}/profile`, { name, email }, { withCredentials: true })
      );
      this.currentUser.set(res.user);
      return res;
    } catch (error: any) {
      throw error.error || { error: 'Failed to update profile' };
    }
  }

  async changePasswordDirect(currentPassword: string, newPassword: string): Promise<any> {
    try {
      await this.ensureCsrfCookie();
      return await firstValueFrom(
        this.http.put(`${this.apiUrl}/change-password`, { currentPassword, newPassword }, { withCredentials: true })
      );
    } catch (error: any) {
      throw error.error || { error: 'Failed to update password' };
    }
  }
}
