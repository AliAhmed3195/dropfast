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
      accent?: string;
    };
  };
  store?: {
    slug?: string;
  };
}

export default function EcommerceFeaturedSection({ products, theme, store }: FeaturedSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const primaryColor = theme?.colors?.primary || '#7C3AED';
  const accentColor = theme?.colors?.accent || '#EA580C';
  const storeSlug = store?.slug || '';

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
            Featured Collection
          </span>
          <h2 className="text-5xl font-bold mt-4 mb-6">Premium Products</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of top-quality products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-200"
            >
              <div className="relative w-full h-72 bg-gray-100 overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                    HOT
                  </span>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-3xl font-extrabold" style={{ color: primaryColor }}>
                    ${product.price.toFixed(2)}
                  </p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/store/${storeSlug}/product/${product.id}`;
                    }
                  }}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg"
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


