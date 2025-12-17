'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
}

interface Store {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  template: string;
  templateConfig: any;
  products: Product[];
  mobileBanner?: string;
  quickCategories?: Category[];
  enablePushNotifications?: boolean;
  enableQuickOrder?: boolean;
}

interface MobileStoreTemplateProps {
  store: Store;
}

const MobileStoreTemplate: React.FC<MobileStoreTemplateProps> = ({ store }) => {
  const { templateConfig } = store;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showBottomNav, setShowBottomNav] = useState(true);

  const productSlides = store.products.slice(0, 5); // Show first 5 products in carousel

  return (
    <div className="template-mobile min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              {store.logo ? (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                />
              ) : (
                <h1 className="text-lg font-bold text-gray-900">{store.name}</h1>
              )}
            </div>

            {/* Search and Cart */}
            <div className="flex items-center space-x-3">
              <button className="text-gray-700 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="text-gray-700 hover:text-gray-900 relative">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative h-48 bg-gradient-to-r from-green-500 to-green-600">
        {store.mobileBanner ? (
          <Image
            src={store.mobileBanner}
            alt="Mobile Banner"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600"></div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h2 className="text-2xl font-bold mb-2">Welcome to {store.name}</h2>
            <p className="text-sm">Shop on the go</p>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      {templateConfig?.hasCategories && store.quickCategories && store.quickCategories.length > 0 && (
        <section className="py-6 bg-white">
          <div className="px-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="grid grid-cols-4 gap-4">
              {store.quickCategories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/store/${store.id}/category/${category.slug}`}
                  className="text-center group"
                >
                  <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={80}
                      height={80}
                      className="w-full h-16 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <p className="text-xs text-gray-700 group-hover:text-green-600 font-medium">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product Carousel */}
      {templateConfig?.hasSlider && productSlides.length > 0 && (
        <section className="py-6 bg-white">
          <div className="px-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Products</h3>
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex space-x-4 pb-4" style={{ width: `${productSlides.length * 280}px` }}>
                  {productSlides.map((product, index) => (
                    <div key={product.id} className="flex-shrink-0 w-64">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={256}
                            height={192}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                          <p className="text-lg font-bold text-green-600 mb-2">${product.price.toFixed(2)}</p>
                          <Link
                            href={`/store/${store.id}/product/${product.slug}`}
                            className="block w-full bg-green-600 text-white text-center py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      <main className="py-6">
        <div className="px-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">All Products</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 px-4">
          {store.products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={200}
                  height={150}
                  className="w-full h-32 object-cover"
                />
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                <p className="text-lg font-bold text-green-600 mb-2">${product.price.toFixed(2)}</p>
                <Link
                  href={`/store/${store.id}/product/${product.slug}`}
                  className="block w-full bg-green-600 text-white text-center py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Quick Order Section */}
      {store.enableQuickOrder && (
        <section className="py-6 bg-green-50">
          <div className="px-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Order</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-3">Need something fast? Use our quick order feature.</p>
              <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors">
                Quick Order
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Push Notification Banner */}
      {store.enablePushNotifications && (
        <div className="fixed top-20 left-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Get notified of new products!</p>
              <p className="text-xs opacity-90">Enable push notifications</p>
            </div>
            <button className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium">
              Enable
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-4 h-16">
            <Link
              href={`/store/${store.id}`}
              className="flex flex-col items-center justify-center text-gray-600 hover:text-green-600"
            >
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs">Home</span>
            </Link>
            <Link
              href={`/store/${store.id}/products`}
              className="flex flex-col items-center justify-center text-gray-600 hover:text-green-600"
            >
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs">Products</span>
            </Link>
            <Link
              href={`/store/${store.id}/cart`}
              className="flex flex-col items-center justify-center text-gray-600 hover:text-green-600 relative"
            >
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <span className="text-xs">Cart</span>
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
            </Link>
            <Link
              href={`/store/${store.id}/account`}
              className="flex flex-col items-center justify-center text-gray-600 hover:text-green-600"
            >
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs">Account</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Add padding to account for bottom navigation */}
      <div className="h-16"></div>
    </div>
  );
};

export default MobileStoreTemplate;
