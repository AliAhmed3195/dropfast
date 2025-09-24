'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  template: string;
  logo?: string;
  banner?: string;
  isActive: boolean;
  createdAt: string;
}

const STORE_TEMPLATES = [
  { id: 'default', name: 'Default Store', description: 'Clean and simple design' },
  { id: 'modern', name: 'Modern Store', description: 'Contemporary and sleek' },
  { id: 'minimal', name: 'Minimal Store', description: 'Minimalist and focused' },
  { id: 'colorful', name: 'Colorful Store', description: 'Bright and vibrant' },
];

export default function VendorStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    description: '',
    slug: '',
    template: 'default',
    logo: '',
    banner: ''
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

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
    setNewStore(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!selectedFile) return;

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
        console.log('Logo upload successful:', data);
        setNewStore(prev => ({
          ...prev,
          logo: data.url
        }));
        setLogoPreview(data.url);
        setSelectedFile(null);
      } else {
        const errorText = await response.text();
        console.error('Logo upload failed:', errorText);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUpload = async () => {
    if (!selectedBannerFile) return;

    console.log('Uploading banner file:', selectedBannerFile.name);
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedBannerFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Banner upload successful:', data);
        setNewStore(prev => ({
          ...prev,
          banner: data.url
        }));
        setBannerPreview(data.url);
        setSelectedBannerFile(null);
      } else {
        const errorText = await response.text();
        console.error('Banner upload failed:', errorText);
      }
    } catch (error) {
      console.error('Banner upload error:', error);
    } finally {
      setUploadingBanner(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setStores(data.stores || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating store with data:', newStore);
    console.log('Logo URL:', newStore.logo);
    console.log('Banner URL:', newStore.banner);
    
    // Validate required fields
    if (!newStore.name || !newStore.description || !newStore.slug) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStore),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Store created successfully:', result);
        setNewStore({
          name: '',
          description: '',
          slug: '',
          template: 'default',
          logo: '',
          banner: ''
        });
        setLogoPreview('');
        setBannerPreview('');
        setSelectedFile(null);
        setSelectedBannerFile(null);
        setShowCreateForm(false);
        fetchStores();
      } else {
        const errorText = await response.text();
        console.error('Store creation failed:', errorText);
      }
    } catch (error) {
      console.error('Error creating store:', error);
    }
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/stores/by-id/${storeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchStores();
      }
    } catch (error) {
      console.error('Error updating store:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Stores</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Store
        </button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Store</h2>
          <form onSubmit={handleCreateStore} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={newStore.name}
                onChange={handleNameChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Slug
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={newStore.slug}
                onChange={(e) => setNewStore({ ...newStore, slug: e.target.value })}
                placeholder="auto-generated from store name"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your store URL: /store/{newStore.slug}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={newStore.description}
                onChange={(e) => setNewStore({ ...newStore, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={newStore.template}
                onChange={(e) => setNewStore({ ...newStore, template: e.target.value })}
              >
                {STORE_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
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
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleLogoUpload}
                    disabled={uploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </button>
                )}
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

            {/* Store Banner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Banner
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {selectedBannerFile && (
                  <button
                    type="button"
                    onClick={handleBannerUpload}
                    disabled={uploadingBanner}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                  </button>
                )}
                {bannerPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Banner Preview:</p>
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="h-32 w-full object-cover border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload your store banner (PNG, JPG, GIF - Max 5MB). This will appear as a hero image on your store page.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Create Store
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Card key={store.id}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                {store.logo && (
                  <img 
                    src={store.logo} 
                    alt={store.name} 
                    className="h-10 w-10 object-contain border border-gray-200 rounded"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{store.name}</h3>
                  {store.banner && (
                    <p className="text-xs text-green-600">✓ Banner uploaded</p>
                  )}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  store.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {store.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{store.description}</p>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm">
                <span className="font-medium">Slug:</span> {store.slug}
              </p>
              <p className="text-sm">
                <span className="font-medium">Template:</span> {store.template}
              </p>
              <p className="text-sm">
                <span className="font-medium">Created:</span>{' '}
                {new Date(store.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <a
                  href={`/store/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm text-center"
                >
                  View Store
                </a>
                <button
                  onClick={() => toggleStoreStatus(store.id, store.isActive)}
                  className={`px-3 py-2 rounded-md text-sm ${
                    store.isActive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {store.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
              <div className="text-center">
                <a
                  href={`/vendor/stores/${store.id}/products`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  View Products & Hosted Links
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {stores.length === 0 && (
        <Card>
          <p className="text-center text-gray-500">No stores found. Create your first store!</p>
        </Card>
      )}
    </div>
  );
}
