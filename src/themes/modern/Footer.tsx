'use client';

import React from 'react';

interface FooterProps {
  store: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  theme: {
    colors?: {
      primary?: string;
      text?: string;
    };
  };
}

export default function ModernFooter({ store, theme }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">{store.name}</h3>
            <p className="text-gray-400">
              Quality products delivered to your doorstep
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            {store.address && (
              <p className="text-gray-400 mb-2">{store.address}</p>
            )}
            {store.phone && (
              <p className="text-gray-400 mb-2">Phone: {store.phone}</p>
            )}
            {store.email && (
              <p className="text-gray-400">Email: {store.email}</p>
            )}
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

