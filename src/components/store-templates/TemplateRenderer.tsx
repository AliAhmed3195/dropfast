'use client';

import React, { useState, useEffect } from 'react';
import { mergeTemplate, getEffectiveConfig } from '@/lib/mergeTemplate';

interface TemplateRendererProps {
  store: {
    id: string;
    name: string;
    description?: string;
    slug: string;
    logo?: string;
    banner?: string;
    address?: string;
    phone?: string;
    email?: string;
    template?: {
      id: string;
      name: string;
      slug: string;
      theme: any;
      pages: any;
    };
    templateId?: string;
    overrides?: any;
    products?: Array<{
      id: string;
      name: string;
      price: number;
      image: string;
      slug?: string;
    }>;
    featuredProducts?: Array<{
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
  };
  pageType?: 'landing' | 'productDetail' | 'cart' | 'checkout' | 'contact' | 'about';
}

const TemplateRenderer: React.FC<TemplateRendererProps> = ({ 
  store, 
  pageType = 'landing' 
}) => {
  const [sectionMap, setSectionMap] = useState<any>(null);
  const [PageComponent, setPageComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available theme folders (must match exactly)
  const validThemeSlugs = ['basic', 'classic', 'ecommerce', 'modern'];
  
  // Template slug mapping (in case database has different slugs)
  const templateSlugMap: Record<string, string> = {
    'ecommerce-pro': 'ecommerce',
    'modern-store': 'modern',
    'basic-template': 'basic',
    'classic-design': 'classic',
    'minimal': 'modern', // Fallback for minimal
  };

  // Get template slug from store, with mapping and validation
  const getTemplateSlug = (): string => {
    const dbSlug = store.template?.slug;
    if (!dbSlug) {
      console.warn('No template slug found, using modern as fallback');
      return 'modern';
    }

    // Check if slug needs mapping
    if (templateSlugMap[dbSlug]) {
      console.log(`Mapping template slug: ${dbSlug} -> ${templateSlugMap[dbSlug]}`);
      return templateSlugMap[dbSlug];
    }

    // Check if slug is valid
    if (validThemeSlugs.includes(dbSlug)) {
      return dbSlug;
    }

    // Invalid slug, use fallback
    console.warn(`Invalid template slug: ${dbSlug}. Available: ${validThemeSlugs.join(', ')}. Using modern as fallback.`);
    return 'modern';
  };

  const templateSlug = getTemplateSlug();

  // Load theme dynamically based on template slug
  useEffect(() => {
    const loadTheme = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Loading theme for template slug: ${templateSlug}`);

        // Dynamically import theme from src/themes/{slug}/index.ts
        const themeModule = await import(`@/themes/${templateSlug}/index`);
        
        if (themeModule?.sectionMap) {
          setSectionMap(themeModule.sectionMap);
          console.log(`✅ Theme ${templateSlug} loaded successfully`);
        } else {
          throw new Error(`Theme ${templateSlug} does not export sectionMap`);
        }

        // For non-landing pages, also load page component
        if (pageType !== 'landing' && themeModule?.pageComponents) {
          const component = themeModule.pageComponents[pageType as keyof typeof themeModule.pageComponents];
          if (component) {
            setPageComponent(() => component);
          } else {
            console.warn(`Page component for ${pageType} not found in theme ${templateSlug}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error loading theme ${templateSlug}:`, error);
        setError(error instanceof Error ? error.message : 'Failed to load theme');
        
        // Fallback to modern theme
        console.log('Attempting fallback to modern theme...');
        try {
          const fallbackTheme = await import('@/themes/modern/index');
          if (fallbackTheme?.sectionMap) {
            setSectionMap(fallbackTheme.sectionMap);
            console.log('✅ Fallback to modern theme successful');
          } else {
            throw new Error('Modern theme also failed to load');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback theme also failed:', fallbackError);
          setError('Failed to load any theme. Please contact support.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (templateSlug) {
      loadTheme();
    }
  }, [templateSlug, pageType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !sectionMap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load theme</p>
          <p className="text-gray-600">{error || 'Section map not found'}</p>
        </div>
      </div>
    );
  }

  // Merge template theme with vendor overrides
  const mergedTheme = mergeTemplate(store.template?.theme || {}, store.overrides);
  
  // Get page configuration from template
  const pageConfig = getEffectiveConfig(
    store.template?.pages?.[pageType] || store.template?.pages?.landing || {},
    store.overrides
  );

  // Handle different page types
  if (pageType === 'landing') {
    // Render sections for landing page
    const sections = pageConfig?.sections || ['hero', 'featured', 'footer'];

    return (
      <div className="min-h-screen">
        {sections.map((sectionName: string, index: number) => {
          const SectionComponent = sectionMap[sectionName as keyof typeof sectionMap];
          
          if (!SectionComponent) {
            console.warn(`Section "${sectionName}" not found in theme ${templateSlug}`);
            return null;
          }

          // Prepare props for each section
          const sectionProps: any = {
            store: {
              name: store.name,
              description: store.description,
              slug: store.slug,
              banner: store.banner,
              logo: store.logo,
              address: store.address,
              phone: store.phone,
              email: store.email,
            },
            theme: mergedTheme,
          };

          // Add page-specific props
          if (sectionName === 'featured') {
            sectionProps.products = store.featuredProducts || store.products || [];
          } else if (sectionName === 'categories' && store.categories) {
            sectionProps.categories = store.categories;
          }

          return (
            <SectionComponent key={`${sectionName}-${index}`} {...sectionProps} />
          );
        })}
      </div>
    );
  } else {
    // For productDetail, cart, checkout - use page-specific components
    if (!PageComponent) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const pageProps: any = {
      store: {
        name: store.name,
        description: store.description,
        slug: store.slug,
        banner: store.banner,
        logo: store.logo,
        address: store.address,
        phone: store.phone,
        email: store.email,
      },
      theme: mergedTheme,
    };

    // Add page-specific data
    if (pageType === 'productDetail' && (store as any).productDetail) {
      pageProps.product = (store as any).productDetail.product;
    } else if (pageType === 'cart' && (store as any).cart) {
      pageProps.cart = (store as any).cart;
    } else if (pageType === 'checkout' && (store as any).checkout) {
      pageProps.checkout = (store as any).checkout;
    }

    return <PageComponent {...pageProps} />;
  }
};

export default TemplateRenderer;

