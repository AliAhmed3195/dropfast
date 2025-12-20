'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import InvoiceRenderer from '@/components/invoices/InvoiceRenderer';

interface Store {
  id: string;
  name: string;
  description: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  invoiceTemplate: string;
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

const AVAILABLE_TEMPLATES = [
  { id: 'default', name: 'Default Template', description: 'Clean and professional default invoice template' },
  { id: 'modern', name: 'Modern Template', description: 'Contemporary design with modern styling' },
  { id: 'minimal', name: 'Minimal Template', description: 'Simple and elegant minimal design' },
  { id: 'professional', name: 'Professional Template', description: 'Business-focused professional template' },
];

export default function VendorInvoiceTemplatesPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  const hasFetchedStores = useRef(false);

  const fetchStores = useCallback(async () => {
    if (hasFetchedStores.current) return;
    hasFetchedStores.current = true;
    
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setStores(data.stores || []);
      if (data.stores?.length > 0) {
        setSelectedStore(data.stores[0]);
        setSelectedTemplate(data.stores[0].invoiceTemplate || 'default');
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      hasFetchedStores.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const updateStoreTemplate = async (storeId: string, templateId: string) => {
    try {
      const response = await fetch(`/api/stores/by-id/${storeId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceTemplate: templateId }),
      });

      if (response.ok) {
        fetchStores();
        alert('Invoice template updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (stores.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-center text-gray-500 py-8">
            No stores found. Please create a store first.
          </p>
          <div className="text-center">
            <a
              href="/vendor/stores"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Create Store
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invoice Templates</h1>
        <p className="text-gray-600">Choose and preview invoice templates for your stores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Selection */}
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Select Store</h2>
            <div className="space-y-2">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store);
                    setSelectedTemplate(store.invoiceTemplate || 'default');
                  }}
                  className={`w-full text-left p-3 rounded-md border ${
                    selectedStore?.id === store.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium">{store.name}</p>
                  <p className="text-sm text-gray-600">{store.description}</p>
                  <p className="text-xs text-indigo-600 mt-1">
                    Current: {AVAILABLE_TEMPLATES.find(t => t.id === store.invoiceTemplate)?.name || 'Default'}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Template Selection */}
        <div className="lg:col-span-2">
          {selectedStore && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Available Templates</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                {AVAILABLE_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                      {selectedStore.invoiceTemplate === template.id && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>

                    {/* Template Preview */}
                    <div className="border rounded p-3 bg-gray-50 min-h-[150px]">
                      <InvoiceRenderer 
                        templateName={template.id} 
                        invoiceData={{
                          ...mockInvoiceData,
                          store: {
                            ...mockInvoiceData.store,
                            name: selectedStore.name,
                            email: selectedStore.email || 'store@example.com',
                            phone: selectedStore.phone || '+1 (555) 123-4567',
                            address: selectedStore.address || '456 Business Ave, City, State 12345',
                            logo: selectedStore.logo || '/logo-placeholder.png',
                            taxNumber: selectedStore.taxNumber || 'TAX-123456'
                          }
                        }}
                      />
                    </div>

                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setShowPreview(true);
                        }}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => updateStoreTemplate(selectedStore.id, template.id)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm ${
                          selectedStore.invoiceTemplate === template.id
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                        disabled={selectedStore.invoiceTemplate === template.id}
                      >
                        {selectedStore.invoiceTemplate === template.id ? 'Current' : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Full Preview Modal */}
      {showPreview && selectedStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Template Preview - {selectedStore.name}</h2>
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
                  invoiceData={{
                    ...mockInvoiceData,
                    store: {
                      ...mockInvoiceData.store,
                      name: selectedStore.name,
                      email: selectedStore.email || 'store@example.com',
                      phone: selectedStore.phone || '+1 (555) 123-4567',
                      address: selectedStore.address || '456 Business Ave, City, State 12345',
                      logo: selectedStore.logo || '/logo-placeholder.png',
                      taxNumber: selectedStore.taxNumber || 'TAX-123456'
                    }
                  }}
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    updateStoreTemplate(selectedStore.id, selectedTemplate);
                    setShowPreview(false);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
