// src/app/login/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectUrl = searchParams.get('redirect') || '/';

  // Double check if already logged in (middleware protects, but let's double-guard)
  useEffect(() => {
    const checkUser = async () => {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          router.push(redirectUrl);
        }
      }
    };
    checkUser();
  }, [router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-block flex-col items-center">
          <span className="font-extrabold text-2xl text-blue-900 dark:text-blue-400 tracking-tight uppercase">
            Sri Pavan Computers
          </span>
          <span className="block text-xs tracking-widest text-amber-500 font-bold uppercase -mt-0.5">
            Nellore Store
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">
          Welcome Back
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card text-card-foreground py-8 px-4 border border-border-brand sm:rounded-3xl sm:px-10 shadow-md space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            
            {/* Email */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sripavan.com"
                  className="w-full bg-slate-50 border border-border-brand rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-900 dark:text-slate-100 font-semibold"
                />
                <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-border-brand rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-900 dark:text-slate-100 font-semibold"
                />
                <KeyRound className="absolute left-3 top-3 text-slate-400" size={16} />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-1.5 text-xs text-rose-500 font-bold bg-rose-500/5 p-3 border border-rose-500/20 rounded-xl">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-brand hover:bg-primary-brand-hover text-white font-extrabold py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider text-xs"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Logging In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

          </form>

          {/* Helper demo details */}
          <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-border-brand/40 space-y-1.5 text-[10px] text-slate-500 leading-relaxed font-semibold">
            <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
              <ShieldCheck size={12} className="text-amber-500" />
              <span>TEST DEMO CREDENTIALS:</span>
            </div>
            <p>• <span className="font-bold text-slate-700 dark:text-slate-300">Customer:</span> customer@sripavan.com / customer123</p>
            <p>• <span className="font-bold text-slate-700 dark:text-slate-300">Admin:</span> admin@sripavan.com / admin123</p>
          </div>

          <div className="text-center text-xs">
            <span className="text-slate-500">Don't have an account? </span>
            <Link href={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="font-bold text-primary-brand hover:underline">
              Register here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
