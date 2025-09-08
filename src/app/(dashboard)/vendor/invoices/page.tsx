'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { InvoiceTemplate } from '@/components/invoices/InvoiceTemplate';

interface Invoice {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  order: {
    id: string;
    quantity: number;
    product: {
      name: string;
      description: string;
      price: number;
      supplier: {
        name: string;
      };
    };
    customer: {
      name: string;
      email: string;
    };
  };
  store: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxNumber?: string;
    template: string;
  };
  customer: {
    name: string;
    email: string;
  };
}

export default function VendorInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/vendor/invoices');
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-gray-600">Manage and view your invoices</p>
      </div>

      {/* Invoice Preview Modal */}
      {showPreview && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Invoice Preview</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Print
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4">
              <InvoiceTemplate invoice={selectedInvoice} template={selectedInvoice.store.template as any} />
            </div>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-semibold">#{invoice.invoiceNumber}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium text-gray-900">Customer</p>
                    <p>{invoice.customer.name}</p>
                    <p>{invoice.customer.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Product</p>
                    <p>{invoice.order.product.name}</p>
                    <p>Qty: {invoice.order.quantity}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Amount</p>
                    <p className="text-lg font-bold text-indigo-600">${invoice.total.toFixed(2)}</p>
                    <p>{new Date(invoice.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handlePreviewInvoice(invoice)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                >
                  Preview
                </button>
                <button
                  onClick={() => handlePrintInvoice(invoice)}
                  className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
                >
                  Print
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {invoices.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">No invoices found.</p>
        </Card>
      )}
    </div>
  );
}
