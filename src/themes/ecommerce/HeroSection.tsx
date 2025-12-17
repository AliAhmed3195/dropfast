'use client';

import React from 'react';
import Image from 'next/image';

interface HeroSectionProps {
  store: {
    name: string;
    banner?: string;
    description?: string;
    logo?: string;
  };
  theme: {
    colors?: {
      primary?: string;
      accent?: string;
    };
  };
}

export default function EcommerceHeroSection({ store, theme }: HeroSectionProps) {
  const primaryColor = theme?.colors?.primary || '#7C3AED';
  const accentColor = theme?.colors?.accent || '#EA580C';

  return (
    <section className="relative w-full h-[600px] bg-gradient-to-br from-purple-700 via-purple-600 to-cyan-600 overflow-hidden">
      {store.banner ? (
        <div className="relative w-full h-full">
          <Image
            src={store.banner}
            alt={`${store.name} banner`}
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 to-cyan-900/70" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-purple-600 to-cyan-600" />
      )}
      
      <div className="relative z-10 h-full flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {store.logo && (
            <div className="mb-6">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <Image
                  src={store.logo}
                  alt={`${store.name} logo`}
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </div>
            </div>
          )}
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-2xl">
            {store.name}
          </h1>
          
          {store.description && (
            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto drop-shadow-lg">
              {store.description}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="px-8 py-4 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl"
              style={{ color: primaryColor }}
            >
              Shop Now
            </button>
            <button
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all"
              style={{ borderColor: accentColor }}
            >
              Explore Collection
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


