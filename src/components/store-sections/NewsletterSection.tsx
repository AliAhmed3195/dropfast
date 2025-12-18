'use client';

import React, { useState } from 'react';

interface NewsletterSectionProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  layout?: {
    style?: 'default' | 'minimal' | 'centered';
    showSocial?: boolean;
    showFeatures?: boolean;
  };
}

const NewsletterSection: React.FC<NewsletterSectionProps> = ({ 
  title = "Stay Updated",
  subtitle = "Subscribe to our newsletter for the latest updates and exclusive offers",
  placeholder = "Enter your email address",
  buttonText = "Subscribe",
  colors,
  layout = { style: 'default', showSocial: true, showFeatures: true }
}) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubscribed(true);
    setIsLoading(false);
    setEmail('');
  };

  const socialLinks = [
    { name: 'Facebook', icon: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z' },
    { name: 'Twitter', icon: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z' },
    { name: 'Instagram', icon: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z' },
    { name: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' }
  ];

  const features = [
    { icon: '📧', text: 'Weekly updates' },
    { icon: '🎁', text: 'Exclusive offers' },
    { icon: '🚀', text: 'Early access' },
    { icon: '💡', text: 'Product tips' }
  ];

  const getContainerClass = () => {
    switch (layout.style) {
      case 'minimal':
        return 'py-12 bg-white';
      case 'centered':
        return 'py-16 bg-gray-50';
      default:
        return 'py-16 bg-gradient-to-r from-gray-900 to-gray-800';
    }
  };

  const getTextColor = () => {
    return layout.style === 'default' ? 'text-white' : 'text-gray-900';
  };

  const getSubtextColor = () => {
    return layout.style === 'default' ? 'text-gray-300' : 'text-gray-600';
  };

  if (isSubscribed) {
    return (
      <section className={getContainerClass()}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600">You've successfully subscribed to our newsletter.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={getContainerClass()}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${getTextColor()}`}>{title}</h2>
          <div 
            className="w-24 h-1 mx-auto mb-6"
            style={{ backgroundColor: layout.style === 'default' ? 'white' : colors.primary }}
          ></div>
          <p className={`text-lg mb-8 ${getSubtextColor()}`}>{subtitle}</p>

          {/* Newsletter Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                required
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{}}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                }}
              >
                {isLoading ? 'Subscribing...' : buttonText}
              </button>
            </div>
          </form>

          {/* Features */}
          {layout.showFeatures && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <p className={`text-sm ${getSubtextColor()}`}>{feature.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Social Links */}
          {layout.showSocial && (
            <div className="flex justify-center space-x-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href="#"
                  className={`p-2 rounded-full transition-colors ${
                    layout.style === 'default' 
                      ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
