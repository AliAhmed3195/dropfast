'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TemplateRenderer from '@/components/store-templates/TemplateRenderer';

interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string;
  theme: any;
  pages: any;
}

export default function TemplatePreviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        
        // Fetch template by slug
        const response = await fetch(`/api/templates?slug=${slug}`);
        if (!response.ok) {
          throw new Error('Template not found');
        }
        
        const data = await response.json();
        const template = data.templates?.[0]; // Get first matching template
        
        if (!template) {
          throw new Error(`Template with slug "${slug}" not found`);
        }
        
        setTemplate(template);
      } catch (error) {
        console.error('Error fetching template:', error);
        setError(error instanceof Error ? error.message : 'Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchTemplate();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Preview</h1>
          <p className="text-red-600 mb-2">{error || 'Template not found'}</p>
          <p className="text-gray-600">Template slug: {slug}</p>
        </div>
      </div>
    );
  }

  // Create mock store data for preview (no vendor overrides)
  const mockStore = {
    id: 'preview',
    name: template.name,
    description: template.description || 'Template Preview',
    slug: `preview-${template.slug}`,
    template: {
      id: template.id,
      name: template.name,
      slug: template.slug,
      theme: template.theme,
      pages: template.pages,
    },
    // Mock products for preview
    featuredProducts: [
      {
        id: '1',
        name: 'Sample Product 1',
        price: 29.99,
        image: 'https://via.placeholder.com/300',
      },
      {
        id: '2',
        name: 'Sample Product 2',
        price: 39.99,
        image: 'https://via.placeholder.com/300',
      },
    ],
    categories: [],
    overrides: null, // No vendor overrides in preview
  };

  return (
    <div>
      <div className="bg-blue-600 text-white p-4 text-center">
        <p className="font-semibold">Template Preview: {template.name}</p>
        <p className="text-sm text-blue-100">This is a preview without vendor customizations</p>
      </div>
      <TemplateRenderer store={mockStore} pageType="landing" />
    </div>
  );
}

