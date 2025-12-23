'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
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
        // Reset guard to allow refetch
        hasFetchedStores.current = false;
        await fetchStores();
        alert(`Invoice template updated successfully for "${selectedStore?.name}"!\n\nAll future invoices from this store will use the "${AVAILABLE_TEMPLATES.find(t => t.id === templateId)?.name || templateId}" template.\n\nNote: This template is specific to this store only. Other stores can have different templates.`);
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
    return <Loading message="Loading stores..." />;
  }

  // Show templates even if no stores exist, but with a message
  if (stores.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Invoice Templates</h1>
          <p className="text-gray-600">Preview available invoice templates</p>
        </div>

        <Card className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">No stores found</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You need to create a store first to apply invoice templates. You can preview templates below.
                </p>
                <a
                  href="/vendor/stores"
                  className="mt-2 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                >
                  Create Store
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* Show available templates for preview */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Available Invoice Templates</h2>
          <p className="text-sm text-gray-600 mb-6">
            Preview these templates. Once you create a store, you can select a template for it.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            {AVAILABLE_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-4 border-gray-200"
              >
                <div className="mb-3">
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>

                {/* Template Preview */}
                <div className="border rounded p-3 bg-gray-50 min-h-[150px]">
                  <InvoiceRenderer 
                    templateName={template.id} 
                    invoiceData={mockInvoiceData}
                  />
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setShowPreview(true);
                    }}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Preview Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoice Templates</h1>
          <p className="text-gray-600">Choose and preview invoice templates for your stores</p>
        </div>
        {stores.length > 0 && (
          <div className="text-sm text-gray-600">
            Total Stores: {stores.length} | Selected: {selectedStore?.name || 'None'}
          </div>
        )}
      </div>

      {/* Store Selection Dropdown */}
      {stores.length > 0 && (
        <Card className="mb-6">
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Store
            </label>
            <select
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              value={selectedStore?.id || ''}
              onChange={(e) => {
                const store = stores.find(s => s.id === e.target.value);
                if (store) {
                  setSelectedStore(store);
                  setSelectedTemplate(store.invoiceTemplate || 'default');
                }
              }}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} - Current: {AVAILABLE_TEMPLATES.find(t => t.id === store.invoiceTemplate)?.name || 'Default'}
                </option>
              ))}
            </select>
            {selectedStore && (
              <p className="mt-2 text-sm text-gray-600">
                Managing templates for: <span className="font-semibold text-indigo-600">{selectedStore.name}</span>
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Template Grid - Similar to Admin Page */}
      {selectedStore ? (
        <div className="grid gap-6 md:grid-cols-2">
          {AVAILABLE_TEMPLATES.map((template) => (
            <Card key={template.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    {selectedStore.invoiceTemplate === template.id && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Current
                      </span>
                    )}
                  </div>
                </div>

                {/* Template Preview - Scaled like Admin */}
                <div className="mb-4">
                  <div className="border rounded-lg bg-gray-50 min-h-[300px] max-h-[400px] overflow-hidden relative">
                    <div className="absolute inset-0 overflow-auto p-3">
                      <div className="transform scale-[0.45] origin-top-left" style={{ width: '222%', minHeight: '222%' }}>
                        <div className="bg-white shadow-sm">
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
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setShowPreview(true);
                    }}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Preview Template
                  </button>
                  
                  <button
                    onClick={() => updateStoreTemplate(selectedStore.id, template.id)}
                    className={`w-full px-3 py-2 rounded-md text-sm ${
                      selectedStore.invoiceTemplate === template.id
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                    disabled={selectedStore.invoiceTemplate === template.id}
                  >
                    {selectedStore.invoiceTemplate === template.id ? 'Currently Selected' : 'Select This Template'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-center text-gray-500 py-8">
            Please select a store to manage invoice templates.
          </p>
        </Card>
      )}

      {/* Full Preview Modal - Similar to Admin */}
      {showPreview && selectedStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Template Preview</h2>
                  <p className="text-sm text-gray-600 mt-1">Store: {selectedStore.name}</p>
                </div>
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
                {selectedStore.invoiceTemplate !== selectedTemplate && (
                  <button
                    onClick={() => {
                      updateStoreTemplate(selectedStore.id, selectedTemplate);
                      setShowPreview(false);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Use This Template
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
