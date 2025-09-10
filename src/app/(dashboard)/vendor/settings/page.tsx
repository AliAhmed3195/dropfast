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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

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
        setPreview(data.stores[0].logo || null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!selectedFile || !selectedStore) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const logoUrl = data.url;

        // Update store with new logo
        const updateResponse = await fetch(`/api/stores/by-id/${selectedStore.id}/settings`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logo: logoUrl }),
        });

        if (updateResponse.ok) {
          alert('Logo uploaded successfully!');
          handleInputChange('logo', logoUrl);
          setSelectedFile(null);
        } else {
          const error = await updateResponse.json();
          alert(error.error || 'Failed to update store logo');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!selectedStore) return;

    if (!confirm('Are you sure you want to remove the logo?')) return;

    try {
      const response = await fetch(`/api/stores/by-id/${selectedStore.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logo: null }),
      });

      if (response.ok) {
        alert('Logo removed successfully!');
        handleInputChange('logo', '');
        setPreview(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove logo');
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      alert('Failed to remove logo');
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
                  onClick={() => {
                    setSelectedStore(store);
                    setPreview(store.logo || null);
                    setSelectedFile(null);
                  }}
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
                  
                  {/* Current Logo Preview */}
                  {preview && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Current Logo:</h3>
                      <div className="border rounded-lg p-4 bg-gray-50 inline-block">
                        <img
                          src={preview}
                          alt="Current logo"
                          className="max-h-24 mx-auto object-contain"
                        />
                      </div>
                      <button
                        onClick={removeLogo}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove Logo
                      </button>
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="space-y-3">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: JPG, PNG, GIF. Max size: 5MB
                      </p>
                    </div>

                    {/* Upload Button */}
                    {selectedFile && (
                      <button
                        onClick={handleLogoUpload}
                        disabled={uploading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                      </button>
                    )}

                    {/* Manual URL Input */}
                    <div className="pt-2 border-t">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Or enter logo URL manually:
                      </label>
                      <input
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={selectedStore.logo || ''}
                        onChange={(e) => {
                          handleInputChange('logo', e.target.value);
                          setPreview(e.target.value);
                        }}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
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
