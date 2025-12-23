'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { InvoiceTemplate } from '@/components/invoices/InvoiceTemplate';

interface Invoice {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  template?: string; // Template saved when invoice was created
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
    id: string;
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxNumber?: string;
    invoiceTemplate: string;
  };
  customer: {
    name: string;
    email: string;
  };
}

interface Store {
  id: string;
  name: string;
}

export default function VendorInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    storeId: '',
    status: '',
    fromDate: '',
    toDate: '',
  });

  const hasFetchedInvoices = useRef(false);
  const hasFetchedStores = useRef(false);

  const fetchStores = useCallback(async () => {
    if (hasFetchedStores.current) return;
    hasFetchedStores.current = true;
    
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setStores(data.stores || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      hasFetchedStores.current = false;
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    hasFetchedInvoices.current = false; // Allow refetch when filters change
    hasFetchedInvoices.current = true;
    
    try {
      setLoading(true);
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.storeId) params.append('storeId', filters.storeId);
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      
      const queryString = params.toString();
      const url = `/api/vendor/invoices${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      hasFetchedInvoices.current = false;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      storeId: '',
      status: '',
      fromDate: '',
      toDate: '',
    });
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
    return <Loading message="Loading invoices..." />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-gray-600">Manage and view your invoices</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Store Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.storeId}
                onChange={(e) => handleFilterChange('storeId', e.target.value)}
              >
                <option value="">All Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* From Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              />
            </div>

            {/* To Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                min={filters.fromDate || undefined}
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </Card>

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
              {/* Use invoice.template (saved when invoice was created from store.invoiceTemplate) */}
              {/* This ensures each invoice uses the template that was selected for its store at creation time */}
              <InvoiceTemplate 
                invoice={{
                  ...selectedInvoice,
                  template: selectedInvoice.template || selectedInvoice.store?.invoiceTemplate || 'default'
                }} 
                template={(selectedInvoice.template || selectedInvoice.store?.invoiceTemplate || 'default') as 'default' | 'modern' | 'minimal' | 'professional'} 
              />
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
                  <p>Store: {selectedInvoice.store?.name}</p>
                  <p>Template used: {selectedInvoice.template || selectedInvoice.store?.invoiceTemplate || 'default'}</p>
                  <p>Template source: {selectedInvoice.template ? 'invoice.template (saved at creation)' : 'store.invoiceTemplate (current)'}</p>
                </div>
              )}
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
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium text-gray-900">Store</p>
                    <p className="text-indigo-600 font-medium">{invoice.store.name}</p>
                  </div>
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
          <p className="text-center text-gray-500 py-8">
            {Object.values(filters).some(v => v) 
              ? 'No invoices found matching your filters.' 
              : 'No invoices found.'}
          </p>
        </Card>
      )}

      {/* Results Count */}
      {invoices.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          {filters.storeId && ` for ${stores.find(s => s.id === filters.storeId)?.name || 'selected store'}`}
          {filters.status && ` with status: ${filters.status}`}
          {(filters.fromDate || filters.toDate) && ' in selected date range'}
        </div>
      )}
    </div>
  );
}
