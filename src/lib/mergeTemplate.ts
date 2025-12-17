/**
 * Merges template theme configuration with vendor overrides
 * This creates the final configuration used for rendering
 */

export interface TemplateTheme {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
  };
  layout?: {
    containerWidth?: string;
    spacing?: string;
  };
}

export interface VendorOverrides {
  logo?: string;
  banner?: string;
  primaryColor?: string;
}

/**
 * Merges template theme with vendor overrides
 * @param templateTheme - Base theme from template
 * @param overrides - Vendor customizations
 * @returns Merged theme configuration
 */
export function mergeTemplate(
  templateTheme: TemplateTheme | any,
  overrides: VendorOverrides | null | undefined
): TemplateTheme {
  // Start with template theme (or default)
  const mergedTheme: TemplateTheme = {
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#1F2937',
      ...templateTheme?.colors,
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      ...templateTheme?.typography,
    },
    layout: {
      containerWidth: 'max-w-7xl',
      spacing: 'md',
      ...templateTheme?.layout,
    },
  };

  // Apply vendor overrides (limited customization)
  if (overrides) {
    if (overrides.primaryColor) {
      mergedTheme.colors = {
        ...mergedTheme.colors,
        primary: overrides.primaryColor,
      };
    }
  }

  return mergedTheme;
}

/**
 * Gets the effective configuration for rendering
 * Combines template pages config with any store-specific modifications
 */
export function getEffectiveConfig(
  templatePages: any,
  storeOverrides: any
): any {
  // For now, template pages config is used as-is
  // Future: can merge store-specific page modifications here
  return templatePages || {};
}

