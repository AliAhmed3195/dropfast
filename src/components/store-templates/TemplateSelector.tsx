'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface DatabaseTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  previewImage: string | null;
  theme: any; // Theme config (renamed from baseConfig)
  pages: any; // Pages structure
  editableFields: any; // Editable fields
  createdAt: string;
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: DatabaseTemplate) => void;
  onTemplatePreview?: (template: DatabaseTemplate) => void;
  selectedTemplate?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  onTemplateSelect, 
  onTemplatePreview,
  selectedTemplate 
}) => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<DatabaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Store Template</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Select a template that matches your brand and business needs. You can customize it later.
        </p>
      </div>

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No templates available. Please contact administrator.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Store Template</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Select a template that matches your brand and business needs. You can customize it later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template) => {
          const theme = template.theme || {};
          const colors = theme.colors || {};
          const layout = theme.layout || {};
          // Extract features from pages config
          const pages = template.pages || {};
          const landingPage = pages.landing || {};
          const hasFeatures = {
            hasSlider: false, // Can be added later
            hasFeatured: landingPage.sections?.includes('featured'),
            hasBestSelling: false, // Can be added later
            hasCategories: landingPage.sections?.includes('categories'),
            hasNewsletter: landingPage.sections?.includes('newsletter'),
          };

          return (
            <div
              key={template.id}
              className={`relative bg-white rounded-lg shadow-lg border-2 transition-all duration-300 cursor-pointer ${
                selectedTemplate === template.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
              }`}
              onClick={() => onTemplateSelect(template)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              {/* Template Preview */}
              <div className="relative h-64 bg-gray-100 rounded-t-lg overflow-hidden">
                {template.previewImage ? (
                  <Image
                    src={template.previewImage}
                    alt={`${template.name} Preview`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                      <p className="text-gray-500 text-sm">Preview Coming Soon</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay on hover */}
                {hoveredTemplate === template.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-3">
                    <a
                      href={`/preview/${template.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Preview Template
                    </a>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onTemplateSelect(template);
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Select Template
                    </button>
                  </div>
                )}

                {/* Selected indicator */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-blue-500 text-white rounded-full p-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
                </div>
              
                <p className="text-gray-600 text-sm mb-4">{template.description || 'No description available'}</p>

                {/* Features Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {hasFeatures.hasFeatured && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Featured</span>
                  )}
                  {hasFeatures.hasCategories && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Categories</span>
                  )}
                  {hasFeatures.hasNewsletter && (
                    <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Newsletter</span>
                  )}
                </div>

                {/* Layout Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Grid:</span>
                    <span className="ml-1 font-medium">{layout.gridColumns || landingPage.gridColumns || 3} columns</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Layout:</span>
                    <span className="ml-1 font-medium">{landingPage.layout || 'grid'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Featured:</span>
                    <span className="ml-1 font-medium">
                      {hasFeatures.hasFeatured ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Categories:</span>
                    <span className="ml-1 font-medium">
                      {hasFeatures.hasCategories ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

              {/* Select Button */}
              <button
                className={`w-full mt-4 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  selectedTemplate === template.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTemplateSelect(template);
                }}
              >
                {selectedTemplate === template.id ? 'Selected' : 'Select Template'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Comparison */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Template Comparison</h2>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  {templates.map((template) => (
                    <th key={template.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {template.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Image Slider
                  </td>
                  {templates.map((template) => {
                    const pages = template.pages || {};
                    const landingPage = pages.landing || {};
                    const hasSlider = false; // Can be added later
                    return (
                      <td key={template.id} className="px-6 py-4 whitespace-nowrap text-center">
                        {hasSlider ? (
                        <svg className="h-5 w-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Featured Products
                  </td>
                  {templates.map((template) => {
                    const pages = template.pages || {};
                    const landingPage = pages.landing || {};
                    const hasFeatured = landingPage.sections?.includes('featured') || false;
                    return (
                      <td key={template.id} className="px-6 py-4 whitespace-nowrap text-center">
                        {hasFeatured ? (
                        <svg className="h-5 w-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Best Selling
                  </td>
                  {templates.map((template) => {
                    const hasBestSelling = false; // Can be added later
                    return (
                      <td key={template.id} className="px-6 py-4 whitespace-nowrap text-center">
                        {hasBestSelling ? (
                        <svg className="h-5 w-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Categories
                  </td>
                  {templates.map((template) => {
                    const pages = template.pages || {};
                    const landingPage = pages.landing || {};
                    const hasCategories = landingPage.sections?.includes('categories') || false;
                    return (
                      <td key={template.id} className="px-6 py-4 whitespace-nowrap text-center">
                        {hasCategories ? (
                          <svg className="h-5 w-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Grid Columns
                  </td>
                  {templates.map((template) => {
                    const pages = template.pages || {};
                    const landingPage = pages.landing || {};
                    const theme = template.theme || {};
                    const layout = theme.layout || {};
                    return (
                      <td key={template.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {layout.gridColumns || landingPage.gridColumns || 3}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
