'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

export default function CreateStorePage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    template: 'default',
    logo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState('');

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

    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Store created successfully!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          slug: '',
          template: 'default',
          logo: ''
        });
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
        <p className="text-gray-600">Set up a new store to start selling products</p>
      </div>

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
                value={formData.template}
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
  );
}
