'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: Array<{ url: string; alt?: string }>;
}

interface ProductDetailPageProps {
  store: {
    id?: string;
    name: string;
    slug: string;
    logo?: string;
  };
  product?: Product;
  theme: {
    colors?: {
      primary?: string;
    };
  };
}

export default function ClassicProductDetailPage({ store, product, theme }: ProductDetailPageProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const primaryColor = theme?.colors?.primary || '#10B981';
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product || !store) return;
    
    setAddingToCart(true);
    try {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        selectedVariants: {},
        totalPrice: product.price * quantity,
        store: {
          id: store.id || '',
          name: store.name,
          slug: store.slug,
        },
      });
      alert('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!product || !store) return;
    handleAddToCart();
    setTimeout(() => {
      router.push(`/store/${store.slug}/checkout`);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/store/${store.slug}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Store
            </button>
            <h1 className="text-xl font-semibold">{store.name}</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
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
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-3xl font-bold mb-6" style={{ color: primaryColor }}>
              ${product.price.toFixed(2)}
            </p>
            <p className="text-gray-600 mb-8">{product.description}</p>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full py-4 rounded-lg font-bold text-white text-lg mb-4 transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>

            {/* Buy Now Button */}
            <button
              onClick={handleBuyNow}
              disabled={addingToCart}
              className="w-full py-4 rounded-lg font-bold border-2 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: primaryColor,
                color: primaryColor
              }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

