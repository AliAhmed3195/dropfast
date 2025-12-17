'use client';

import React, { useState } from 'react';

interface NewsletterSectionProps {
  theme: {
    colors?: {
      primary?: string;
      accent?: string;
    };
  };
}

export default function EcommerceNewsletterSection({ theme }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const primaryColor = theme?.colors?.primary || '#7C3AED';
  const accentColor = theme?.colors?.accent || '#EA580C';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    alert('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r opacity-90" style={{ 
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` 
      }}></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
          Stay Connected
        </h2>
        <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
          Subscribe to our newsletter and get exclusive deals, new arrivals, and special offers delivered to your inbox.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 px-6 py-4 rounded-xl border-0 focus:outline-none focus:ring-4 focus:ring-white/50 text-gray-900 text-lg shadow-xl"
            required
          />
          <button
            type="submit"
            className="px-8 py-4 bg-white font-bold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-2xl whitespace-nowrap"
            style={{ color: primaryColor }}
          >
            Subscribe Now
          </button>
        </form>
      </div>
    </section>
  );
}


