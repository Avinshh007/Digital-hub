// src/components/customer/BannerSlider.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Banner {
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl: string;
}

interface BannerSliderProps {
  banners: Banner[];
}

export default function BannerSlider({ banners }: BannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000); // 6 seconds slide duration
    return () => clearInterval(interval);
  }, [banners]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full h-[300px] sm:h-[450px] lg:h-[550px] bg-slate-900 overflow-hidden shadow-md group">
      
      {/* Slides Container */}
      <div 
        className="flex h-full transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1)"
        style={{ transform: `translateX(-${currentSlide * 100}%)`, width: `${banners.length * 100}%` }}
      >
        {banners.map((banner, index) => (
          <div 
            key={index}
            className="relative h-full flex-shrink-0"
            style={{ width: `${100 / banners.length}%` }}
          >
            {/* Background Image */}
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            />
            {/* Linear Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-slate-950/20" />
            
            {/* Slide Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl text-left space-y-4 animate-fade-in">
                  
                  {/* Floating tag */}
                  <span className="inline-block bg-amber-500 text-blue-950 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                    Sri Pavan Computers
                  </span>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-md">
                    {banner.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-slate-200 text-sm sm:text-lg lg:text-xl font-medium max-w-lg drop-shadow-sm">
                    {banner.subtitle}
                  </p>

                  {/* Button */}
                  <div className="pt-2">
                    <Link
                      href={banner.linkUrl}
                      className="inline-block bg-amber-500 hover:bg-amber-400 text-blue-950 font-extrabold text-sm sm:text-base px-6 py-3 rounded-full shadow-lg hover:shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Shop Now
                    </Link>
                  </div>

                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Slide Navigation Arrows (only if multi slides) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/40 hover:bg-amber-500 hover:text-blue-950 text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/40 hover:bg-amber-500 hover:text-blue-950 text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? 'bg-amber-500 w-6 shadow-md' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}
