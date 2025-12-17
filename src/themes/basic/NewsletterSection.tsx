'use client';

import React, { useState } from 'react';

interface NewsletterSectionProps {
  theme: {
    colors?: {
      primary?: string;
    };
  };
}

export default function BasicNewsletterSection({ theme }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const primaryColor = theme?.colors?.primary || '#3B82F6';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter signup logic here
    console.log('Newsletter signup:', email);
    alert('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <p className="text-gray-600 mb-6">Stay updated with our latest products and offers</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-md font-semibold text-white transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}


