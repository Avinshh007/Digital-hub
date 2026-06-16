// src/app/services/theme.service.ts
import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private activeTheme = signal<'light' | 'dark'>('light');

  constructor() {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.activeTheme.set(savedTheme);
      } else {
        // Fallback to system preference
        const systemPrefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
        this.activeTheme.set(systemPrefersDark ? 'dark' : 'light');
      }
    }

    // Effect to apply/remove dark class
    effect(() => {
      if (typeof window !== 'undefined') {
        const theme = this.activeTheme();
        const html = document.documentElement;
        if (theme === 'dark') {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
      }
    });
  }

  get theme() {
    return this.activeTheme.asReadonly();
  }

  toggleTheme() {
    this.activeTheme.set(this.activeTheme() === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: 'light' | 'dark') {
    this.activeTheme.set(theme);
  }
}
