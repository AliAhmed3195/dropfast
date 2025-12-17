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
      secondary?: string;
    };
  };
  store?: {
    slug?: string;
  };
}

export default function ClassicFeaturedSection({ products, theme, store }: FeaturedSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const primaryColor = theme?.colors?.primary || '#10B981';
  const secondaryColor = theme?.colors?.secondary || '#059669';
  const storeSlug = store?.slug || '';

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
            Featured Products
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r" style={{ 
            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` 
          }}></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl hover:border-green-300 transition-all duration-300"
            >
              <div className="relative w-full h-64 bg-gray-100">
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
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    Featured
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    ${product.price.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/store/${storeSlug}/product/${product.id}`;
                    }
                  }}
                  className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


