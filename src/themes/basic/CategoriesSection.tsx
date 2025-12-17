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
    };
  };
}

export default function BasicCategoriesSection({ categories, theme }: CategoriesSectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-8">Shop by Category</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="relative w-full h-24 mb-3 bg-gray-200 rounded-lg overflow-hidden">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    {category.name.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium">{category.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


