'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: string;
}

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
}

const templates: Template[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and simple invoice template',
    preview: 'Simple layout with basic styling',
    category: 'Basic'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with gradients and shadows',
    preview: 'Modern design with blue gradients',
    category: 'Modern'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Minimalist design with clean lines',
    preview: 'Clean and minimal layout',
    category: 'Minimal'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Business-focused template with detailed sections',
    preview: 'Professional business layout',
    category: 'Business'
  }
];

export default function TemplateSelector({ selectedTemplate, onTemplateSelect }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Template Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedTemplate === template.id
                ? 'ring-2 ring-indigo-500 bg-indigo-50'
                : 'hover:shadow-md'
            }`}
            onClick={() => onTemplateSelect(template.id)}
          >
            <div className="p-4">
              {/* Template Preview */}
              <div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-2 rounded ${
                    template.id === 'default' ? 'bg-gray-300' :
                    template.id === 'modern' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                    template.id === 'minimal' ? 'bg-gray-200' :
                    'bg-gray-400'
                  }`}></div>
                  <p className="text-xs text-gray-600">{template.preview}</p>
                </div>
              </div>

              {/* Template Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <span className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                  {template.category}
                </span>
              </div>

              {/* Selection Indicator */}
              {selectedTemplate === template.id && (
                <div className="mt-3 flex items-center text-indigo-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Selected Template: {templates.find(t => t.id === selectedTemplate)?.name}</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              {templates.find(t => t.id === selectedTemplate)?.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
