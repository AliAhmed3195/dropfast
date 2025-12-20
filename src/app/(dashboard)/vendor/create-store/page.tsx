'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import TemplateSelector from '@/components/store-templates/TemplateSelector';
import TemplatePreview from '@/components/store-templates/TemplatePreview';
import DynamicTemplatePreview from '@/components/store-templates/DynamicTemplatePreview';
import TemplateCustomizer from '@/components/store-templates/TemplateCustomizer';
import { StoreTemplate } from '@/lib/store-templates';

export default function CreateStorePage() {
  const [currentStep, setCurrentStep] = useState<'template' | 'customize' | 'setup'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDynamicPreview, setShowDynamicPreview] = useState(false);
  const [previewCustomizations, setPreviewCustomizations] = useState<any>(null);
  const [templateCustomizations, setTemplateCustomizations] = useState<any>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    templateId: '',
    logo: '',
    banner: ''
  });
  const [primaryColor, setPrimaryColor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [userCurrency, setUserCurrency] = useState('USD');

  const hasFetchedCurrency = useRef(false);

  const fetchUserCurrency = useCallback(async () => {
    if (hasFetchedCurrency.current) return;
    hasFetchedCurrency.current = true;
    
    // Currency is always USD now
    setUserCurrency('USD');
  }, []);

  useEffect(() => {
    fetchUserCurrency();
  }, [fetchUserCurrency]);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setFormData(prev => ({ ...prev, templateId: template.id }));
    // Set default primary color from template theme
    if (template.theme?.colors?.primary) {
      setPrimaryColor(template.theme.colors.primary);
    }
  };

  const handleContinueToCustomize = () => {
    if (selectedTemplate) {
      setCurrentStep('customize');
    }
  };

  const handleContinueToSetup = () => {
    setCurrentStep('setup');
  };

  const handleBackToTemplate = () => {
    setCurrentStep('template');
  };

  const handleBackToCustomize = () => {
    setCurrentStep('customize');
  };

  const handleCustomizationChange = (customizations: any) => {
    setTemplateCustomizations(customizations);
  };

  const handleTemplatePreview = (template: any) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleUseTemplate = (template: StoreTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({ ...prev, template: template.id }));
    setShowPreview(false);
  };

  const handleDynamicPreview = (template: StoreTemplate, customizations: any) => {
    setSelectedTemplate(template);
    setPreviewCustomizations(customizations);
    setShowDynamicPreview(true);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          logo: data.url
        }));
        setLogoPreview(data.url);
        setError('');
      } else {
        setError('Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError('Failed to upload logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if we have a selected template
    if (!selectedTemplate) {
      setError('Please select a template first');
      setLoading(false);
      return;
    }

    try {
      if (!formData.templateId) {
        setError('Please select a template');
        setLoading(false);
        return;
      }

      // Vendor can only customize: logo, banner, primaryColor
      const overrides: any = {};
      if (formData.logo) overrides.logo = formData.logo;
      if (formData.banner) overrides.banner = formData.banner;
      if (primaryColor) overrides.primaryColor = primaryColor;

      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          slug: formData.slug,
          templateId: formData.templateId,
          logo: formData.logo || null,
          banner: formData.banner || null,
          overrides: Object.keys(overrides).length > 0 ? overrides : null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Store created successfully!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          slug: '',
          templateId: '',
          logo: '',
          banner: ''
        });
        setPrimaryColor('');
        setLogoPreview('');
        // Redirect to stores page
        window.location.href = '/vendor/stores';
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create store');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      setError('Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Store</h1>
        <p className="text-gray-600">
          {currentStep === 'template' 
            ? 'Choose a template for your store' 
            : 'Complete your store setup'
          }
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <div className={`flex items-center ${currentStep === 'template' ? 'text-blue-600' : currentStep === 'customize' || currentStep === 'setup' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'template' ? 'bg-blue-600 text-white' : 
              currentStep === 'customize' || currentStep === 'setup' ? 'bg-green-600 text-white' : 
              'bg-gray-300 text-gray-600'
            }`}>
              {currentStep === 'template' ? '1' : '✓'}
            </div>
            <span className="ml-2 font-medium">Choose Template</span>
          </div>
          <div className={`flex-1 h-1 ${currentStep === 'customize' || currentStep === 'setup' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${currentStep === 'customize' ? 'text-blue-600' : currentStep === 'setup' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'customize' ? 'bg-blue-600 text-white' : 
              currentStep === 'setup' ? 'bg-green-600 text-white' : 
              'bg-gray-300 text-gray-600'
            }`}>
              {currentStep === 'customize' ? '2' : currentStep === 'setup' ? '✓' : '2'}
            </div>
            <span className="ml-2 font-medium">Customize</span>
          </div>
          <div className={`flex-1 h-1 ${currentStep === 'setup' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${currentStep === 'setup' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'setup' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
            <span className="ml-2 font-medium">Store Setup</span>
          </div>
        </div>
      </div>

      {currentStep === 'template' ? (
        <div>
          <TemplateSelector
            onTemplateSelect={handleTemplateSelect}
            onTemplatePreview={handleTemplatePreview}
            selectedTemplate={selectedTemplate?.id}
          />
          
          {selectedTemplate && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleContinueToCustomize}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Continue with {selectedTemplate.name}
              </button>
            </div>
          )}
        </div>
      ) : currentStep === 'customize' ? (
        <div>
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBackToCustomize}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Customization
            </button>
          </div>

          {/* Selected Template Info */}
          {selectedTemplate && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {selectedTemplate.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-blue-900">{selectedTemplate.name}</h3>
                  <p className="text-blue-700">Customize your template settings</p>
                </div>
              </div>
            </div>
          )}

          {/* Template Customizer */}
          {selectedTemplate && (
            <div className="max-w-4xl">
              <TemplateCustomizer
                template={selectedTemplate}
                onCustomizationsChange={handleCustomizationChange}
                initialCustomizations={templateCustomizations}
              />
              
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleContinueToSetup}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Continue to Store Setup
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBackToTemplate}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Template Selection
            </button>
      </div>

          {/* Selected Template Info */}
          {selectedTemplate && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {selectedTemplate.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-blue-900">{selectedTemplate.name}</h3>
                  <p className="text-blue-700">{selectedTemplate.description}</p>
                </div>
              </div>
            </div>
          )}

      <div className="max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Enter your store name"
              />
            </div>

            {/* Store Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store URL Slug *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  fastdrop.com/store/
                </span>
                <input
                  type="text"
                  name="slug"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="your-store-name"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will be your store's unique URL. Only letters, numbers, and hyphens allowed.
              </p>
            </div>

            {/* Store Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what your store sells..."
              />
            </div>

            {/* Store Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Logo
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {logoPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Logo Preview:</p>
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-20 w-20 object-contain border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload your store logo (PNG, JPG, GIF - Max 5MB). This will appear on invoices and store pages.
              </p>
            </div>

            {/* Invoice Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Invoice Template
              </label>
              <select
                name="template"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.templateId}
                onChange={handleInputChange}
              >
                <option value="default">Default Template</option>
                <option value="modern">Modern Template</option>
                <option value="minimal">Minimal Template</option>
                <option value="professional">Professional Template</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You can change this later in store settings.
              </p>
            </div>

            {/* Store Currency Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Store Currency
                  </h3>
                  <div className="mt-1 text-sm text-blue-700">
                 <p>Your store will use <strong>USD</strong> as the default currency.</p>
                 <p className="mt-1">All prices are displayed in USD for consistency across the platform.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => window.location.href = '/vendor/stores'}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Store'}
              </button>
            </div>
          </form>
        </Card>
      </div>

      {/* Help Section */}
      <div className="mt-8 max-w-2xl">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">What happens after creating a store?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                <div>
                  <p className="font-medium">Store Created</p>
                  <p>Your store will be available at fastdrop.com/store/{formData.slug || 'your-store-name'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                <div>
                  <p className="font-medium">Import Products</p>
                  <p>Browse and import products from suppliers to your store</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                <div>
                  <p className="font-medium">Create Hosted Links</p>
                  <p>Generate hosted links to send directly to customers</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                <div>
                  <p className="font-medium">Customize Branding</p>
                  <p>Upload logo and customize invoice templates</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onUseTemplate={handleUseTemplate}
        />
      )}

      {/* Dynamic Template Preview Modal */}
      {selectedTemplate && (
        <DynamicTemplatePreview
          template={selectedTemplate}
          isOpen={showDynamicPreview}
          onClose={() => setShowDynamicPreview(false)}
          onUseTemplate={handleUseTemplate}
          customizations={previewCustomizations}
        />
      )}
    </div>
  );
}
