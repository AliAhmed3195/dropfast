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
    };
  };
}

export default function BasicFooter({ store, theme }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">{store.name}</h3>
            <p className="text-gray-400 text-sm">
              Quality products delivered to your doorstep
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Information</h4>
            {store.address && (
              <p className="text-gray-400 text-sm mb-2">{store.address}</p>
            )}
            {store.phone && (
              <p className="text-gray-400 text-sm mb-2">Phone: {store.phone}</p>
            )}
            {store.email && (
              <p className="text-gray-400 text-sm">Email: {store.email}</p>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


