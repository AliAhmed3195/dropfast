'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  template: string;
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
    template: 'default',
  });

  useEffect(() => {
    fetchStores();
  }, []);

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
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStore),
      });

      if (response.ok) {
        setNewStore({
          name: '',
          description: '',
          template: 'default',
        });
        setShowCreateForm(false);
        fetchStores();
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
          Create Store
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
                onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
              />
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
              <h3 className="text-lg font-semibold">{store.name}</h3>
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
