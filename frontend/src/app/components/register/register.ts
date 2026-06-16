// src/app/components/register/register.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
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
          <h2 class="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Create Account</h2>
          <p class="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">Join for premium checkout experience</p>
        </div>

        <!-- Error box -->
        <div *ngIf="error()" class="bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 rounded-2xl p-4 text-xs font-bold mb-6">
          {{ error() }}
        </div>

        <form (submit)="handleRegister($event)" class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Full Name</label>
            <input
              type="text"
              [(ngModel)]="name"
              name="name"
              required
              class="w-full bg-slate-50/50 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 text-sm font-semibold text-slate-800 dark:text-slate-100"
              placeholder="Avinash"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Email Address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full bg-slate-50/50 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 text-sm font-semibold text-slate-800 dark:text-slate-100"
              placeholder="name@example.com"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="w-full bg-slate-50/50 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 text-sm font-semibold text-slate-800 dark:text-slate-100"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-full transition-all shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
          >
            <span *ngIf="!loading()">Register</span>
            <span *ngIf="loading()">Creating Account...</span>
          </button>
        </form>

        <div class="mt-8 text-center border-t border-slate-100 dark:border-slate-800/60 pt-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Already have an account? 
          <a routerLink="/login" class="text-indigo-600 hover:underline dark:text-indigo-400">Login here</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async handleRegister(e: Event) {
    e.preventDefault();
    this.loading.set(true);
    this.error.set(null);

    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters long');
      this.loading.set(false);
      return;
    }

    try {
      await this.authService.register(this.name, this.email, this.password);
      this.router.navigate(['/verify-email'], { queryParams: { email: this.email } });
    } catch (err: any) {
      this.error.set(err.error || 'Registration failed. Try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
