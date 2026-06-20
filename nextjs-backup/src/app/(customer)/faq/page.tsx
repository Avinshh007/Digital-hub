// src/app/(customer)/faq/page.tsx
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function FaqPage() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<{ [key: number]: boolean }>({ 0: true, 1: true });

  const toggleAccordion = (index: number) => {
    setOpenIndex((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const faqItems = [
    {
      q: 'Where is  DIGITAL HUBlocated?',
      qTe: 'శ్రీ పవన్ కంప్యూటర్స్ ఎక్కడ ఉంది?',
      a: 'We are located at Krishna Kanth Plaza, R R Road, near Sanjay Nagar PHC, Kakinada, Andhra Pradesh. Our central store handles both electronic sales and desktop/laptop repair diagnostics.',
      aTe: 'మేము ఆంధ్రప్రదేశ్‌లోని కాకినాడ ఆర్ ఆర్ రోడ్, సంజయ్ నగర్ PHC సమీపంలోని కృష్ణ కాంత్ ప్లాజాలో ఉన్నాము. మా ప్రధాన దుకాణంలో కంప్యూటర్ విక్రయాలు మరియు ల్యాప్‌టాప్/డెస్క్‌టాప్ రిపేర్ సర్వీస్ చేస్తాము.',
    },
    {
      q: 'Do you offer GST tax invoices for business purchases?',
      qTe: 'వ్యాపార కొనుగోళ్ల కోసం మీరు GST బిల్‌ను ఇస్తారా?',
      a: 'Yes, we are a registered enterprise. All transactions come with standard GST tax invoices. If you possess a corporate GSTIN, we can include it for input tax credit (ITC) eligibility.',
      aTe: 'అవును, మేము రిజిస్టర్డ్ సంస్థ. అన్ని లావాదేవీలకు ప్రమాణికమైన GST టాక్స్ ఇన్వాయిస్ ఇస్తాము. మీ వద్ద కంపెనీ GSTIN ఉంటే, దానిని ఇన్‌పుట్ టాక్స్ క్రెడిట్ (ITC) కోసం జోడిస్తాము.',
    },
    {
      q: 'How long does a typical laptop repair service take?',
      qTe: 'ల్యాప్‌టాప్ రిపేర్ సర్వీస్ సాధారణంగా ఎంత సమయం పడుతుంది?',
      a: 'For basic diagnostics, operating system installations, and hardware replacements (RAM, SSD, screen, battery), it takes 1 to 4 hours. For advanced motherboard/chip-level repairs, it may take 1 to 3 business days.',
      aTe: 'OS ఇన్స్టాలేషన్, హార్డ్‌వేర్ మార్పిడి (RAM, SSD, బ్యాటరీ) వంటి సాధారణ పనులకు 1 నుండి 4 గంటల సమయం పడుతుంది. మదర్‌బోర్డ్/చిప్-లెవల్ సర్వీస్ వంటి సంక్లిష్ట సమస్యలకు 1 నుండి 3 రోజుల సమయం పట్టవచ్చు.',
    },
    {
      q: 'Do you assemble desktop computers according to customer choices?',
      qTe: 'కస్టమర్ కోరుకున్న విధంగా డెస్క్‌టాప్ కంప్యూటర్లను అసెంబ్లీ చేస్తారా?',
      a: 'Yes! We custom-assemble high-fidelity desktops for gaming, office networking, and heavy design tasks. You can select your preferred processor (Intel/AMD), RAM, graphic cards, and cabinet cabinets.',
      aTe: 'అవును! గేమింగ్, ఆఫీస్ వర్క్ మరియు ఎడిటింగ్ కోసం అత్యుత్తమ డెస్క్‌టాప్ కంప్యూటర్లను అసెంబ్లీ చేసి ఇస్తాము. మీరు కోరుకున్న ప్రాసెసర్ (Intel/AMD), RAM, గ్రాఫిక్ కార్డ్ ఎంచుకోవచ్చు.',
    },
    {
      q: 'Are the laptops and computer components under warranty?',
      qTe: 'ల్యాప్‌టాప్‌లు మరియు కంప్యూటర్ విడిభాగాలకు వారంటీ ఉంటుందా?',
      a: 'Every retail laptop, monitor, printer, and storage device comes with authentic official manufacturer warranty. The invoices we provide can be used directly at any authorized service center across India.',
      aTe: 'మేము విక్రయించే ప్రతి ల్యాప్‌టాప్, మానిటర్, ప్రింటర్ మరియు విడిభాగానికి అధికారిక వారంటీ ఉంటుంది. మేము ఇచ్చే బిల్ ద్వారా ఇండియాలో ఎక్కడైనా సర్వీస్ సెంటర్లలో వారంటీని క్లెయిమ్ చేయవచ్చు.',
    },
    {
      q: 'Do you deliver orders to locations outside Kakinada?',
      qTe: 'కాకినాడ వెలుపలి ప్రాంతాలకు వస్తువులను డెలివరీ చేస్తారా?',
      a: 'For online orders placed on this website, we ship across Andhra Pradesh and neighbouring states. Local Kakinada orders are delivered within 24 hours. Regional shipping takes 2 to 5 business days.',
      aTe: 'ఈ వెబ్‌సైట్‌లో చేసే ఆర్డర్‌లను ఆంధ్రప్రదేశ్ అంతటా మరియు పొరుగు రాష్ట్రాలకు కొరియర్ ద్వారా పంపుతాము. కాకినాడ స్థానికంగా ఉండే వారికి 24 గంటల్లో డెలివరీ చేస్తాము. ఇతర ప్రాంతాలకు 2 నుండి 5 రోజులు పడుతుంది.',
    },
    {
      q: 'What payment methods do you accept?',
      qTe: 'మీరు ఏయే చెల్లింపు పద్ధతులను అంగీకరిస్తారు?',
      a: 'We accept Cash on Delivery (COD), UPI transfer, Net Banking, and credit/debit cards both online and at our offline store in Kakinada.',
      aTe: 'మేము క్యాష్ ఆన్ డెలివరీ (COD), UPI (PhonePe, GooglePay), నెట్ బ్యాంకింగ్ మరియు క్రెడిట్/డెబిట్ కార్డులను ఆన్‌లైన్ లో మరియు స్టోర్ వద్ద కూడా అంగీకరిస్తాము.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in flex-grow">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <span className="text-amber-500 font-extrabold text-xs uppercase tracking-widest">Questions & Help</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          FAQ Help Center
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Find instant answers about our computers store sales, repair times, GST billing, and delivery information.
        </p>
      </div>

      {/* Accordions List */}
      <div className="space-y-4">
        {faqItems.map((item, idx) => {
          const isOpen = !!openIndex[idx];
          return (
            <div 
              key={idx}
              className="border border-border-brand rounded-2xl bg-card text-card-foreground shadow-xs overflow-hidden"
            >
              <button
                onClick={() => toggleAccordion(idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <HelpCircle size={18} className="text-amber-500 shrink-0" />
                  <span>{useLanguage().language === 'en' ? item.q : item.qTe}</span>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-amber-500 shrink-0" /> : <ChevronDown size={18} className="text-amber-500 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1.5 border-t border-border-brand/40 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {useLanguage().language === 'en' ? item.a : item.aTe}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Help Box */}
      <div className="bg-slate-100 dark:bg-slate-800/40 p-5 rounded-2xl border border-border-brand/30 flex items-start space-x-3 text-xs sm:text-sm text-slate-500">
        <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 dark:text-slate-300">Need specific custom quotes?</span>
          <p className="mt-0.5 leading-relaxed">
            If you need components that are not listed in our online store, feel free to visit our shop at R R Road, Kakinada or use the WhatsApp Quick Order widget on the homepage to message us directly.
          </p>
        </div>
      </div>

    </div>
  );
}
