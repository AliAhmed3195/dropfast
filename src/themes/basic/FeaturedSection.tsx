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
    };
  };
  store?: {
    slug?: string;
  };
}

export default function BasicFeaturedSection({ products, theme, store }: FeaturedSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const primaryColor = theme?.colors?.primary || '#3B82F6';
  const storeSlug = store?.slug || '';

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-8">Featured Products</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative w-full h-48 bg-gray-100">
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
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                  ${product.price.toFixed(2)}
                </p>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/store/${storeSlug}/product/${product.id}`;
                    }
                  }}
                  className="w-full py-2 rounded-md font-medium text-white transition-colors"
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


