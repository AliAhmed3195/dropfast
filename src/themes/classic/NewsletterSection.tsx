'use client';

import React, { useState } from 'react';

interface NewsletterSectionProps {
  theme: {
    colors?: {
      primary?: string;
    };
  };
}

export default function ClassicNewsletterSection({ theme }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const primaryColor = theme?.colors?.primary || '#10B981';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    alert('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <section className="py-16 bg-gradient-to-r" style={{ 
      background: `linear-gradient(135deg, ${primaryColor} 0%, #059669 100%)` 
    }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Subscribe to Our Newsletter</h2>
        <p className="text-green-100 mb-8 text-lg">Get exclusive deals and updates delivered to your inbox</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 px-6 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
            required
          />
          <button
            type="submit"
            className="px-8 py-3 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap"
            style={{ color: primaryColor }}
          >
            Subscribe Now
          </button>
        </form>
      </div>
    </section>
  );
}


