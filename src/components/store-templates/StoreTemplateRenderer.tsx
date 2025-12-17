'use client';

import React, { useState, useEffect } from 'react';
import { getEffectiveConfig } from '@/lib/store-templates';
import { loadTemplate, templatePerformanceMonitor, isValidTemplate } from '@/lib/template-registry';
import TemplateLoadingSkeleton from './TemplateLoadingSkeleton';
import SliderSection from '@/components/store-sections/SliderSection';
import FeaturedSection from '@/components/store-sections/FeaturedSection';
import CategorySection from '@/components/store-sections/CategorySection';
import BestSellingSection from '@/components/store-sections/BestSellingSection';
import NewsletterSection from '@/components/store-sections/NewsletterSection';

interface StoreTemplateRendererProps {
  store: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    banner?: string;
    template?: string | { // Legacy: template name/id (string) OR New: template object from DB
      id: string;
      name: string;
      baseHtml?: string;
      baseConfig: any;
    };
    templateId?: string; // New: template ID (FK)
    overrides?: any; // Vendor customizations (logo, banner, primaryColor)
    templateConfig?: any; // Legacy: full template config (for backward compatibility)
    products?: Array<{
      id: string;
      name: string;
      price: number;
      image: string;
      slug?: string;
    }>;
    categories?: Array<{
      id: string;
      name: string;
      image: string;
      slug: string;
    }>;
    sliderImages?: string[];
    featuredProducts?: Array<{
      id: string;
      name: string;
      price: number;
      image: string;
      slug?: string;
    }>;
    bestSellingProducts?: Array<{
      id: string;
      name: string;
      price: number;
      image: string;
      slug?: string;
    }>;
    promotionalBanners?: Array<{
      image: string;
      title: string;
      subtitle: string;
      link: string;
    }>;
  };
}

const StoreTemplateRenderer: React.FC<StoreTemplateRendererProps> = ({ store }) => {
  const [DynamicTemplate, setDynamicTemplate] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Determine template identifier (support both new DB-based and legacy string-based)
  const templateIdentifier = typeof store.template === 'object' 
    ? store.template.name 
    : (store.template || 'classic');
  
  // Load template dynamically
  useEffect(() => {
    const loadDynamicTemplate = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Start performance monitoring
        templatePerformanceMonitor.startLoad(templateIdentifier);
        
        // Validate template
        if (!isValidTemplate(templateIdentifier)) {
          throw new Error(`Invalid template: ${templateIdentifier}`);
        }
        
        // Load template component
        console.log('Loading template:', templateIdentifier);
        const TemplateComponent = await loadTemplate(templateIdentifier);
        
        if (TemplateComponent) {
          console.log('Template loaded successfully:', templateIdentifier);
          setDynamicTemplate(() => TemplateComponent);
          
          // End performance monitoring
          templatePerformanceMonitor.endLoad(templateIdentifier);
        } else {
          console.error(`Failed to load template: ${templateIdentifier}`);
          throw new Error(`Failed to load template: ${templateIdentifier}`);
        }
      } catch (error) {
        console.error('Template loading error:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadDynamicTemplate();
  }, [templateIdentifier]);

  // Get effective configuration by merging template baseConfig with store overrides
  let effectiveConfig: any;
  
  if (typeof store.template === 'object' && store.template?.baseConfig) {
    // New DB-based approach: merge template.baseConfig + store.overrides
    const baseConfig = store.template.baseConfig as any;
    const overrides = store.overrides || {};
    
    // Deep merge baseConfig with overrides
    effectiveConfig = {
      ...baseConfig,
      // Apply vendor overrides
      colorScheme: {
        ...baseConfig.colorScheme,
        ...(overrides.primaryColor && { primary: overrides.primaryColor })
      },
      // Apply logo/banner from overrides if provided
      images: {
        ...baseConfig.images,
        ...(store.logo && { logo: store.logo }),
        ...(store.banner && { banner: store.banner })
      }
    };
  } else {
    // Legacy approach: use getEffectiveConfig for backward compatibility
    effectiveConfig = getEffectiveConfig(templateIdentifier, store.templateConfig || {});
  }
  
  // Debug log to verify template is being used correctly
  console.log('StoreTemplateRenderer - Template:', templateIdentifier, 'Config:', effectiveConfig);
  
  // Extract colors for all sections
  const colors = effectiveConfig.colorScheme || {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B'
  };

  // Extract layout settings
  const layout = effectiveConfig.layout || {
    gridColumns: 3,
    sidebarPosition: 'right'
  };

  // Extract features
  const features = effectiveConfig.features || {
    hasSlider: false,
    hasFeatured: true,
    hasBestSelling: false,
    hasCategories: true,
    hasNewsletter: true
  };

  // Extract customizations (images, fonts, footer, etc.)
  const customizations = {
    images: effectiveConfig.images || {},
    fonts: effectiveConfig.fonts || {},
    footer: effectiveConfig.footer || {}
  };

  // Loading state - show skeleton while template component is being loaded
  if (isLoading) {
    return <TemplateLoadingSkeleton templateName={store.template} />;
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Loading Error</h3>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render dynamic template if loaded
  if (DynamicTemplate) {
    return (
      <DynamicTemplate 
        store={store} 
        products={store.products || []}
        colors={colors}
        layout={layout}
        features={features}
        customizations={customizations}
      />
    );
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Not Available</h3>
        <p className="text-gray-600">Unable to load the selected template. Please try again.</p>
      </div>
    </div>
  );
};

export default StoreTemplateRenderer;