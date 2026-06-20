// src/app/(customer)/contact/page.tsx
'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactPage() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API email submission
    setSubmitted(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in flex-grow">

      {/* Title */}
      <div className="text-center space-y-3">
        <span className="text-amber-500 font-extrabold text-xs uppercase tracking-widest">Get In Touch</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          Contact Us
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Have queries about custom desktop configurations, bulk laptop pricing, or repair statuses? Message us or visit our store.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Contact Info (1 Col) */}
        <aside className="space-y-6">
          <div className="bg-card text-card-foreground border border-border-brand p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-border-brand/40 pb-2">
              Store Information
            </h3>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start space-x-2.5">
                <MapPin size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 dark:text-slate-300">
                  21-9-9, Krishna Kanth Plaza, R R Road, near Sanjay Nagar PHC, Kakinada - 533001, Andhra Pradesh, India
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone size={16} className="text-amber-500 shrink-0" />
                <a href="tel:+919848257578" className="text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors">+91 98482 57578</a>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail size={16} className="text-amber-500 shrink-0" />
                <a href="mailto:info@  DIGITAL HUBcomputers.com" className="text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors">info@  DIGITAL HUBcomputers.com</a>
              </div>
              <div className="flex items-center space-x-2.5 border-t border-border-brand/40 pt-3 text-slate-500">
                <Clock size={16} className="shrink-0" />
                <span>Mon - Sat: 9:30 AM - 9:45 PM</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Inquiry Form (2 Cols) */}
        <main className="lg:col-span-2">
          <div className="bg-card text-card-foreground border border-border-brand p-6 sm:p-8 rounded-3xl shadow-xs space-y-6">
            <h3 className="font-extrabold text-base uppercase tracking-wide border-b border-border-brand/40 pb-2">
              Send An Inquiry Message
            </h3>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex items-start space-x-3 text-emerald-600 font-bold text-sm">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p>Inquiry Submitted Successfully!</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">We will review your message and reply via email within 24 hours.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">

                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Avinash"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-semibold"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-semibold"
                  />
                </div>

                {/* Subject */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-slate-500 font-bold">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Custom Gaming PC Config / Repair Status / Bulk Discount"
                    className="w-full bg-slate-50 border border-border-brand rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-semibold"
                  />
                </div>

                {/* Message */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-slate-500 font-bold">Inquiry Message</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Write detailed specifications or questions..."
                    className="w-full bg-slate-50 border border-border-brand rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-950 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-fit bg-primary-brand hover:bg-primary-brand-hover text-white font-extrabold py-3 px-6 rounded-full shadow-lg hover:shadow-primary-brand/20 transition-all flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider text-xs"
                  >
                    <Send size={14} />
                    <span>Send Message</span>
                  </button>
                </div>

              </form>
            )}
          </div>
        </main>
      </div>

      {/* Map locator Section */}
      <section className="h-[400px] border border-border-brand rounded-3xl overflow-hidden shadow-sm">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3816.4690257463767!2d82.230967!3d16.9514643!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3827ddaf59b4f7%3A0x5c23a08ed5ddcaa6!2s + DIGITAL HUB+Computers!5e0!3m2!1sen!2sin!4v1717904000000!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full object-cover"
        ></iframe>
      </section>

    </div>
  );
}
