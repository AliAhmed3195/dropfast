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

export default function ClassicCategoriesSection({ categories, theme }: CategoriesSectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const primaryColor = theme?.colors?.primary || '#10B981';

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
            Shop by Category
          </h2>
          <p className="text-gray-600">Browse our wide range of categories</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-300"
            >
              <div className="relative w-full h-32 mb-4 bg-gray-200 rounded-lg overflow-hidden">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full" style={{ color: primaryColor }}>
                    <span className="text-3xl font-bold">{category.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <p className="font-medium text-sm">{category.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


