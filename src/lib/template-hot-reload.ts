// Template Hot Reload System
// This enables real-time updates when template files are modified

import React from 'react';

export interface TemplateChangeEvent {
  templateId: string;
  changeType: 'component' | 'style' | 'config';
  timestamp: number;
  data?: any;
}

class TemplateHotReload {
  private listeners: Map<string, ((event: TemplateChangeEvent) => void)[]> = new Map();
  private isEnabled: boolean = false;

  constructor() {
    // Only enable in development
    this.isEnabled = process.env.NODE_ENV === 'development';
    
    if (this.isEnabled) {
      this.initializeHotReload();
    }
  }

  private initializeHotReload() {
    // Listen for file changes in development
    if (typeof window !== 'undefined') {
      // This would integrate with your build system's hot reload
      console.log('🔥 Template Hot Reload enabled');
    }
  }

  // Subscribe to template changes
  subscribe(templateId: string, callback: (event: TemplateChangeEvent) => void) {
    if (!this.isEnabled) return;

    if (!this.listeners.has(templateId)) {
      this.listeners.set(templateId, []);
    }
    
    this.listeners.get(templateId)!.push(callback);
  }

  // Unsubscribe from template changes
  unsubscribe(templateId: string, callback: (event: TemplateChangeEvent) => void) {
    if (!this.isEnabled) return;

    const callbacks = this.listeners.get(templateId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit template change event
  emit(templateId: string, changeType: TemplateChangeEvent['changeType'], data?: any) {
    if (!this.isEnabled) return;

    const event: TemplateChangeEvent = {
      templateId,
      changeType,
      timestamp: Date.now(),
      data
    };

    const callbacks = this.listeners.get(templateId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in template change callback:', error);
        }
      });
    }
  }

  // Force refresh a specific template
  refreshTemplate(templateId: string) {
    this.emit(templateId, 'component');
  }

  // Update template configuration
  updateConfig(templateId: string, config: any) {
    this.emit(templateId, 'config', config);
  }

  // Update template styles
  updateStyles(templateId: string, styles: any) {
    this.emit(templateId, 'style', styles);
  }
}

// Create singleton instance
export const templateHotReload = new TemplateHotReload();

// React hook for template hot reload
export function useTemplateHotReload(templateId: string) {
  const [lastUpdate, setLastUpdate] = React.useState<number>(0);

  React.useEffect(() => {
    const handleChange = (event: TemplateChangeEvent) => {
      setLastUpdate(event.timestamp);
    };

    templateHotReload.subscribe(templateId, handleChange);

    return () => {
      templateHotReload.unsubscribe(templateId, handleChange);
    };
  }, [templateId]);

  return lastUpdate;
}

// Development helper functions
export const devHelpers = {
  // Simulate template change (for testing)
  simulateChange: (templateId: string, changeType: TemplateChangeEvent['changeType'] = 'component') => {
    templateHotReload.emit(templateId, changeType);
  },

  // Force refresh all templates
  refreshAll: () => {
    ['classic', 'modern', 'ecommerce', 'creative', 'mobile'].forEach(templateId => {
      templateHotReload.refreshTemplate(templateId);
    });
  },

  // Update template configuration
  updateTemplateConfig: (templateId: string, config: any) => {
    templateHotReload.updateConfig(templateId, config);
  }
};

// Make dev helpers available in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).templateDev = devHelpers;
}
