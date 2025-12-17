'use client';

import React from 'react';
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
  featuredProducts?: Product[];
  bestSellingProducts?: Product[];
  categories?: Category[];
}

interface BasicStoreTemplateProps {
  store: Store;
}

const BasicStoreTemplate: React.FC<BasicStoreTemplateProps> = ({ store }) => {
  return (
    <div className="template-basic min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <div className="flex items-center">
              {store.logo ? (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              ) : (
                <h1 className="text-2xl font-bold text-blue-600">{store.name}</h1>
              )}
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href={`/store/${store.id}`} className="text-gray-700 hover:text-blue-600">
                Home
              </Link>
              <Link href={`/store/${store.id}/products`} className="text-gray-700 hover:text-blue-600">
                Products
              </Link>
              <Link href={`/store/${store.id}/about`} className="text-gray-700 hover:text-blue-600">
                About
              </Link>
              <Link href={`/store/${store.id}/contact`} className="text-gray-700 hover:text-blue-600">
                Contact
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      {store.banner && (
        <div className="relative h-48 bg-gray-100">
          <Image
            src={store.banner}
            alt="Store Banner"
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Store Description */}
      {store.description && (
        <div className="bg-blue-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to {store.name}</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">{store.description}</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Products */}
        {store.featuredProducts && store.featuredProducts.length > 0 && (
          <section className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-gray-600">Handpicked items just for you</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {store.featuredProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-w-16 aspect-h-12 bg-gray-200 relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
                    <Link
                      href={`/store/${store.id}/product/${product.slug}`}
                      className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        {store.categories && store.categories.length > 0 && (
          <section className="mb-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop by Category</h2>
              <p className="text-gray-600">Find what you're looking for</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {store.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/store/${store.id}/category/${category.slug}`}
                  className="group text-center"
                >
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden mb-3">
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={200}
                      height={200}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Best Selling Products */}
        {store.bestSellingProducts && store.bestSellingProducts.length > 0 && (
          <section className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Selling Products</h2>
              <p className="text-gray-600">Customer favorites</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {store.bestSellingProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-w-16 aspect-h-12 bg-gray-200 relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
                    <Link
                      href={`/store/${store.id}/product/${product.slug}`}
                      className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Newsletter */}
      <section className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-blue-100 mb-6">Subscribe to our newsletter for the latest products and offers</p>
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 text-gray-900 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button className="px-6 py-2 bg-blue-700 text-white rounded-r-md hover:bg-blue-800">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>&copy; 2024 {store.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BasicStoreTemplate;
