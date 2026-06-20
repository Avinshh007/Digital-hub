// src/app/register/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, KeyRound, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectUrl = searchParams.get('redirect') || '/';

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

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(data.error || 'Failed to register. Email might be in use.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-block flex-col items-center">
          <span className="font-extrabold text-2xl text-blue-900 dark:text-blue-400 tracking-tight uppercase">
             DIGITAL HUB
          </span>
          <span className="block text-xs tracking-widest text-amber-500 font-bold uppercase -mt-0.5">
            Nellore Store
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">
          Create An Account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card text-card-foreground py-8 px-4 border border-border-brand sm:rounded-3xl sm:px-10 shadow-md space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Avinash"
                  className="w-full bg-slate-50 border border-border-brand rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-900 dark:text-slate-100 font-semibold"
                />
                <User className="absolute left-3 top-3 text-slate-400" size={16} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
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
                  placeholder="At least 6 characters"
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Register Account</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

          </form>

          <div className="text-center text-xs">
            <span className="text-slate-500">Already have an account? </span>
            <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="font-bold text-primary-brand hover:underline">
              Log In here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
