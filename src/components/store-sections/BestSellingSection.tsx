'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { placeholderImages } from '@/lib/placeholder-images';

interface BestSellingSectionProps {
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    slug?: string;
    salesCount?: number;
    rating?: number;
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
    showSalesCount?: boolean;
    showRating?: boolean;
    showBadges?: boolean;
  };
}

const BestSellingSection: React.FC<BestSellingSectionProps> = ({ 
  products = [],
  title = "Best Selling Products",
  subtitle = "Our most popular items",
  colors,
  layout = { gridColumns: 3, showSalesCount: true, showRating: true, showBadges: true }
}) => {
  // Generate mock products if none provided
  const mockProducts = products.length > 0 ? products : [
    {
      id: '1',
      name: 'Premium Wireless Headphones',
      price: 199.99,
      image: 'placeholderImages.product1',
      slug: 'premium-headphones',
      salesCount: 1250,
      rating: 4.8
    },
    {
      id: '2',
      name: 'Smart Fitness Watch',
      price: 299.99,
      image: 'placeholderImages.product2',
      slug: 'smart-watch',
      salesCount: 890,
      rating: 4.6
    },
    {
      id: '3',
      name: 'Wireless Charging Pad',
      price: 49.99,
      image: 'placeholderImages.product3',
      slug: 'wireless-charger',
      salesCount: 2100,
      rating: 4.9
    },
    {
      id: '4',
      name: 'Bluetooth Speaker',
      price: 79.99,
      image: 'placeholderImages.product4',
      slug: 'bluetooth-speaker',
      salesCount: 650,
      rating: 4.7
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
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
          {mockProducts.map((product, index) => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group relative">
              {/* Best Seller Badge */}
              {layout.showBadges && index < 3 && (
                <div 
                  className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: colors.accent }}
                >
                  #{index + 1} Best Seller
                </div>
              )}

              <div className="relative overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{product.name}</h3>
                
                {/* Rating */}
                {layout.showRating && product.rating && (
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {renderStars(product.rating)}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">({product.rating})</span>
                  </div>
                )}

                {/* Sales Count */}
                {layout.showSalesCount && product.salesCount && (
                  <p className="text-sm text-gray-500 mb-3">
                    {product.salesCount.toLocaleString()} sold
                  </p>
                )}
                
                <p 
                  className="text-2xl font-bold mb-4"
                  style={{ color: colors.primary }}
                >
                  ${product.price.toFixed(2)}
                </p>
                
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
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/products?sort=bestselling"
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
            View All Best Sellers
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSellingSection;
