'use client';

import React, { useState, useEffect } from 'react';
import { placeholderImages } from '@/lib/placeholder-images';
import { StoreTemplate } from '@/lib/store-templates';

interface Customizations {
  features?: {
    hasSlider?: boolean;
    hasFeatured?: boolean;
    hasBestSelling?: boolean;
    hasCategories?: boolean;
    hasNewsletter?: boolean;
  };
  layout?: {
    gridColumns?: number;
    sidebarPosition?: 'left' | 'right' | 'none';
  };
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  images?: {
    bannerImage?: string;
    heroImage?: string;
    logoImage?: string;
  };
  fonts?: {
    headingFont?: string;
    bodyFont?: string;
  };
  footer?: {
    showSocialLinks?: boolean;
    showNewsletter?: boolean;
    showContactInfo?: boolean;
  };
}

interface TemplateCustomizerProps {
  template: StoreTemplate;
  initialCustomizations?: Customizations | null;
  onCustomizationsChange: (customizations: Customizations) => void;
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  template,
  initialCustomizations,
  onCustomizationsChange
}) => {
  const [customizations, setCustomizations] = useState<Customizations>({
    features: {
      hasSlider: initialCustomizations?.features?.hasSlider ?? template.features.hasSlider,
      hasFeatured: initialCustomizations?.features?.hasFeatured ?? template.features.hasFeatured,
      hasBestSelling: initialCustomizations?.features?.hasBestSelling ?? template.features.hasBestSelling,
      hasCategories: initialCustomizations?.features?.hasCategories ?? template.features.hasCategories,
      hasNewsletter: initialCustomizations?.features?.hasNewsletter ?? template.features.hasNewsletter
    },
    layout: {
      gridColumns: initialCustomizations?.layout?.gridColumns || template.layout.gridColumns,
      sidebarPosition: initialCustomizations?.layout?.sidebarPosition || template.layout.sidebarPosition
    },
    colors: {
      primary: initialCustomizations?.colors?.primary || template.colorScheme.primary,
      secondary: initialCustomizations?.colors?.secondary || template.colorScheme.secondary,
      accent: initialCustomizations?.colors?.accent || template.colorScheme.accent
    },
    images: {
      bannerImage: initialCustomizations?.images?.bannerImage || '',
      heroImage: initialCustomizations?.images?.heroImage || '',
      logoImage: initialCustomizations?.images?.logoImage || ''
    },
    fonts: {
      headingFont: initialCustomizations?.fonts?.headingFont || 'Inter',
      bodyFont: initialCustomizations?.fonts?.bodyFont || 'Inter'
    },
    footer: {
      showSocialLinks: initialCustomizations?.footer?.showSocialLinks ?? true,
      showNewsletter: initialCustomizations?.footer?.showNewsletter ?? true,
      showContactInfo: initialCustomizations?.footer?.showContactInfo ?? true
    }
  });

  useEffect(() => {
    onCustomizationsChange(customizations);
  }, [customizations, onCustomizationsChange]);

  const handleImageChange = (type: 'bannerImage' | 'heroImage' | 'logoImage', value: string) => {
    setCustomizations(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: value
      }
    }));
  };

  const handleFileUpload = (type: 'bannerImage' | 'heroImage' | 'logoImage', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleImageChange(type, result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: 'bannerImage' | 'heroImage' | 'logoImage') => {
    handleImageChange(type, '');
  };

  return (
    <div className="space-y-8">
      {/* Template Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Customizing: {template.name}
        </h3>
        <p className="text-gray-600 mb-4">{template.description}</p>
        
        {/* Template Features */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(template.features).map(([key, enabled]) => {
            if (!enabled) return null;
            const featureName = key.replace('has', '').replace(/([A-Z])/g, ' $1').trim();
            return (
              <span
                key={key}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {featureName}
              </span>
            );
          })}
        </div>
      </div>

      {/* Images & Media */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Images & Media</h3>
        
        {/* Store Logo */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Store Logo <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="url"
                placeholder="Enter logo URL"
                value={customizations.images?.logoImage || ''}
                onChange={(e) => handleImageChange('logoImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-shrink-0">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('logoImage', file);
                }}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Upload
              </label>
            </div>
          </div>
          {customizations.images?.logoImage && (
            <div className="relative inline-block">
              <img
                src={customizations.images.logoImage}
                alt="Logo preview"
                className="h-16 w-auto rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <button
                onClick={() => removeImage('logoImage')}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Store Banner */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Store Banner
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="url"
                placeholder="Enter banner URL"
                value={customizations.images?.bannerImage || ''}
                onChange={(e) => handleImageChange('bannerImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-shrink-0">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('bannerImage', file);
                }}
                className="hidden"
                id="banner-upload"
              />
              <label
                htmlFor="banner-upload"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Upload
              </label>
            </div>
          </div>
          {customizations.images?.bannerImage && (
            <div className="relative inline-block">
              <img
                src={customizations.images.bannerImage}
                alt="Banner preview"
                className="h-24 w-auto rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <button
                onClick={() => removeImage('bannerImage')}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Hero Image (for templates with sliders) */}
        {template.features.hasSlider && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Hero/Slider Image
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="Enter hero image URL"
                  value={customizations.images?.heroImage || ''}
                  onChange={(e) => handleImageChange('heroImage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('heroImage', file);
                  }}
                  className="hidden"
                  id="hero-upload"
                />
                <label
                  htmlFor="hero-upload"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Upload
                </label>
              </div>
            </div>
            {customizations.images?.heroImage && (
              <div className="relative inline-block">
                <img
                  src={customizations.images.heroImage}
                  alt="Hero preview"
                  className="h-32 w-auto rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <button
                  onClick={() => removeImage('heroImage')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Suggestions */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Quick Suggestions
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleImageChange('bannerImage', placeholderImages.storeBanner)}
              className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              <div className="w-full h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded mb-2"></div>
              <span className="text-gray-700">Blue Banner</span>
            </button>
            <button
              onClick={() => handleImageChange('bannerImage', placeholderImages.storeBanner)}
              className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              <div className="w-full h-16 bg-gradient-to-r from-green-500 to-green-600 rounded mb-2"></div>
              <span className="text-gray-700">Green Banner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Template Features Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Template Features</h4>
        <div className="text-sm text-blue-800">
          <p>This template includes:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {template.features.hasSlider && <li>Promotional slider</li>}
            {template.features.hasFeatured && <li>Featured products section</li>}
            {template.features.hasBestSelling && <li>Best selling products</li>}
            {template.features.hasCategories && <li>Category showcase</li>}
            {template.features.hasNewsletter && <li>Newsletter signup</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TemplateCustomizer;