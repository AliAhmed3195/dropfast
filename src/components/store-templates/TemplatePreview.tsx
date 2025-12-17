'use client';

import React, { useState } from 'react';
import { placeholderImages } from '@/lib/placeholder-images';
import { StoreTemplate } from '@/lib/store-templates';
import StoreTemplateRenderer from './StoreTemplateRenderer';

interface TemplatePreviewProps {
  template: StoreTemplate;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate?: (template: StoreTemplate) => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, isOpen, onClose, onUseTemplate }) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  if (!isOpen) return null;

  // Mock store data for preview
  const mockStore = {
    id: 'preview-store',
    name: 'Sample Store',
    description: 'This is a preview of how your store will look with the selected template.',
    logo: null,
    banner: null,
    template: template.id,
    templateConfig: {
      hasSlider: template.features.hasSlider,
      hasFeatured: template.features.hasFeatured,
      hasBestSelling: template.features.hasBestSelling,
      hasCategories: template.features.hasCategories,
      hasNewsletter: template.features.hasNewsletter,
      gridColumns: template.layout.gridColumns,
      sidebarPosition: template.layout.sidebarPosition,
      colorScheme: template.colorScheme
    },
    products: [
      {
        id: '1',
        name: 'Sample Product 1',
        price: 29.99,
        image: placeholderImages.product1,
        slug: 'sample-product-1'
      },
      {
        id: '2',
        name: 'Sample Product 2',
        price: 49.99,
        image: placeholderImages.product2,
        slug: 'sample-product-2'
      },
      {
        id: '3',
        name: 'Sample Product 3',
        price: 19.99,
        image: placeholderImages.product3,
        slug: 'sample-product-3'
      },
      {
        id: '4',
        name: 'Sample Product 4',
        price: 39.99,
        image: placeholderImages.product4,
        slug: 'sample-product-4'
      }
    ],
    // Template-specific data
    sliderImages: template.features.hasSlider ? [placeholderImages.banner1, placeholderImages.banner2, placeholderImages.banner3] : undefined,
    featuredProducts: template.features.hasFeatured ? [
      {
        id: '1',
        name: 'Featured Product 1',
        price: 29.99,
        image: placeholderImages.product1,
        slug: 'featured-product-1'
      },
      {
        id: '2',
        name: 'Featured Product 2',
        price: 49.99,
        image: placeholderImages.product2,
        slug: 'featured-product-2'
      }
    ] : undefined,
    bestSellingProducts: template.features.hasBestSelling ? [
      {
        id: '1',
        name: 'Best Seller 1',
        price: 29.99,
        image: placeholderImages.product3,
        slug: 'best-seller-1'
      }
    ] : undefined,
    categories: template.features.hasCategories ? [
      {
        id: '1',
        name: 'Category 1',
        image: placeholderImages.category1,
        slug: 'category-1'
      },
      {
        id: '2',
        name: 'Category 2',
        image: placeholderImages.category2,
        slug: 'category-2'
      }
    ] : undefined
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
            <h2 className="text-2xl font-bold text-gray-900">{template.name} Preview</h2>
            <p className="text-gray-600 mt-1">{template.description}</p>
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
            <p>This is a preview with sample data. Your actual store will use your real products and content.</p>
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

export default TemplatePreview;
