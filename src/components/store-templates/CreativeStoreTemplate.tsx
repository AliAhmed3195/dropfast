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

interface Store {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  template: string;
  templateConfig: any;
  products: Product[];
  portfolioImages?: string[];
  artistBio?: string;
  creativeProcess?: string;
  instagramHandle?: string;
  galleryLayout?: 'masonry' | 'grid' | 'carousel';
}

interface CreativeStoreTemplateProps {
  store: Store;
}

const CreativeStoreTemplate: React.FC<CreativeStoreTemplateProps> = ({ store }) => {
  const { templateConfig } = store;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const portfolioImages = store.portfolioImages || store.products.map(p => p.image);

  const openLightbox = (image: string, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % portfolioImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(portfolioImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = currentImageIndex === 0 ? portfolioImages.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(portfolioImages[prevIndex]);
  };

  return (
    <div className="template-creative min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
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
                  className="h-12 w-auto"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
              )}
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href={`/store/${store.id}`} className="text-gray-700 hover:text-pink-600 transition-colors">
                Home
              </Link>
              <Link href={`/store/${store.id}/portfolio`} className="text-gray-700 hover:text-pink-600 transition-colors">
                Portfolio
              </Link>
              <Link href={`/store/${store.id}/about`} className="text-gray-700 hover:text-pink-600 transition-colors">
                About
              </Link>
              <Link href={`/store/${store.id}/contact`} className="text-gray-700 hover:text-pink-600 transition-colors">
                Contact
              </Link>
            </nav>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {store.instagramHandle && (
                <a
                  href={`https://instagram.com/${store.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-pink-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center z-10">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">{store.name}</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {store.description || 'Creative works and artistic expressions'}
          </p>
          <Link
            href={`/store/${store.id}/portfolio`}
            className="inline-block bg-pink-600 text-white px-8 py-4 rounded-full hover:bg-pink-700 transition-colors text-lg font-semibold"
          >
            View Portfolio
          </Link>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-pink-300 rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-purple-300 rounded-full"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-pink-200 rounded-full"></div>
        </div>
      </section>

      {/* Artist Bio */}
      {store.artistBio && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">About the Artist</h2>
              <div className="w-24 h-1 bg-pink-600 mx-auto"></div>
            </div>
            <div className="prose prose-lg mx-auto text-gray-600">
              <p className="text-center leading-relaxed">{store.artistBio}</p>
            </div>
          </div>
        </section>
      )}

      {/* Creative Process */}
      {store.creativeProcess && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Creative Process</h2>
              <div className="w-24 h-1 bg-purple-600 mx-auto"></div>
            </div>
            <div className="prose prose-lg mx-auto text-gray-600">
              <p className="text-center leading-relaxed">{store.creativeProcess}</p>
            </div>
          </div>
        </section>
      )}

      {/* Portfolio Gallery */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Portfolio</h2>
            <div className="w-24 h-1 bg-pink-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600">A collection of creative works</p>
          </div>

          {/* Gallery Layout */}
          {store.galleryLayout === 'masonry' ? (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {portfolioImages.map((image, index) => (
                <div
                  key={index}
                  className="break-inside-avoid cursor-pointer group"
                  onClick={() => openLightbox(image, index)}
                >
                  <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-shadow">
                    <Image
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      width={400}
                      height={600}
                      className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioImages.map((image, index) => (
                <div
                  key={index}
                  className="cursor-pointer group"
                  onClick={() => openLightbox(image, index)}
                >
                  <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-shadow">
                    <Image
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      width={400}
                      height={400}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Available Works</h2>
            <div className="w-24 h-1 bg-purple-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600">Purchase original pieces</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {store.products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
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
                  <p className="text-2xl font-bold text-pink-600 mb-4">${product.price.toFixed(2)}</p>
                  <Link
                    href={`/store/${store.id}/product/${product.slug}`}
                    className="inline-block bg-pink-600 text-white px-6 py-3 rounded-full hover:bg-pink-700 transition-colors w-full text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      {templateConfig?.hasNewsletter && (
        <section className="py-20 bg-gradient-to-r from-pink-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Stay Connected</h2>
            <p className="text-xl text-pink-100 mb-8">Get updates on new works and exhibitions</p>
            <div className="max-w-md mx-auto flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-l-full border-0 focus:ring-2 focus:ring-white text-gray-900"
              />
              <button className="bg-white text-pink-600 px-8 py-4 rounded-r-full font-semibold hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">{store.name}</h3>
              <p className="text-gray-400 mb-6">{store.description}</p>
              {store.instagramHandle && (
                <a
                  href={`https://instagram.com/${store.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-pink-400 hover:text-pink-300"
                >
                  <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                  @{store.instagramHandle}
                </a>
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href={`/store/${store.id}`} className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link href={`/store/${store.id}/portfolio`} className="text-gray-400 hover:text-white">Portfolio</Link></li>
                <li><Link href={`/store/${store.id}/about`} className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link href={`/store/${store.id}/contact`} className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-400 mb-2">Email: contact@{store.name.toLowerCase().replace(/\s+/g, '')}.com</p>
              <p className="text-gray-400">Available for commissions</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 {store.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <Image
              src={selectedImage}
              alt="Portfolio"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreativeStoreTemplate;
