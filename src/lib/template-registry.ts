// Template Registry for Dynamic Imports
// This enables code splitting and lazy loading of template components

import { ComponentType } from 'react';

// Template component interfaces
export interface StoreTemplateProps {
  store: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    banner?: string;
    template: string;
    templateConfig?: any;
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

// Dynamic template registry with lazy loading
export const storeTemplateRegistry: Record<string, () => Promise<ComponentType<StoreTemplateProps>>> = {
  basic: () => import('@/components/store-templates/BasicStoreTemplate').then(mod => ({ default: mod.default })) as Promise<ComponentType<StoreTemplateProps>>,
  classic: () => import('@/components/store-templates/ClassicStoreTemplate').then(mod => ({ default: mod.default })) as Promise<ComponentType<StoreTemplateProps>>,
  ecommerce: () => import('@/components/store-templates/EcommerceStoreTemplate').then(mod => ({ default: mod.default })) as Promise<ComponentType<StoreTemplateProps>>,
};

// Template loader utility
export const loadTemplate = async (templateId: string): Promise<ComponentType<StoreTemplateProps> | null> => {
  try {
    const templateLoader = storeTemplateRegistry[templateId];
    if (!templateLoader) {
      console.warn(`Template ${templateId} not found in registry`);
      return null;
    }

    const TemplateComponent = await templateLoader();
    return (TemplateComponent as any).default || TemplateComponent;
  } catch (error) {
    console.error(`Failed to load template ${templateId}:`, error);
    return null;
  }
};

// Template preloader for better performance
export const preloadTemplate = (templateId: string): void => {
  const templateLoader = storeTemplateRegistry[templateId];
  if (templateLoader) {
    templateLoader().catch(error => {
      console.error(`Failed to preload template ${templateId}:`, error);
    });
  }
};

// Preload all templates (useful for critical templates)
export const preloadAllTemplates = (): void => {
  Object.keys(storeTemplateRegistry).forEach(templateId => {
    preloadTemplate(templateId);
  });
};

// Template validation
export const isValidTemplate = (templateId: string): boolean => {
  return templateId in storeTemplateRegistry;
};

// Get available template IDs
export const getAvailableTemplateIds = (): string[] => {
  return Object.keys(storeTemplateRegistry);
};

// Template metadata for registry
export const templateMetadata = {
  classic: {
    name: 'Classic Store',
    description: 'Clean, minimal design perfect for traditional retail stores',
    category: 'minimal',
    features: ['Simple navigation', 'Clean product grid', 'Basic product cards'],
    loadTime: '~50ms',
    bundleSize: '~15KB'
  },
  modern: {
    name: 'Modern Showcase',
    description: 'Contemporary design with slider and featured sections',
    category: 'modern',
    features: ['Image slider', 'Featured products', '4-column grid'],
    loadTime: '~75ms',
    bundleSize: '~25KB'
  },
  ecommerce: {
    name: 'E-commerce Pro',
    description: 'Professional business template with advanced features',
    category: 'professional',
    features: ['Full navigation', 'Promotional banners', 'Advanced filters'],
    loadTime: '~100ms',
    bundleSize: '~35KB'
  },
  creative: {
    name: 'Creative Portfolio',
    description: 'Artistic, gallery-style template for creative businesses',
    category: 'creative',
    features: ['Masonry grid', 'Portfolio showcase', 'Image lightbox'],
    loadTime: '~90ms',
    bundleSize: '~30KB'
  },
  mobile: {
    name: 'Mobile-First',
    description: 'Optimized for mobile shopping with app-like features',
    category: 'mobile',
    features: ['Swipeable carousel', 'Touch interface', 'PWA support'],
    loadTime: '~60ms',
    bundleSize: '~20KB'
  }
};

// Performance monitoring
export const templatePerformanceMonitor = {
  loadTimes: {} as Record<string, number>,
  
  startLoad: (templateId: string): void => {
    templatePerformanceMonitor.loadTimes[templateId] = Date.now();
  },
  
  endLoad: (templateId: string): number => {
    const startTime = templatePerformanceMonitor.loadTimes[templateId];
    if (startTime) {
      const loadTime = Date.now() - startTime;
      console.log(`Template ${templateId} loaded in ${loadTime}ms`);
      return loadTime;
    }
    return 0;
  },
  
  getAverageLoadTime: (): number => {
    const times = Object.values(templatePerformanceMonitor.loadTimes);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
};

export default storeTemplateRegistry;
