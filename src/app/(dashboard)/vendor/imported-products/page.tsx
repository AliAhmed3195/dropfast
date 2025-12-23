'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loading } from '@/components/ui/Loading';
import { Card } from '@/components/ui/Card';
import ProductImageSlider from '../../../../components/ProductImageSlider';

interface StoreProduct {
  id: string;
  lockedUSDPrice: number;
  lockedLocalPrice: number;
  localCurrency: string;
  markup: number;
  finalPrice: number;
  isActive: boolean;
  product: {
    id: string;
    name: string;
    description: string;
    category?: {
      id: string;
      name: string;
    };
    subcategory?: {
      id: string;
      name: string;
    };
    tags: Array<{
      tag: {
        id: string;
        name: string;
        color?: string;
      };
    }>;
    images: Array<{
      id: string;
      url: string;
      isMain: boolean;
      order: number;
    }>;
    supplier: {
      id: string;
      name: string;
      email: string;
    };
  };
  store: {
    id: string;
    name: string;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Store {
  id: string;
  name: string;
  currency: string;
  isActive: boolean;
}

export default function ImportedProductsPage() {
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [markup, setMarkup] = useState<{ [storeProductId: string]: number }>({});
  const [storeFilter, setStoreFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const hasFetchedProducts = useRef(false);
  const hasFetchedStores = useRef(false);

  const fetchImportedProducts = useCallback(async () => {
    if (hasFetchedProducts.current) return;
    hasFetchedProducts.current = true;
    
    try {
      const response = await fetch('/api/vendor/products/imported');
      const data = await response.json();
      setStoreProducts(data.products || []);
      
      // Initialize markup state
      const markupState: { [key: string]: number } = {};
      data.products?.forEach((sp: StoreProduct) => {
        markupState[sp.id] = sp.markup;
      });
      setMarkup(markupState);
    } catch (error) {
      console.error('Error fetching imported products:', error);
      hasFetchedProducts.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStores = useCallback(async () => {
    if (hasFetchedStores.current) return;
    hasFetchedStores.current = true;
    
    try {
      const response = await fetch('/api/stores');
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      hasFetchedStores.current = false;
    }
  }, []);

  useEffect(() => {
    fetchImportedProducts();
    fetchStores();
  }, [fetchImportedProducts, fetchStores]);

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'PKR': '₨',
      'INR': '₹',
    };
    return symbols[currency] || currency;
  };

  const formatPrice = (price: number, currency: string) => {
    return `${getCurrencySymbol(currency)}${price.toFixed(2)}`;
  };

  const handleMarkupChange = (storeProductId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMarkup(prev => ({
      ...prev,
      [storeProductId]: numValue
    }));
  };

  const handleUpdateMarkup = async (storeProductId: string) => {
    try {
      setUpdating(storeProductId);
      const newMarkup = markup[storeProductId] || 0;
      
      const response = await fetch(`/api/stores/imported-products/${storeProductId}/markup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markup: newMarkup,
        }),
      });

      if (response.ok) {
        // Update the local state
        setStoreProducts(prev => prev.map(sp => 
          sp.id === storeProductId 
            ? { 
                ...sp, 
                markup: newMarkup, 
                finalPrice: sp.lockedLocalPrice * (1 + newMarkup / 100)
              } 
            : sp
        ));
        alert('Markup updated successfully!');
      } else {
        const error = await response.text();
        alert(`Update failed: ${error}`);
      }
    } catch (error) {
      console.error('Error updating markup:', error);
      alert('Failed to update markup');
    } finally {
      setUpdating(null);
    }
  };

  const handleAddToStore = async (storeProductId: string) => {
    try {
      setUpdating(storeProductId);
      
      // Get user's stores for selection
      const storesResponse = await fetch('/api/stores');
      if (!storesResponse.ok) {
        alert('Failed to fetch stores');
        return;
      }
      
      const storesData = await storesResponse.json();
      const activeStores = storesData.stores.filter((store: any) => store.isActive);
      
      if (activeStores.length === 0) {
        alert('No active stores found. Please create a store first.');
        return;
      }
      
      // For now, use the first active store. In a real app, you'd show a modal to select store
      const selectedStore = activeStores[0];
      
      const response = await fetch('/api/vendor/products/add-to-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeProductId,
          storeId: selectedStore.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the local state
        setStoreProducts(prev => prev.map(sp => 
          sp.id === storeProductId 
            ? { 
                ...sp, 
                isActive: true,
                storeId: selectedStore.id,
                store: selectedStore
              } 
            : sp
        ));
        alert(data.message);
      } else {
        const error = await response.json();
        alert(`Failed to add to store: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding to store:', error);
      alert('Failed to add product to store');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveFromStore = async (storeProductId: string) => {
    try {
      setUpdating(storeProductId);
      
      const response = await fetch('/api/vendor/products/remove-from-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeProductId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the local state
        setStoreProducts(prev => prev.map(sp => 
          sp.id === storeProductId 
            ? { 
                ...sp, 
                isActive: false,
                store: data.storeProduct.store
              } 
            : sp
        ));
        alert(data.message);
      } else {
        const error = await response.json();
        alert(`Failed to remove from store: ${error.error}`);
      }
    } catch (error) {
      console.error('Error removing from store:', error);
      alert('Failed to remove product from store');
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleStatus = async (storeProductId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/stores/imported-products/${storeProductId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        setStoreProducts(prev => prev.map(sp => 
          sp.id === storeProductId 
            ? { ...sp, isActive: !currentStatus }
            : sp
        ));
      } else {
        const error = await response.text();
        alert(`Status update failed: ${error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  // Filter products based on filters
  const filteredProducts = storeProducts.filter(storeProduct => {
    const matchesStore = !storeFilter || storeProduct.store.id === storeFilter;
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && storeProduct.isActive) ||
      (statusFilter === 'inactive' && !storeProduct.isActive);
    const matchesSearch = !searchTerm || 
      storeProduct.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      storeProduct.product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      storeProduct.product.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      storeProduct.product.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      storeProduct.store.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStore && matchesStatus && matchesSearch;
  });

  const clearFilters = () => {
    setStoreFilter('');
    setStatusFilter('');
    setSearchTerm('');
  };

  const hasActiveFilters = storeFilter || statusFilter || searchTerm;

  if (loading) {
    return <Loading message="Loading imported products..." />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Imported Products
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your imported products and pricing
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Total: {filteredProducts.length} {hasActiveFilters && `(Filtered from ${storeProducts.length})`}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name, category, supplier..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Store Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Store
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
              >
                <option value="">All Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active (In Store)</option>
                <option value="inactive">Inactive (My Products)</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {hasActiveFilters 
                ? 'No products match your filters' 
                : 'No imported products found'
              }
            </div>
            <div className="text-gray-400 text-sm mt-2">
              {hasActiveFilters 
                ? 'Try adjusting your filters or clear them to see all products'
                : 'Import products from the Available Products page to get started'
              }
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Price (USD)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locked Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Markup %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((storeProduct) => {
                  const isNew = new Date(storeProduct.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <tr key={storeProduct.id} className="hover:bg-gray-50">
                      {/* Product */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 mr-3 flex-shrink-0">
                            {storeProduct.product?.images && storeProduct.product.images.length > 0 ? (
                              <ProductImageSlider 
                                images={storeProduct.product.images} 
                                productName={storeProduct.product?.name || 'Product'}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-md">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {storeProduct.product?.name || 'Unknown Product'}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                              {storeProduct.product?.description || 'No description'}
                            </div>
                            <div className="flex gap-1 mt-1">
                              {isNew && (
                                <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                              {storeProduct.product?.tags && storeProduct.product.tags.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {storeProduct.product.tags.length} tag{storeProduct.product.tags.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {storeProduct.store.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {storeProduct.store.currency}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {storeProduct.product?.category?.name || 'Uncategorized'}
                        </div>
                        {storeProduct.product?.subcategory && (
                          <div className="text-xs text-gray-500">
                            {storeProduct.product.subcategory.name}
                          </div>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {storeProduct.product?.supplier?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {storeProduct.product?.supplier?.email || ''}
                        </div>
                      </td>

                      {/* Base Price (USD) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(storeProduct.lockedUSDPrice, 'USD')}
                        </div>
                      </td>

                      {/* Locked Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {formatPrice(storeProduct.lockedLocalPrice, storeProduct.localCurrency)}
                        </div>
                      </td>

                      {/* Markup */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            step="0.1"
                            value={markup[storeProduct.id] || 0}
                            onChange={(e) => handleMarkupChange(storeProduct.id, e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                          <button
                            onClick={() => handleUpdateMarkup(storeProduct.id)}
                            disabled={updating === storeProduct.id}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title="Update Markup"
                          >
                            {updating === storeProduct.id ? '...' : '✓'}
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Current: {storeProduct.markup}%
                        </div>
                      </td>

                      {/* Final Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          {formatPrice(storeProduct.finalPrice, storeProduct.localCurrency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Base + {storeProduct.markup}%
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            storeProduct.isActive 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {storeProduct.isActive ? 'In Store' : 'My Products'}
                          </span>
                          <button
                            onClick={() => handleToggleStatus(storeProduct.id, storeProduct.isActive)}
                            className={`px-2 py-1 text-xs rounded-md ${
                              storeProduct.isActive 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {storeProduct.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col gap-1">
                          {!storeProduct.isActive ? (
                            <button
                              onClick={() => handleAddToStore(storeProduct.id)}
                              disabled={updating === storeProduct.id}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {updating === storeProduct.id ? 'Adding...' : 'Add to Store'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRemoveFromStore(storeProduct.id)}
                              disabled={updating === storeProduct.id}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {updating === storeProduct.id ? 'Removing...' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
