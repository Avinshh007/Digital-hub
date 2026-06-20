// src/components/customer/HomepageClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle, ShieldCheck, Truck, RotateCcw, Wrench, ChevronDown, ChevronUp, MapPin, Phone, Mail
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import BannerSlider, { Banner } from './BannerSlider';
import ProductCard from './ProductCard';

interface HomepageClientProps {
  initialBanners: Banner[];
  categories: any[];
  featuredProducts: any[];
  allProducts: any[];
  brands: any[];
}

export default function HomepageClient({
  initialBanners,
  categories,
  featuredProducts,
  allProducts,
  brands,
}: HomepageClientProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'featured' | 'new'>('featured');
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({ 0: true });

  // Load recently viewed products from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recently_viewed');
    if (saved) {
      try {
        const parsedIds = JSON.parse(saved) as string[];
        // Map stored IDs back to product details we have
        const items = parsedIds
          .map((id) => allProducts.find((p) => p.id === id))
          .filter(Boolean)
          .slice(0, 4);
        setRecentlyViewed(items);
      } catch (e) {
        console.error(e);
      }
    }
  }, [allProducts]);

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const benefits = [
    {
      icon: <ShieldCheck size={36} className="text-amber-500" />,
      title: 'GST Registered Invoices',
      titleTe: 'GST రిజిస్టర్డ్ ఇన్వాయిస్లు',
      desc: 'Get standard GST-compliant B2B/B2C billing for company accounts.',
      descTe: 'కంపెనీల కోసం ప్రమాణికమైన GST బిల్‌ను పొందండి.',
    },
    {
      icon: <Truck size={36} className="text-amber-500" />,
      title: 'Cash On Delivery (COD)',
      titleTe: 'క్యాష్ ఆన్ డెలివరీ (COD)',
      desc: 'Pay at your doorstep with Cash or UPI upon receiving the items.',
      descTe: 'వస్తువు అందిన తర్వాత నగదు లేదా UPIతో చెల్లించండి.',
    },
    {
      icon: <RotateCcw size={36} className="text-amber-500" />,
      title: 'Genuine Brands Warranty',
      titleTe: 'ఒరిజినల్ బ్రాండ్ల వారంటీ',
      desc: 'All computers and storage devices come with official manufacturer warranty.',
      descTe: 'అన్ని కంప్యూటర్లు మరియు స్టోరేజ్ పరికరాలకు అధికారిక బ్రాండ్ వారంటీ కలదు.',
    },
    {
      icon: <Wrench size={36} className="text-amber-500" />,
      title: 'Professional Service & Repair',
      titleTe: 'కంప్యూటర్ సర్వీస్ & రిపేర్',
      desc: 'Visit our store for chip-level repair, OS installation, and hardware upgrades.',
      descTe: 'ల్యాప్‌టాప్ రిపేర్, OS ఇన్స్టాలేషన్, అప్‌గ్రేడ్ కోసం మా స్టోర్‌ను సందర్శించండి.',
    },
  ];

  const faqs = [
    {
      q: 'Do you sell custom-assembled desktop PCs?',
      qTe: 'మీరు కస్టమ్ డెస్క్‌టాప్ కంప్యూటర్లను అసెంబ్లీ చేసి ఇస్తారా?',
      a: 'Yes! We specialize in custom-building desktop PCs for gaming, video editing, and office applications based on your choice of processors, RAM, graphic cards, and budget.',
      aTe: 'అవును! మీ బడ్జెట్ మరియు అవసరాలకు తగినట్లుగా గేమింగ్, ఆఫీస్ మరియు వీడియో ఎడిటింగ్ కోసం డెస్క్‌టాప్ కంప్యూటర్లను అసెంబ్లీ చేసి ఇస్తాము.',
    },
    {
      q: 'Are your laptop screens and accessories genuine?',
      qTe: 'మీ వద్ద ల్యాప్‌టాప్ స్క్రీన్లు మరియు యాక్సెసరీలు ఒరిజినల్ దొరుకుతాయా?',
      a: 'We only supply authentic components directly from certified distributors of Dell, HP, Lenovo, and Logitech. You get standard retail GST invoices.',
      aTe: 'మేము Dell, HP, Lenovo మరియు Logitech బ్రాండ్ల నుండి అధికారిక విడిభాగాలను మాత్రమే సరఫరా చేస్తాము. మీకు అసలైన GST బిల్‌ను అందజేస్తాము.',
    },
    {
      q: 'What is your product return policy?',
      qTe: 'వస్తువుల రిటర్న్ పాలసీ ఏమిటి?',
      a: 'If a product is found defective or damaged upon delivery, contact us immediately within 24 hours. We will arrange a replacement or refund after inspection.',
      aTe: 'డెలివరీ సమయంలో వస్తువు దెబ్బతిన్నట్లు లేదా లోపాలు ఉన్నట్లు గుర్తిస్తే, 24 గంటలలోపు సంప్రదించండి. తనిఖీ చేసిన తర్వాత బదిలీ లేదా రీఫండ్ చేస్తాము.',
    },
    {
      q: 'Do you provide onsite laptop repair service in Kakinada?',
      qTe: 'కాకినాడలో ఇంటి వద్దకే వచ్చి ల్యాప్‌టాప్ రిపేర్ సర్వీస్ చేస్తారా?',
      a: 'Yes, we provide onsite diagnostic and service support for businesses and homes within Kakinada city. For critical chip-level issues, we bring the device to our store.',
      aTe: 'అవును, కాకినాడ సిటీ పరిధిలో ఇళ్లు మరియు ఆఫీసులకు సర్వీస్ సపోర్ట్ అందిస్తాము. పెద్ద సమస్యల కోసం పరికరాన్ని మా స్టోర్‌కు తీసుకువస్తాము.',
    },
  ];

  const bannerData = initialBanners.length > 0 ? initialBanners : [
    {
      imageUrl: '/uploads/hero_banner.jpg',
      title: 'Welcome to  DIGITAL HUB',
      subtitle: 'Premium Electronics & Computer Repair Store in Kakinada',
      linkUrl: '/products',
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-28 pb-20 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 overflow-hidden relative">
      {/* Ambient background blur blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-300/15 blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* 1. Hero Banner Slider */}
      <BannerSlider banners={bannerData} />

      {/* 2. Category Bubble Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight mb-8 border-l-4 border-amber-500 pl-3">
          {t.featuredCategories}
        </h2>
        <div className="flex items-center space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="flex flex-col items-center shrink-0 group space-y-4 cursor-pointer p-2"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden border border-white/80 bg-white/40 backdrop-blur-md p-3 shadow-sm group-hover:shadow-xl group-hover:border-indigo-300 group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img
                  src={cat.image || '/uploads/hero_banner.jpg'}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-700 group-hover:text-indigo-600 transition-colors text-center max-w-[120px] truncate uppercase">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products & Tab switcher */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-4 mb-8 gap-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight border-l-4 border-amber-500 pl-3">
            {t.featuredProducts}
          </h2>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-full w-fit shadow-inner border border-slate-200/40">
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${activeTab === 'featured'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Best Sellers
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${activeTab === 'new'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              New Arrivals
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {(activeTab === 'featured' ? featuredProducts : allProducts.slice(0, 4)).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 4. WhatsApp Quick Order Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-[2.5rem] p-8 sm:p-14 shadow-2xl shadow-emerald-500/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 group transform hover:scale-[1.02] transition-all duration-500">
          {/* Ambient glow blurs */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-300/30 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />

          <div className="relative z-10 max-w-xl text-left space-y-4">
            <span className="inline-block bg-white/20 border border-white/30 backdrop-blur-md text-emerald-50 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-inner">
              Fast Track Shopping
            </span>
            <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight drop-shadow-sm">{t.quickOrderWhatsApp}</h3>
            <p className="text-emerald-50 text-sm sm:text-lg leading-relaxed font-medium">
              {t.quickOrderDesc} Mention the items you want (Laptops, Printers, Accessories) and we will coordinate dispatch immediately!
            </p>
          </div>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919848257578'}?text=Hello%20 %20 DIGITAL HUB%20Computers,%20I%20want%20to%20order%20some%20computer%20items.`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 shrink-0 flex items-center space-x-3 bg-white text-emerald-600 font-black uppercase tracking-wider text-sm sm:text-base px-8 py-4 rounded-full hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-white/20 cursor-pointer"
          >
            <MessageCircle size={24} className="fill-current animate-bounce" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </section>

      {/* 5. Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight mb-8 border-l-4 border-amber-500 pl-3">
            {t.recentlyViewed}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recentlyViewed.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Brand Benefits & Values */}
      <section className="bg-white/40 backdrop-blur-xl py-20 sm:py-28 border-y border-white relative shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="group flex flex-col items-center md:items-start text-center md:text-left space-y-5 p-8 bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white shadow-lg shadow-indigo-100/40 hover:shadow-2xl hover:shadow-indigo-200/50 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="p-4 bg-indigo-50 rounded-2xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 text-indigo-600 shadow-inner group-hover:shadow-indigo-500/50">
                  {b.icon}
                </div>
                <h4 className="font-black text-slate-800 text-xl tracking-tight">
                  {useLanguage().language === 'en' ? b.title : b.titleTe}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                  {useLanguage().language === 'en' ? b.desc : b.descTe}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQs Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 text-center uppercase tracking-tight mb-10">
          Frequently Asked Questions (FAQs)
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = !!faqOpen[i];
            return (
              <div
                key={i}
                className={`border rounded-2xl overflow-hidden bg-white shadow-xs transition-all duration-300 ${isOpen
                    ? 'border-blue-200 shadow-md ring-1 ring-blue-100'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                  }`}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-5 text-left font-extrabold text-slate-800 text-sm sm:text-base cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className={isOpen ? 'text-blue-600' : ''}>{useLanguage().language === 'en' ? faq.q : faq.qTe}</span>
                  {isOpen ? <ChevronUp size={18} className="text-blue-600" /> : <ChevronDown size={18} className="text-amber-500" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-slate-505 text-xs sm:text-sm leading-relaxed border-t border-slate-100 font-medium text-slate-500">
                    {useLanguage().language === 'en' ? faq.a : faq.aTe}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Contact & Store Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Contact Info Card */}
        <div className="bg-white/80 backdrop-blur-xl border-2 border-white p-8 sm:p-12 rounded-[2.5rem] flex flex-col justify-between space-y-8 shadow-xl shadow-indigo-100/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />

          <div className="relative z-10 space-y-4">
            <span className="text-indigo-600 font-extrabold text-xs uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Store Details</span>
            <h3 className="text-3xl sm:text-4xl font-black uppercase text-slate-800 tracking-tight pt-3">
               DIGITAL HUB
            </h3>
            <p className="text-slate-500 text-sm sm:text-base font-semibold tracking-wide">
              Krishna Kanth Plaza, R R Road, near Sanjay Nagar PHC, Kakinada, Andhra Pradesh 533001
            </p>
          </div>

          <div className="space-y-4 text-sm sm:text-base">
            <div className="flex items-start space-x-3.5 group">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <MapPin size={20} className="shrink-0" />
              </div>
              <span className="text-slate-600 font-medium pt-1">
                21-9-9, Krishna Kanth Plaza, R R Road, near Sanjay Nagar PHC, Kakinada - 533001, Andhra Pradesh, India
              </span>
            </div>
            <div className="flex items-center space-x-3.5 group">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Phone size={18} className="shrink-0" />
              </div>
              <a href="tel:+919848257578" className="text-slate-600 font-extrabold hover:text-blue-600 transition-colors pt-1">+91 98482 57578</a>
            </div>
            <div className="flex items-center space-x-3.5 group">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Mail size={18} className="shrink-0" />
              </div>
              <a href="mailto:info@  DIGITAL HUBcomputers.com" className="text-slate-600 font-medium hover:text-blue-600 transition-colors pt-1">info@  DIGITAL HUBcomputers.com</a>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between gap-4 text-xs font-black text-slate-400 uppercase tracking-wider">
            <span>Operating: Mon - Sat (9:30 AM - 10:00 PM)</span>
            <span className="text-rose-500 font-bold">Sunday Holiday (ఆదివారం సెలవు)</span>
          </div>
        </div>

        {/* Map Embed Card */}
        <div className="h-[380px] lg:h-auto min-h-[380px] border-[6px] border-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-indigo-100/50 relative group hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-500">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3816.4690257463767!2d82.230967!3d16.9514643!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3827ddaf59b4f7%3A0x5c23a08ed5ddcaa6!2s + DIGITAL HUB+Computers!5e0!3m2!1sen!2sin!4v1717904000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          ></iframe>
        </div>

      </section>

    </div>
  );
}
