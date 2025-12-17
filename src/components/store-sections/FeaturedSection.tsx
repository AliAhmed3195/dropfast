'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { placeholderImages } from '@/lib/placeholder-images';

interface FeaturedSectionProps {
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    slug?: string;
  }>;
  title?: string;
  subtitle?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  layout?: {
    gridColumns?: number;
    showPrices?: boolean;
    showButtons?: boolean;
  };
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({ 
  products = [],
  title = "Featured Products",
  subtitle = "Handpicked items just for you",
  colors,
  layout = { gridColumns: 3, showPrices: true, showButtons: true }
}) => {
  // Generate mock products if none provided
  const mockProducts = products.length > 0 ? products : [
    {
      id: '1',
      name: 'Premium Wireless Headphones',
      price: 199.99,
      image: 'placeholderImages.product1',
      slug: 'premium-headphones'
    },
    {
      id: '2',
      name: 'Smart Fitness Watch',
      price: 299.99,
      image: 'placeholderImages.product2',
      slug: 'smart-watch'
    },
    {
      id: '3',
      name: 'Wireless Charging Pad',
      price: 49.99,
      image: 'placeholderImages.product3',
      slug: 'wireless-charger'
    }
  ];

  const getGridClass = () => {
    switch (layout.gridColumns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <div 
            className="w-24 h-1 mx-auto mb-6"
            style={{ backgroundColor: colors.primary }}
          ></div>
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>

        {/* Products Grid */}
        <div className={`grid ${getGridClass()} gap-8`}>
          {mockProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
              <div className="relative overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div 
                  className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ color: colors.primary }}
                >
                  Featured
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{product.name}</h3>
                
                {layout.showPrices && (
                  <p 
                    className="text-2xl font-bold mb-4"
                    style={{ color: colors.primary }}
                  >
                    ${product.price.toFixed(2)}
                  </p>
                )}
                
                {layout.showButtons && (
                  <Link
                    href={product.slug ? `/product/${product.slug}` : `/product/${product.id}`}
                    className="inline-block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors"
                    style={{ 
                      backgroundColor: colors.primary,
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.secondary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary;
                    }}
                  >
                    View Details
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-block px-8 py-3 rounded-lg font-semibold transition-colors"
            style={{ 
              backgroundColor: colors.secondary,
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.secondary;
            }}
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
