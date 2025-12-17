'use client';

import React from 'react';
import Image from 'next/image';

interface HeroSectionProps {
  store: {
    name: string;
    banner?: string;
    description?: string;
  };
  theme: {
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
}

export default function ModernHeroSection({ store, theme }: HeroSectionProps) {
  const primaryColor = theme?.colors?.primary || '#3B82F6';

  return (
    <section 
      className="relative w-full h-[500px] bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden"
      style={{ backgroundColor: primaryColor }}
    >
      {store.banner ? (
        <div className="relative w-full h-full">
          <Image
            src={store.banner}
            alt={`${store.name} banner`}
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        </div>
      ) : null}
      
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="text-center text-white max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            {store.name}
          </h1>
          {store.description && (
            <p className="text-xl md:text-2xl text-blue-100 drop-shadow-md">
              {store.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

