'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Store {
  id: string;
  name: string;
  slug: string;
  autoForwardOrders: boolean;
  currency: string;
  createdAt: string;
}

export default function VendorSettingsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const hasFetchedStores = useRef(false);

  const fetchStores = useCallback(async () => {
    if (hasFetchedStores.current) return;
    hasFetchedStores.current = true;
    
    try {
      setLoading(true);
      const response = await fetch('/api/stores');
      const data = await response.json();

      if (response.ok) {
        setStores(data.stores || []);
      } else {
        console.error('Error fetching stores:', data);
        hasFetchedStores.current = false;
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      hasFetchedStores.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const updateAutoForwardSetting = async (storeId: string, autoForward: boolean) => {
    try {
      setUpdating(storeId);
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autoForwardOrders: autoForward
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setStores(stores.map(store => 
          store.id === storeId 
            ? { ...store, autoForwardOrders: autoForward }
            : store
        ));
        alert('Store settings updated successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating store settings:', error);
      alert('Error updating store settings');
    } finally {
      setUpdating(null);
    }
  };

  const getCurrencyName = (currency: string) => {
    const currencyNames: { [key: string]: string } = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'PKR': 'Pakistani Rupee',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'JPY': 'Japanese Yen',
      'INR': 'Indian Rupee',
      'MYR': 'Malaysian Ringgit'
    };
    return currencyNames[currency] || currency;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your store settings and order processing preferences
          </p>
        </div>

        {/* Stores List */}
        {stores.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No stores found</div>
            <p className="text-gray-400 mt-2">
              Create a store first to manage settings
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {stores.map((store) => (
              <div key={store.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {store.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Store URL: /store/{store.slug}
                    </p>
                    <p className="text-sm text-gray-600">
                      Currency: {getCurrencyName(store.currency)} ({store.currency})
                    </p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(store.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Order Processing Settings */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Order Processing Settings
                  </h4>

                  <div className="space-y-4">
                    {/* Auto-Forward Orders Setting */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          Auto-Forward Orders
                        </h5>
                        <p className="text-sm text-gray-600">
                          {store.autoForwardOrders 
                            ? 'Orders are automatically forwarded to suppliers after payment'
                            : 'Orders require manual approval before forwarding to suppliers'
                          }
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className={`flex items-center ${store.autoForwardOrders ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${store.autoForwardOrders ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              Auto-Forward (Recommended)
                            </div>
                            <div className={`flex items-center ${!store.autoForwardOrders ? 'text-red-600' : 'text-gray-400'}`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${!store.autoForwardOrders ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                              Manual Approval
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6">
                        <button
                          onClick={() => updateAutoForwardSetting(store.id, !store.autoForwardOrders)}
                          disabled={updating === store.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            store.autoForwardOrders ? 'bg-blue-600' : 'bg-gray-200'
                          } ${updating === store.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              store.autoForwardOrders ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Setting Descriptions */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h6 className="text-sm font-medium text-gray-900 mb-2">
                        {store.autoForwardOrders ? 'Auto-Forward Mode' : 'Manual Approval Mode'}
                      </h6>
                      <div className="text-sm text-gray-600 space-y-2">
                        {store.autoForwardOrders ? (
                          <>
                            <p>✅ Orders are processed automatically after customer payment</p>
                            <p>✅ Faster order processing and customer satisfaction</p>
                            <p>✅ Less manual work required</p>
                            <p>⚠️ Less control over individual orders</p>
                          </>
                        ) : (
                          <>
                            <p>🔍 Each order requires your manual review and approval</p>
                            <p>✅ Full control over order quality and customer verification</p>
                            <p>✅ Better for high-value or custom products</p>
                            <p>⚠️ More time required for order management</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h6 className="text-sm font-medium text-blue-800">
                            Recommendation
                          </h6>
                          <div className="mt-1 text-sm text-blue-700">
                            {store.autoForwardOrders ? (
                              <p>
                                Auto-forward is recommended for most stores. You can always switch to manual approval 
                                if you need more control over specific orders.
                              </p>
                            ) : (
                              <p>
                                Manual approval is good for quality control. Consider switching to auto-forward 
                                once you're comfortable with your order volume and supplier relationships.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Need Help?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Auto-Forward Orders
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Best for established stores</li>
                <li>• High-volume order processing</li>
                <li>• Trusted supplier relationships</li>
                <li>• Standard product categories</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Manual Approval
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• New or growing stores</li>
                <li>• High-value products</li>
                <li>• Custom or personalized items</li>
                <li>• Quality control requirements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}