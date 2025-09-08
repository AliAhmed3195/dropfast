'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

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

export default function VendorLogoUploadPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
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
        setPreview(data.stores[0].logo || null);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
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

  const handleUpload = async () => {
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
          fetchStores();
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
        fetchStores();
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
        <h1 className="text-2xl font-bold">Logo Upload</h1>
        <p className="text-gray-600">Upload and manage your store logos for invoice branding</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Selection */}
        <div>
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
                  {store.logo && (
                    <p className="text-xs text-green-600 mt-1">✓ Has logo</p>
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Logo Upload */}
        <div>
          {selectedStore && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Upload Logo for {selectedStore.name}</h2>
              
              {/* Current Logo Preview */}
              {preview && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Logo:</h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img
                      src={preview}
                      alt="Current logo"
                      className="max-h-32 mx-auto object-contain"
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload New Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>

                {/* Preview */}
                {selectedFile && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img
                        src={preview || ''}
                        alt="Preview"
                        className="max-h-32 mx-auto object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </button>
              </div>

              {/* Logo Guidelines */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Logo Guidelines:</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use high-quality images for best results</li>
                  <li>• Recommended size: 200x200 pixels or larger</li>
                  <li>• Transparent backgrounds work best</li>
                  <li>• Logo will appear on customer invoices</li>
                  <li>• Supports JPG, PNG, and GIF formats</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
