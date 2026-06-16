// src/app/(customer)/about/page.tsx
'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, Award, Users, Wrench } from 'lucide-react';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in flex-grow">
      
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <span className="text-amber-500 font-extrabold text-xs uppercase tracking-widest">Our Story</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          About Sri Pavan Computers
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Serving Kakinada with premium computer systems, authentic accessories, and high-fidelity repair diagnostics since 2012.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
            Who We Are
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Sri Pavan Computers was established with a simple goal: to provide Kakinada's residents and businesses with reliable computer hardware and outstanding repair services. Over the years, we have built a reputation for transparency, quality, and technical expertise.
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Whether you need a high-end custom assembled gaming PC, a thin-and-light laptop for your college studies, or bulk IT equipment for your corporate office, we offer curated, genuine components with standard manufacturer warranties and official GST-compliant tax invoices.
          </p>
        </div>
        
        {/* Styled Showcase Box */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
          <h3 className="text-lg font-black uppercase tracking-wider text-amber-400">Our Specialties</h3>
          
          <ul className="space-y-3 text-xs sm:text-sm font-semibold">
            <li className="flex items-start space-x-2">
              <span className="text-amber-400 mt-0.5">✔</span>
              <span>Custom Assembled Gaming & Editing Desktops</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-400 mt-0.5">✔</span>
              <span>Laptop & Desktop Chip-Level Diagnostic Repairs</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-400 mt-0.5">✔</span>
              <span>Genuine Storage (SSD/HDD) and Router Networking Sales</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-400 mt-0.5">✔</span>
              <span>GST Registered Corporate Billing (B2B)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Core Values */}
      <section className="pt-8 border-t border-border-brand/40">
        <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 text-center uppercase tracking-tight mb-8">
          Our Core Values
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-card text-card-foreground p-5 border border-border-brand rounded-2xl text-center space-y-2.5">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 w-fit mx-auto">
              <ShieldCheck size={24} />
            </div>
            <h4 className="font-extrabold text-sm uppercase">Authenticity</h4>
            <p className="text-xs text-slate-500 leading-relaxed">We deal exclusively in original accessories and products directly sourced from brands.</p>
          </div>

          <div className="bg-card text-card-foreground p-5 border border-border-brand rounded-2xl text-center space-y-2.5">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 w-fit mx-auto">
              <Wrench size={24} />
            </div>
            <h4 className="font-extrabold text-sm uppercase">Expert Service</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Our technicians possess years of chip-level diagnostics and network engineering experience.</p>
          </div>

          <div className="bg-card text-card-foreground p-5 border border-border-brand rounded-2xl text-center space-y-2.5">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 w-fit mx-auto">
              <Users size={24} />
            </div>
            <h4 className="font-extrabold text-sm uppercase">Customer First</h4>
            <p className="text-xs text-slate-500 leading-relaxed">We support you long after the sale with diagnostic advice, system optimization, and repair.</p>
          </div>

          <div className="bg-card text-card-foreground p-5 border border-border-brand rounded-2xl text-center space-y-2.5">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 w-fit mx-auto">
              <Award size={24} />
            </div>
            <h4 className="font-extrabold text-sm uppercase">Fair Pricing</h4>
            <p className="text-xs text-slate-500 leading-relaxed">We guarantee competitive retail margins, ensuring wholesale prices for retail buyers.</p>
          </div>

        </div>
      </section>

    </div>
  );
}
