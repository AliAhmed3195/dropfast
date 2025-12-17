'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { placeholderImages } from '@/lib/placeholder-images';

interface CategorySectionProps {
  categories?: Array<{
    id: string;
    name: string;
    image: string;
    slug: string;
    productCount?: number;
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
    showProductCount?: boolean;
    cardStyle?: 'default' | 'minimal' | 'detailed';
  };
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  categories = [],
  title = "Shop by Category",
  subtitle = "Browse our product categories",
  colors,
  layout = { gridColumns: 4, showProductCount: true, cardStyle: 'default' }
}) => {
  // Generate mock categories if none provided
  const mockCategories = categories.length > 0 ? categories : [
    {
      id: '1',
      name: 'Electronics',
      image: 'placeholderImages.category1',
      slug: 'electronics',
      productCount: 25
    },
    {
      id: '2',
      name: 'Accessories',
      image: 'placeholderImages.category2',
      slug: 'accessories',
      productCount: 18
    },
    {
      id: '3',
      name: 'Gaming',
      image: 'placeholderImages.category3',
      slug: 'gaming',
      productCount: 12
    },
    {
      id: '4',
      name: 'Audio',
      image: 'placeholderImages.category4',
      slug: 'audio',
      productCount: 8
    }
  ];

  const getGridClass = () => {
    switch (layout.gridColumns) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-3';
      case 4: return 'grid-cols-2 md:grid-cols-4';
      case 6: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
      default: return 'grid-cols-2 md:grid-cols-4';
    }
  };

  const renderCategoryCard = (category: any) => {
    switch (layout.cardStyle) {
      case 'minimal':
        return (
          <Link
            href={`/category/${category.slug}`}
            className="group flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-16 h-16 mb-3 rounded-full overflow-hidden">
              <Image
                src={category.image}
                alt={category.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-sm font-medium text-gray-900 text-center">{category.name}</h3>
            {layout.showProductCount && (
              <p className="text-xs text-gray-500 mt-1">{category.productCount} items</p>
            )}
          </Link>
        );

      case 'detailed':
        return (
          <Link
            href={`/category/${category.slug}`}
            className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              <Image
                src={category.image}
                alt={category.name}
                width={300}
                height={200}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div 
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"
              ></div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
              {layout.showProductCount && (
                <p className="text-gray-600 mb-4">{category.productCount} products available</p>
              )}
              <div 
                className="inline-flex items-center text-sm font-medium"
                style={{ color: colors.primary }}
              >
                Explore Category
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        );

      default: // 'default'
        return (
          <Link
            href={`/category/${category.slug}`}
            className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              <Image
                src={category.image}
                alt={category.name}
                width={250}
                height={200}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
              {layout.showProductCount && (
                <p className="text-sm text-gray-500">{category.productCount} items</p>
              )}
            </div>
          </Link>
        );
    }
  };

  return (
    <section className="py-16 bg-white">
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

        {/* Categories Grid */}
        <div className={`grid ${getGridClass()} gap-6`}>
          {mockCategories.map((category) => (
            <div key={category.id}>
              {renderCategoryCard(category)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
