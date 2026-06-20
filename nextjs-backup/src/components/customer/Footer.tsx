// src/components/customer/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, ShieldCheck, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-12 pb-6 no-print mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Column 1: Brand & Desc */}
          <div className="space-y-4">
            <Link href="/" className="flex flex-col">
              <span className="font-extrabold text-xl text-white tracking-tight"> DIGITAL HUB</span>
              <span className="text-xs tracking-widest text-amber-500 font-semibold uppercase">Electronics & Repairs</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t.heroSubtitle}. We provide standard warranties, genuine computer accessories, assembled PCs, laptops, and excellent repair services.
            </p>
            <div className="flex items-center space-x-2 text-xs bg-slate-800 text-amber-400 font-bold px-3 py-1.5 rounded-md w-fit">
              <ShieldCheck size={14} className="text-amber-500" />
              <span>{t.gstText}</span>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">{t.featuredCategories}</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products?category=laptops" className="hover:text-amber-400 transition-colors">Laptops (ల్యాప్‌టాప్‌లు)</Link>
              </li>
              <li>
                <Link href="/products?category=desktops" className="hover:text-amber-400 transition-colors">Desktops (డెస్క్‌టాప్‌లు)</Link>
              </li>
              <li>
                <Link href="/products?category=monitors" className="hover:text-amber-400 transition-colors">Monitors (మానిటర్లు)</Link>
              </li>
              <li>
                <Link href="/products?category=storage" className="hover:text-amber-400 transition-colors">Storage Devices (స్టోరేజ్)</Link>
              </li>
              <li>
                <Link href="/products?category=accessories" className="hover:text-amber-400 transition-colors">Computer Accessories</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products" className="hover:text-amber-400 transition-colors">{t.shop}</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-400 transition-colors">{t.aboutUs}</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-400 transition-colors">{t.contactUs}</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-amber-400 transition-colors">{t.faq}</Link>
              </li>
              <li>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919848257578'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 flex items-center space-x-1 transition-colors"
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp Support</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="space-y-3.5 text-sm">
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">{t.contactUs}</h3>

            <div className="flex items-start space-x-2.5">
              <MapPin size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <span>21-9-9, Krishna Kanth Plaza, R R Road, near Sanjay Nagar PHC, Kakinada - 533001, Andhra Pradesh, India</span>
            </div>

            <div className="flex items-center space-x-2.5">
              <Phone size={16} className="text-amber-500 shrink-0" />
              <a href="tel:+919848257578" className="hover:text-amber-400 transition-colors">+91 98482 57578</a>
            </div>

            <div className="flex items-center space-x-2.5">
              <Mail size={16} className="text-amber-500 shrink-0" />
              <a href="mailto:info@  DIGITAL HUBcomputers.com" className="hover:text-amber-400 transition-colors">info@  DIGITAL HUBcomputers.com</a>
            </div>

            <div className="flex items-center space-x-2.5 text-slate-500">
              <Clock size={16} className="text-slate-500 shrink-0" />
              <span>Mon - Sat: 9:30 AM - 9:45 PM</span>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {currentYear}  DIGITAL HUB. All rights reserved.</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <span>Secure Checkout with SSL</span>
            <span>•</span>
            <span>Made for  DIGITAL HUB, Kakinada</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
