'use client';

import React from 'react';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
}

interface CategoriesSectionProps {
  categories: Category[];
  theme: {
    colors?: {
      primary?: string;
      accent?: string;
    };
  };
}

export default function EcommerceCategoriesSection({ categories, theme }: CategoriesSectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const primaryColor = theme?.colors?.primary || '#7C3AED';
  const accentColor = theme?.colors?.accent || '#EA580C';

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
            Browse Categories
          </span>
          <h2 className="text-5xl font-bold mt-4">Shop by Category</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative bg-gradient-to-br from-purple-50 to-cyan-50 rounded-2xl p-6 text-center hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-300 transform hover:-translate-y-1"
            >
              <div className="relative w-full h-32 mb-4 bg-white rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full" style={{ color: primaryColor }}>
                    <span className="text-4xl font-bold">{category.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <p className="font-bold text-sm" style={{ color: primaryColor }}>{category.name}</p>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: accentColor }}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


