import { prisma } from '@/lib/prisma';
import { storeTemplates, StoreTemplate, getEffectiveConfig } from '@/lib/store-templates';

// Centralized template management
// This ensures template definitions are centralized in store-templates.ts
// Changes to template definitions will reflect across ALL stores using that template
export class TemplateManager {
  // Get template configuration (centralized + store-specific customizations)
  static async getEffectiveTemplateConfig(templateId: string, storeId?: string) {
    // Get centralized template definition from store-templates.ts
    const template = this.getTemplateDefinition(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Get store-specific customizations if storeId provided
    let storeCustomizations = {};
    if (storeId) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { templateConfig: true }
      });
      storeCustomizations = store?.templateConfig || {};
    }

    // Use getEffectiveConfig from store-templates.ts for proper merging
    // This merges centralized template defaults with store-specific customizations
    return getEffectiveConfig(templateId, storeCustomizations);
  }

  // Get centralized template definition from store-templates.ts
  // ⚠️ IMPORTANT: Changes to template definitions in store-templates.ts
  // will automatically reflect across ALL stores using that template
  static getTemplateDefinition(templateId: string): StoreTemplate | null {
    // Use centralized definitions from store-templates.ts
    // This ensures single source of truth for template definitions
    return storeTemplates.find(t => t.id === templateId) || null;
  }

  // Get template definition (async version for compatibility)
  static async getTemplateDefinitionAsync(templateId: string): Promise<StoreTemplate | null> {
    return this.getTemplateDefinition(templateId);
  }

  // Update template definition (for future use - currently updates code-level)
  // Note: To change template definitions, update src/lib/store-templates.ts directly
  // Changes will reflect across ALL stores using that template after server restart
  static updateTemplateDefinition(templateId: string, updates: Partial<StoreTemplate>) {
    console.log(`Template ${templateId} definition update requested:`, updates);
    console.warn('⚠️  To apply template changes, update src/lib/store-templates.ts directly');
    console.warn('⚠️  Changes will reflect across ALL stores using this template');
    // TODO: Future enhancement - move template definitions to database for runtime updates
  }

  // Update store-specific customizations (affects only one store)
  // This updates only the store's customizations (images, fonts, etc.)
  // Template definition (colors, layout, features) remains unchanged
  static async updateStoreCustomizations(storeId: string, customizations: any) {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        templateConfig: customizations
      }
    });
  }

  // Get all available templates
  // Returns all templates defined in store-templates.ts
  static getAllTemplates(): StoreTemplate[] {
    // Return all templates from centralized definition
    return storeTemplates;
  }

  // Get all available templates (async version for compatibility)
  static async getAllTemplatesAsync(): Promise<StoreTemplate[]> {
    return this.getAllTemplates();
  }
}
