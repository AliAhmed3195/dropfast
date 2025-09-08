'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import InvoiceRenderer from '@/components/invoices/InvoiceRenderer';

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  isDefault: boolean;
  isActive: boolean;
}

const mockInvoiceData = {
  id: 'INV-001',
  orderId: 'ORD-12345',
  date: new Date().toLocaleDateString(),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    address: '123 Main St, City, State 12345'
  },
  store: {
    name: 'Sample Store',
    email: 'store@example.com',
    phone: '+1 (555) 123-4567',
    address: '456 Business Ave, City, State 12345',
    logo: '/logo-placeholder.png',
    taxNumber: 'TAX-123456'
  },
  items: [
    {
      name: 'Sample Product',
      description: 'A sample product for demonstration',
      quantity: 2,
      price: 25.00,
      total: 50.00
    }
  ],
  subtotal: 50.00,
  tax: 5.00,
  total: 55.00,
  status: 'PAID'
};

export default function AdminInvoiceTemplatesPage() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([
    {
      id: 'default',
      name: 'Default Template',
      description: 'Clean and professional default invoice template',
      preview: 'default',
      isDefault: true,
      isActive: true
    },
    {
      id: 'modern',
      name: 'Modern Template',
      description: 'Contemporary design with modern styling',
      preview: 'modern',
      isDefault: false,
      isActive: true
    },
    {
      id: 'minimal',
      name: 'Minimal Template',
      description: 'Simple and elegant minimal design',
      preview: 'minimal',
      isDefault: false,
      isActive: true
    },
    {
      id: 'professional',
      name: 'Professional Template',
      description: 'Business-focused professional template',
      preview: 'professional',
      isDefault: false,
      isActive: true
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [showPreview, setShowPreview] = useState(false);

  const toggleTemplateStatus = (templateId: string) => {
    setTemplates(templates.map(template => 
      template.id === templateId 
        ? { ...template, isActive: !template.isActive }
        : template
    ));
  };

  const setDefaultTemplate = (templateId: string) => {
    setTemplates(templates.map(template => ({
      ...template,
      isDefault: template.id === templateId
    })));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoice Templates Management</h1>
        <div className="text-sm text-gray-600">
          Total Templates: {templates.length} | Active: {templates.filter(t => t.isActive).length}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
                <div className="flex space-x-2">
                  {template.isDefault && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Default
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Template Preview */}
              <div className="mb-4">
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px]">
                  <InvoiceRenderer 
                    templateName={template.preview} 
                    invoiceData={mockInvoiceData}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(template.preview);
                    setShowPreview(true);
                  }}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                >
                  Preview Template
                </button>
                
                {!template.isDefault && (
                  <button
                    onClick={() => setDefaultTemplate(template.id)}
                    className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    Set as Default
                  </button>
                )}
                
                <button
                  onClick={() => toggleTemplateStatus(template.id)}
                  className={`w-full px-3 py-2 rounded-md text-sm ${
                    template.isActive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {template.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Full Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Template Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="border rounded-lg p-6 bg-white">
                <InvoiceRenderer 
                  templateName={selectedTemplate} 
                  invoiceData={mockInvoiceData}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
