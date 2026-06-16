// src/app/(customer)/layout.tsx
import React, { Suspense } from 'react';
import Navbar from '@/components/customer/Navbar';
import Footer from '@/components/customer/Footer';

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 transition-colors duration-200">
      <Suspense fallback={<div className="h-16 sm:h-20 bg-blue-950 w-full fixed top-0 left-0 right-0 z-50 border-b border-blue-900/10" />}>
        <Navbar />
      </Suspense>
      <main className="flex-grow pt-16 sm:pt-20 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
