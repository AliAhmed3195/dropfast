'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

export default function ImportedProductsPage() {
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [markup, setMarkup] = useState<{ [storeProductId: string]: number }>({});

  const hasFetchedProducts = useRef(false);

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

  useEffect(() => {
    fetchImportedProducts();
  }, [fetchImportedProducts]);

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Imported Products
        </h1>
        <div className="text-sm text-gray-600">
          Manage your imported products and pricing
        </div>
      </div>

      {storeProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No imported products found</div>
          <div className="text-gray-400 text-sm mt-2">
            Import products from the Available Products page to get started
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storeProducts.map((storeProduct) => {
            const isNew = new Date(storeProduct.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            return (
              <div key={storeProduct.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {storeProduct.product?.images && storeProduct.product.images.length > 0 ? (
                    <ProductImageSlider 
                      images={storeProduct.product.images} 
                      productName={storeProduct.product?.name || 'Product'}
                    />
                  ) : (
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                  
                  {isNew && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    </div>
                  )}
                  
                  {/* Store Status and Toggle */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {storeProduct.isActive ? (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        In Store
                      </span>
                    ) : (
                      <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                        My Products
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleToggleStatus(storeProduct.id, storeProduct.isActive)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        storeProduct.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {storeProduct.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {storeProduct.product?.name || 'Unknown Product'}
                    </h3>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {storeProduct.product?.description || 'No description available'}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Store:</span>
                      <span className="font-medium">
                        {storeProduct.store.name} ({storeProduct.store.currency})
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium">
                        {storeProduct.product?.category?.name || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Supplier:</span>
                      <span className="font-medium">
                        {storeProduct.product?.supplier?.name || 'Unknown Supplier'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Base Price (USD)</div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(storeProduct.lockedUSDPrice, 'USD')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Locked Price</div>
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(storeProduct.lockedLocalPrice, storeProduct.localCurrency)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Markup Percentage (%)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            step="0.1"
                            value={markup[storeProduct.id] || 0}
                            onChange={(e) => handleMarkupChange(storeProduct.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                          <button
                            onClick={() => handleUpdateMarkup(storeProduct.id)}
                            disabled={updating === storeProduct.id}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {updating === storeProduct.id ? 'Updating...' : 'Update'}
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-600 mb-1">Final Price:</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(storeProduct.finalPrice, storeProduct.localCurrency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Base: {formatPrice(storeProduct.lockedLocalPrice, storeProduct.localCurrency)} + {storeProduct.markup}% markup
                        </div>
                      </div>
                    </div>
                  </div>

                  {storeProduct.product?.tags && storeProduct.product.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {storeProduct.product.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: tag.tag.color ? `${tag.tag.color}20` : '#f3f4f6',
                            color: tag.tag.color || '#374151',
                          }}
                        >
                          {tag.tag.name}
                        </span>
                      ))}
                      {storeProduct.product.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{storeProduct.product.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex space-x-2">
                      {!storeProduct.isActive ? (
                        <button
                          onClick={() => handleAddToStore(storeProduct.id)}
                          disabled={updating === storeProduct.id}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {updating === storeProduct.id ? 'Adding...' : 'Add to Store'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoveFromStore(storeProduct.id)}
                          disabled={updating === storeProduct.id}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {updating === storeProduct.id ? 'Removing...' : 'Remove from Store'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
