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

export default function BasicHeroSection({ store, theme }: HeroSectionProps) {
  const primaryColor = theme?.colors?.primary || '#3B82F6';

  return (
    <section className="relative w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          {store.logo && (
            <div className="mb-6">
              <Image
                src={store.logo}
                alt={`${store.name} logo`}
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
            {store.name}
          </h1>
          
          {store.description && (
            <p className="text-lg text-gray-600 max-w-2xl">
              {store.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}


