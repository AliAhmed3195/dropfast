'use client';

import React, { useState, useEffect } from 'react';
import { placeholderImages } from '@/lib/placeholder-images';
import { StoreTemplate } from '@/lib/store-templates';
import StoreTemplateRenderer from './StoreTemplateRenderer';

interface DynamicTemplatePreviewProps {
  template: StoreTemplate;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate?: (template: StoreTemplate) => void;
  customizations?: any;
}

const DynamicTemplatePreview: React.FC<DynamicTemplatePreviewProps> = ({ 
  template, 
  isOpen, 
  onClose, 
  onUseTemplate,
  customizations 
}) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [liveData, setLiveData] = useState<any>(null);

  // Generate dynamic mock data based on template
  const generateMockData = () => {
    const baseProducts = [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        price: 199.99,
        image: 'placeholderImages.product1',
        slug: 'premium-headphones'
      },
      {
        id: '2',
        name: 'Smart Fitness Watch',
        price: 299.99,
        image: 'placeholderImages.product2',
        slug: 'smart-watch'
      },
      {
        id: '3',
        name: 'Wireless Charging Pad',
        price: 49.99,
        image: 'placeholderImages.product3',
        slug: 'wireless-charger'
      },
      {
        id: '4',
        name: 'Bluetooth Speaker',
        price: 79.99,
        image: 'placeholderImages.product4',
        slug: 'bluetooth-speaker'
      },
      {
        id: '5',
        name: 'Gaming Mouse',
        price: 89.99,
        image: 'placeholderImages.product5',
        slug: 'gaming-mouse'
      },
      {
        id: '6',
        name: 'Mechanical Keyboard',
        price: 149.99,
        image: 'placeholderImages.product6',
        slug: 'mechanical-keyboard'
      }
    ];

    const categories = [
      {
        id: '1',
        name: 'Electronics',
        image: 'placeholderImages.category1',
        slug: 'electronics'
      },
      {
        id: '2',
        name: 'Accessories',
        image: 'placeholderImages.category2',
        slug: 'accessories'
      },
      {
        id: '3',
        name: 'Gaming',
        image: 'placeholderImages.category3',
        slug: 'gaming'
      },
      {
        id: '4',
        name: 'Audio',
        image: 'placeholderImages.category4',
        slug: 'audio'
      }
    ];

    return {
      products: baseProducts,
      categories,
      sliderImages: template.features.hasSlider ? [
        'placeholderImages.banner1',
        'placeholderImages.banner2',
        'placeholderImages.banner3'
      ] : undefined,
      featuredProducts: template.features.hasFeatured ? baseProducts.slice(0, 3) : undefined,
      bestSellingProducts: template.features.hasBestSelling ? baseProducts.slice(1, 4) : undefined,
      promotionalBanners: [
        {
          image: 'https://via.placeholder.com/400x200/7c3aed/ffffff?text=Sale+50%+Off',
          title: 'Summer Sale',
          subtitle: 'Up to 50% off',
          link: '#'
        },
        {
          image: 'https://via.placeholder.com/400x200/ec4899/ffffff?text=Free+Shipping',
          title: 'Free Shipping',
          subtitle: 'On orders over $50',
          link: '#'
        }
      ]
    };
  };

  // Update mock data when template or customizations change
  useEffect(() => {
    if (isOpen) {
      const mockData = generateMockData();
      setLiveData(mockData);
    }
  }, [template, customizations, isOpen]);

  if (!isOpen || !liveData) return null;

  // Apply customizations to template config
  const templateConfig = {
    hasSlider: customizations?.features?.hasSlider ?? template.features.hasSlider,
    hasFeatured: customizations?.features?.hasFeatured ?? template.features.hasFeatured,
    hasBestSelling: customizations?.features?.hasBestSelling ?? template.features.hasBestSelling,
    hasCategories: customizations?.features?.hasCategories ?? template.features.hasCategories,
    hasNewsletter: customizations?.features?.hasNewsletter ?? template.features.hasNewsletter,
    gridColumns: customizations?.layout?.gridColumns ?? template.layout.gridColumns,
    sidebarPosition: customizations?.layout?.sidebarPosition ?? template.layout.sidebarPosition,
    colorScheme: customizations?.colors ?? template.colorScheme
  };

  // Mock store data with dynamic configuration
  const mockStore = {
    id: 'preview-store',
    name: 'Dynamic Preview Store',
    description: 'This is a live preview of your template with real-time updates.',
    logo: null,
    banner: customizations?.images?.bannerImage || null,
    template: template.id,
    templateConfig,
    products: liveData.products,
    sliderImages: customizations?.images?.heroImage ? 
      [customizations.images.heroImage, ...(liveData.sliderImages || []).slice(1)] : 
      liveData.sliderImages,
    featuredProducts: liveData.featuredProducts,
    bestSellingProducts: liveData.bestSellingProducts,
    categories: liveData.categories,
    promotionalBanners: liveData.promotionalBanners
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '600px' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{template.name} Live Preview</h2>
            <p className="text-gray-600 mt-1">
              {customizations ? 'Customized template with your settings' : 'Default template preview'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Device Preview Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  previewMode === 'desktop'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  previewMode === 'tablet'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  previewMode === 'mobile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Live Preview Indicator */}
        <div className="bg-green-50 border-b border-green-200 px-6 py-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <span className="font-medium">Live Preview</span> - Changes update in real-time
              </p>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto">
          <div className="flex justify-center p-6">
            <div
              className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
              style={getPreviewDimensions()}
            >
              <div className="h-full overflow-auto">
                <StoreTemplateRenderer store={mockStore} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <p>
              This is a live preview with sample data. Your actual store will use your real products and content.
              {customizations && (
                <span className="ml-2 text-blue-600 font-medium">
                  Customizations applied: {Object.keys(customizations).join(', ')}
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close Preview
            </button>
            <button
              onClick={() => {
                onUseTemplate?.(template);
                onClose();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicTemplatePreview;
