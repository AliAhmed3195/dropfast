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

export default function ClassicFooter({ store, theme }: FooterProps) {
  const primaryColor = theme?.colors?.primary || '#10B981';

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">{store.name}</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              Your trusted partner for quality products. We strive to provide the best shopping experience.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ color: primaryColor }}>Contact Us</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              {store.address && <li>{store.address}</li>}
              {store.phone && <li>Phone: {store.phone}</li>}
              {store.email && <li>Email: {store.email}</li>}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ color: primaryColor }}>Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
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


