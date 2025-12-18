'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartPageProps {
  store: {
    name: string;
    slug: string;
    logo?: string;
  };
  cart?: {
    items: CartItem[];
  };
  theme: {
    colors?: {
      primary?: string;
    };
  };
}

export default function ClassicCartPage({ store, cart, theme }: CartPageProps) {
  const router = useRouter();
  const { items: cartItems, updateQuantity, removeFromCart } = useCart();
  const primaryColor = theme?.colors?.primary || '#10B981';
  
  // Use cart from context if available, otherwise use prop
  const items = cart?.items || cartItems.filter(item => item.store?.slug === store.slug) || [];

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/store/${store.slug}`)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Continue Shopping
            </button>
            <h1 className="text-xl font-semibold">Shopping Cart</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg mb-4">Your cart is empty</p>
            <button
              onClick={() => router.push(`/store/${store.slug}`)}
              className="px-6 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-6 flex items-center gap-6 shadow-sm">
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">Quantity:</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const productId = (item as any).productId || item.id;
                            updateQuantity(productId, item.quantity - 1);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => {
                            const productId = (item as any).productId || item.id;
                            updateQuantity(productId, item.quantity + 1);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg mb-2" style={{ color: primaryColor }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => {
                        const productId = (item as any).productId || item.id;
                        removeFromCart(productId);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span style={{ color: primaryColor }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/store/${store.slug}/checkout`)}
                className="w-full py-3 rounded-lg font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

