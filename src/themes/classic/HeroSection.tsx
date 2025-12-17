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
    };
  };
}

export default function ClassicHeroSection({ store, theme }: HeroSectionProps) {
  const primaryColor = theme?.colors?.primary || '#10B981';

  return (
    <section className="relative w-full h-[400px] bg-gradient-to-br from-green-600 to-green-800 overflow-hidden">
      {store.banner ? (
        <div className="relative w-full h-full">
          <Image
            src={store.banner}
            alt={`${store.name} banner`}
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/60 to-transparent" />
        </div>
      ) : null}
      
      <div className="relative z-10 h-full flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {store.logo && (
            <div className="mb-4">
              <Image
                src={store.logo}
                alt={`${store.name} logo`}
                width={100}
                height={100}
                className="object-contain bg-white/10 rounded-lg p-2"
              />
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Welcome to {store.name}
          </h1>
          
          {store.description && (
            <p className="text-lg md:text-xl text-green-100 drop-shadow-md max-w-2xl">
              {store.description}
            </p>
          )}
          
          <div className="mt-6">
            <button
              className="px-6 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


