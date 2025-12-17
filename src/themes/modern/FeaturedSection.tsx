'use client';

import React from 'react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  slug?: string;
}

interface FeaturedSectionProps {
  products: Product[];
  theme: {
    colors?: {
      primary?: string;
      text?: string;
    };
  };
}

export default function ModernFeaturedSection({ products, theme }: FeaturedSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold" style={{ color: theme?.colors?.text || '#1F2937' }}>
            Featured Products
          </h2>
          <p className="mt-4 text-gray-600">Discover our handpicked selection</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative w-full h-64 bg-gray-200">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-2xl font-bold" style={{ color: theme?.colors?.primary || '#3B82F6' }}>
                  ${product.price.toFixed(2)}
                </p>
                <button
                  className="w-full mt-4 py-2 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: theme?.colors?.primary || '#3B82F6' }}
                >
                  View Product
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

