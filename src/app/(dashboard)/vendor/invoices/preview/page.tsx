'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import InvoiceRenderer from '@/components/invoices/InvoiceRenderer';
import TemplateSelector from '@/components/invoices/TemplateSelector';

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

export default function InvoicePreviewPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setStores(data.stores || []);
      if (data.stores?.length > 0) {
        setSelectedStore(data.stores[0]);
        setSelectedTemplate(data.stores[0].invoiceTemplate);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for preview
  const mockInvoice = {
    id: 'inv-123',
    invoiceNumber: 'INV-2024-001',
    subtotal: 100.00,
    tax: 0.00,
    total: 100.00,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  const mockOrder = {
    id: 'ord-123',
    quantity: 1,
    productPrice: 100.00,
    markupAmount: 20.00,
    totalAmount: 100.00,
    createdAt: new Date().toISOString(),
    product: {
      name: 'Sample Product',
      image: 'https://via.placeholder.com/150',
      category: 'Electronics',
      supplier: {
        name: 'Sample Supplier',
      },
    },
  };

  const mockCustomer = {
    name: 'John Doe',
    email: 'john@example.com',
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
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invoice Template Preview</h1>
        <p className="text-gray-600">Preview how your invoices will look with different templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Selector */}
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Store & Template</h2>
            
            {/* Store Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Store</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedStore?.id || ''}
                onChange={(e) => {
                  const store = stores.find(s => s.id === e.target.value);
                  if (store) {
                    setSelectedStore(store);
                    setSelectedTemplate(store.invoiceTemplate);
                  }
                }}
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Template</label>
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateSelect={setSelectedTemplate}
              />
            </div>
          </Card>
        </div>

        {/* Invoice Preview */}
        <div className="lg:col-span-3">
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Invoice Preview</h2>
              <p className="text-sm text-gray-600">
                This is how your invoice will look to customers
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <InvoiceRenderer
                templateName={selectedTemplate}
                invoiceData={{
                  id: mockInvoice.id,
                  subtotal: mockInvoice.subtotal,
                  tax: mockInvoice.tax,
                  total: mockInvoice.total,
                  date: mockInvoice.createdAt,
                  orderId: mockOrder.id,
                  items: [{
                    name: mockOrder.product.name,
                    quantity: mockOrder.quantity,
                    price: mockOrder.productPrice
                  }]
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
