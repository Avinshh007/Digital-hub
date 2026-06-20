// src/app/components/login/login.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/10 dark:from-slate-950 dark:via-indigo-950/20 dark:to-purple-950/10 px-4 py-20 relative pt-24">
      <!-- Ambient blur background -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div class="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-indigo-300/10 dark:bg-indigo-500/5 blur-[100px]"></div>
        <div class="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-fuchsia-300/10 dark:bg-fuchsia-500/5 blur-[100px]"></div>
      </div>

      <div class="w-full max-w-md glass-panel p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative group">
        <div class="text-center space-y-3 mb-8">
          <h2 class="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Login to    DIGITAL HUB</h2>
          <p class="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">Welcome back to premium tech shopping</p>
        </div>

        <!-- Error box -->
        <div *ngIf="error()" class="bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 rounded-2xl p-4 text-xs font-bold mb-6 animate-fade-in">
          {{ error() }}
        </div>

        <form (submit)="handleLogin($event)" class="space-y-6">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Email Address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full bg-slate-50/50 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 text-sm font-semibold text-slate-800 dark:text-slate-100 transition-all placeholder-slate-400"
              placeholder="name@  DIGITAL HUB.com"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="w-full bg-slate-50/50 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 text-sm font-semibold text-slate-800 dark:text-slate-100 transition-all placeholder-slate-400"
              placeholder="••••••••"
            />
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between text-xs font-bold">
            <label class="flex items-center space-x-2 text-slate-500 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="rememberMe"
                name="rememberMe"
                class="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-transparent"
              />
              <span class="uppercase tracking-wider">Remember Me</span>
            </label>
            <a routerLink="/forgot-password" class="text-indigo-600 hover:underline dark:text-indigo-400 uppercase tracking-wider">Forgot Password?</a>
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-full transition-all shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
          >
            <span *ngIf="!loading()">Login</span>
            <span *ngIf="loading()">Logging in...</span>
          </button>

          <!-- Divider -->
          <div class="relative flex py-2 items-center">
            <div class="flex-grow border-t border-slate-100 dark:border-slate-850"></div>
            <span class="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Or</span>
            <div class="flex-grow border-t border-slate-100 dark:border-slate-850"></div>
          </div>

          <!-- Google Sign In -->
          <button
            type="button"
            (click)="handleGoogleSignIn()"
            class="w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-center space-x-2"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#ea4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.57 14.98 1 12 1 7.35 1 3.37 3.65 1.44 7.51l3.86 3C6.23 7.67 8.87 5.04 12 5.04z"/>
              <path fill="#4285f4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z"/>
              <path fill="#fbbc05" d="M5.3 14.51c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.44 7.51C.52 9.35 0 11.41 0 13.6s.52 4.25 1.44 6.09l3.86-3.18z"/>
              <path fill="#34a853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.36 1.11-4.23 1.11-3.13 0-5.77-2.63-6.7-5.52l-3.86 3C3.37 20.35 7.35 23 12 23z"/>
            </svg>
            <span>Sign In with Google</span>
          </button>
        </form>

        <div class="mt-8 text-center border-t border-slate-100 dark:border-slate-800/60 pt-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Don't have an account? 
          <a routerLink="/register" class="text-indigo-600 hover:underline dark:text-indigo-400">Register here</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private langService = inject(LanguageService);

  email = '';
  password = '';
  rememberMe = false;
  loading = signal(false);
  error = signal<string | null>(null);

  t = this.langService.t;

  async handleLogin(e: Event) {
    e.preventDefault();
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.authService.login(this.email, this.password, this.rememberMe);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set(err.error || 'Invalid email or password');
    } finally {
      this.loading.set(false);
    }
  }

  async handleGoogleSignIn() {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Sign in with the seeded customer account for simulation
      await this.authService.login('customer@  DIGITAL HUB.com', 'customer123', true);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set('Google sign-in simulation failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
