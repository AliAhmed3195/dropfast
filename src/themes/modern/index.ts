// Modern theme section map
// This exports all sections/components used by this theme

import HeroSection from './HeroSection';
import FeaturedSection from './FeaturedSection';
import Footer from './Footer';

// Section map: maps section names to their React components
export const sectionMap = {
  hero: HeroSection,
  featured: FeaturedSection,
  footer: Footer,
} as const;

// Export type for section map
export type SectionMap = typeof sectionMap;

// Export default config (can be loaded from config.json at runtime)
export const defaultConfig = {
  name: 'Modern',
  slug: 'modern',
  version: 1,
  pages: {
    landing: {
      sections: ['hero', 'featured', 'footer'],
      layout: 'grid',
      gridColumns: 3,
    },
    productDetail: {
      layout: 'single-column',
      showRelatedProducts: true,
    },
  },
  theme: {
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
    },
  },
  editableFields: {
    logo: true,
    banner: true,
    primaryColor: true,
  },
};

// Export all components for direct imports if needed
export { HeroSection, FeaturedSection, Footer };

