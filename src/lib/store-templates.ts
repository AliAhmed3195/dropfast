export interface StoreTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: {
    hasSlider: boolean;
    hasFeatured: boolean;
    hasBestSelling: boolean;
    hasCategories: boolean;
    hasNewsletter: boolean;
  };
  layout: {
    gridColumns: number;
    sidebarPosition: 'left' | 'right' | 'none';
  };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  requirements: {
    required: string[];
    optional: string[];
    templateSpecific: string[];
  };
  category: 'minimal' | 'modern' | 'professional' | 'creative' | 'mobile';
}

export interface TemplateConfig {
  hasSlider: boolean;
  hasFeatured: boolean;
  hasBestSelling: boolean;
  hasCategories: boolean;
  hasNewsletter: boolean;
  gridColumns: number;
  sidebarPosition: 'left' | 'right' | 'none';
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  customizations: {
    enableCustomCSS: boolean;
    enableCustomFonts: boolean;
    enableAdvancedLayout: boolean;
  };
}

export const storeTemplates: StoreTemplate[] = [
  {
    id: 'basic',
    name: 'Basic Store',
    description: 'Simple, clean design perfect for quick setup and fast loading',
    preview: 'https://picsum.photos/800/600?random=1',
    features: {
      hasSlider: false,
      hasFeatured: true,
      hasBestSelling: false,
      hasCategories: true,
      hasNewsletter: true
    },
    layout: {
      gridColumns: 3,
      sidebarPosition: 'none'
    },
    colorScheme: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B'
    },
    requirements: {
      required: ['storeName', 'storeLogo', 'contactEmail'],
      optional: ['storeBanner', 'storeDescription', 'contactPhone'],
      templateSpecific: []
    },
    category: 'minimal'
  },
  {
    id: 'classic',
    name: 'Classic Store',
    description: 'Traditional e-commerce design with promotional slider',
    preview: 'https://picsum.photos/800/600?random=2',
    features: {
      hasSlider: true,
      hasFeatured: true,
      hasBestSelling: false,
      hasCategories: true,
      hasNewsletter: true
    },
    layout: {
      gridColumns: 3,
      sidebarPosition: 'right'
    },
    colorScheme: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#DC2626'
    },
    requirements: {
      required: ['storeName', 'storeLogo', 'contactEmail'],
      optional: ['storeBanner', 'storeDescription', 'contactPhone'],
      templateSpecific: ['sliderImages']
    },
    category: 'modern'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Pro',
    description: 'Professional template with all features for established businesses',
    preview: 'https://picsum.photos/800/600?random=3',
    features: {
      hasSlider: true,
      hasFeatured: true,
      hasBestSelling: true,
      hasCategories: true,
      hasNewsletter: true
    },
    layout: {
      gridColumns: 4,
      sidebarPosition: 'left'
    },
    colorScheme: {
      primary: '#7C3AED',
      secondary: '#0891B2',
      accent: '#EA580C'
    },
    requirements: {
      required: ['storeName', 'storeLogo', 'contactEmail'],
      optional: ['storeBanner', 'storeDescription', 'contactPhone'],
      templateSpecific: ['sliderImages', 'featuredProducts', 'bestSellingProducts']
    },
    category: 'professional'
  }
];

export const getTemplateById = (id: string): StoreTemplate | undefined => {
  return storeTemplates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): StoreTemplate[] => {
  return storeTemplates.filter(template => template.category === category);
};

// Default template configurations for fallback
export const defaultTemplateConfig: Record<string, Partial<StoreTemplate>> = {
  basic: {
    features: {
      hasSlider: false,
      hasFeatured: true,
      hasBestSelling: false,
      hasCategories: true,
      hasNewsletter: true
    },
    layout: {
      gridColumns: 3,
      sidebarPosition: 'none'
    },
    colorScheme: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B'
    }
  },
  classic: {
    features: {
      hasSlider: true,
      hasFeatured: true,
      hasBestSelling: false,
      hasCategories: true,
      hasNewsletter: true
    },
    layout: {
      gridColumns: 3,
      sidebarPosition: 'right'
    },
    colorScheme: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#DC2626'
    }
  },
  ecommerce: {
    features: {
      hasSlider: true,
      hasFeatured: true,
      hasBestSelling: true,
      hasCategories: true,
      hasNewsletter: true
    },
    layout: {
      gridColumns: 4,
      sidebarPosition: 'left'
    },
    colorScheme: {
      primary: '#7C3AED',
      secondary: '#0891B2',
      accent: '#EA580C'
    }
  }
};

// Config fallback system - merges DB config with defaults
export const getEffectiveConfig = (templateId: string, dbConfig: any = {}) => {
  const defaultConfig = defaultTemplateConfig[templateId];
  if (!defaultConfig) {
    console.warn(`No default config found for template: ${templateId}`);
    // Return a safe default config instead of dbConfig
    return {
      features: {
        hasSlider: false,
        hasFeatured: true,
        hasBestSelling: false,
        hasCategories: true,
        hasNewsletter: true
      },
      layout: {
        gridColumns: 3,
        sidebarPosition: 'right'
      },
      colorScheme: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B'
      },
      images: {},
      fonts: {},
      footer: {}
    };
  }

  // Deep merge default config with DB config
  // Handle both structured (features/layout/colorScheme) and flat (hasSlider, etc.) configs for backward compatibility
  const dbFeatures = dbConfig.features || {};
  const dbLayout = dbConfig.layout || {};
  const dbColorScheme = dbConfig.colorScheme || {};
  
  // Extract flat properties from root level (for backward compatibility with old saved configs)
  // Flat properties will be merged with structured config, but structured config takes precedence
  const flatFeatures = {};
  if (dbConfig.hasSlider !== undefined) flatFeatures.hasSlider = dbConfig.hasSlider;
  if (dbConfig.hasFeatured !== undefined) flatFeatures.hasFeatured = dbConfig.hasFeatured;
  if (dbConfig.hasBestSelling !== undefined) flatFeatures.hasBestSelling = dbConfig.hasBestSelling;
  if (dbConfig.hasCategories !== undefined) flatFeatures.hasCategories = dbConfig.hasCategories;
  if (dbConfig.hasNewsletter !== undefined) flatFeatures.hasNewsletter = dbConfig.hasNewsletter;
  
  const flatLayout = {};
  if (dbConfig.gridColumns !== undefined) flatLayout.gridColumns = dbConfig.gridColumns;
  if (dbConfig.sidebarPosition !== undefined) flatLayout.sidebarPosition = dbConfig.sidebarPosition;

  // Template defaults take precedence - merge order: defaults -> flat -> structured
  // This ensures template features are enabled by default, but allows DB overrides
  const effectiveConfig = {
    features: {
      ...defaultConfig.features,  // Template defaults first (e.g., hasSlider: true for ecommerce)
      ...flatFeatures,  // Flat DB config (for backward compatibility)
      ...dbFeatures  // Structured DB config takes final precedence
    },
    layout: {
      ...defaultConfig.layout,  // Template defaults first (e.g., gridColumns: 4, sidebarPosition: 'left' for ecommerce)
      ...flatLayout,  // Flat DB config (for backward compatibility)
      ...dbLayout  // Structured DB config takes final precedence
    },
    colorScheme: {
      ...defaultConfig.colorScheme,  // Template defaults first (e.g., purple colors for ecommerce)
      ...(typeof dbConfig.colorScheme === 'object' && !Array.isArray(dbConfig.colorScheme) && dbConfig.colorScheme !== null 
        ? dbConfig.colorScheme 
        : {}),  // Handle flat colorScheme if it exists
      ...dbColorScheme  // Structured DB config takes final precedence
    },
    // Include any additional customizations from DB (images, fonts, footer, etc.)
    images: dbConfig.images || {},
    fonts: dbConfig.fonts || {},
    footer: dbConfig.footer || {}
  };

  return effectiveConfig;
};

export const getDefaultTemplateConfig = (templateId: string): TemplateConfig => {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  return {
    hasSlider: template.features.hasSlider,
    hasFeatured: template.features.hasFeatured,
    hasBestSelling: template.features.hasBestSelling,
    hasCategories: template.features.hasCategories,
    hasNewsletter: template.features.hasNewsletter,
    gridColumns: template.layout.gridColumns,
    sidebarPosition: template.layout.sidebarPosition,
    colorScheme: { ...template.colorScheme },
    customizations: {
      enableCustomCSS: false,
      enableCustomFonts: false,
      enableAdvancedLayout: false
    }
  };
};

export const validateTemplateRequirements = (
  templateId: string,
  providedData: Record<string, any>
): { isValid: boolean; missingFields: string[] } => {
  const template = getTemplateById(templateId);
  if (!template) {
    return { isValid: false, missingFields: ['Invalid template'] };
  }

  const allRequired = [
    ...template.requirements.required,
    ...template.requirements.templateSpecific
  ];

  const missingFields = allRequired.filter(field => !providedData[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};
