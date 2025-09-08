'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import TemplateSelector from '@/components/invoices/TemplateSelector';

interface StoreSettings {
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

const INVOICE_TEMPLATES = [
  { id: 'default', name: 'Default', description: 'Clean and professional' },
  { id: 'modern', name: 'Modern', description: 'Contemporary design' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and clean' },
  { id: 'professional', name: 'Professional', description: 'Business-focused' },
];

export default function VendorSettingsPage() {
  const [stores, setStores] = useState<StoreSettings[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/stores/by-id/${selectedStore.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo: selectedStore.logo,
          address: selectedStore.address,
          phone: selectedStore.phone,
          email: selectedStore.email,
          taxNumber: selectedStore.taxNumber,
          invoiceTemplate: selectedStore.invoiceTemplate,
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
        fetchStores();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof StoreSettings, value: string) => {
    if (selectedStore) {
      setSelectedStore({
        ...selectedStore,
        [field]: value,
      });
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
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <p className="text-gray-600">Configure your store branding and invoice settings</p>
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
                  onClick={() => setSelectedStore(store)}
                  className={`w-full text-left p-3 rounded-md border ${
                    selectedStore?.id === store.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium">{store.name}</p>
                  <p className="text-sm text-gray-600">{store.description}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2">
          {selectedStore && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Store Branding & Invoice Settings</h2>
              
              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="url"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={selectedStore.logo || ''}
                      onChange={(e) => handleInputChange('logo', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <a
                      href="/vendor/logo-upload"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm whitespace-nowrap"
                    >
                      Upload Logo
                    </a>
                  </div>
                  {selectedStore.logo && (
                    <div className="mt-2">
                      <img
                        src={selectedStore.logo}
                        alt="Store logo"
                        className="h-16 w-16 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Address
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedStore.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={selectedStore.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={selectedStore.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="store@example.com"
                    />
                  </div>
                </div>

                {/* Tax Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Number / Business ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedStore.taxNumber || ''}
                    onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                    placeholder="TAX123456789"
                  />
                </div>

                {/* Invoice Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Invoice Template
                  </label>
                  <TemplateSelector
                    selectedTemplate={selectedStore.invoiceTemplate}
                    onTemplateSelect={(templateId) => handleInputChange('invoiceTemplate', templateId)}
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
