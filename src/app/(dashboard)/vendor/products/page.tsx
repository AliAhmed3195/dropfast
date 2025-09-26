'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductImageSlider from '../../../../components/ProductImageSlider';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  lockedUSDPrice: number | null;
  exchangeRateAtCreation: number;
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
  createdAt: string;
  updatedAt: string;
  isImported: boolean;
  importedStores: Array<{
    id: string;
    name: string;
    currency: string;
  }>;
}

interface Store {
  id: string;
  name: string;
  currency: string;
  isActive: boolean;
}

interface CurrencyRate {
  [key: string]: number;
}

export default function VendorProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<CurrencyRate>({});
  const [converting, setConverting] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [importing, setImporting] = useState<string | null>(null);
  const [markup, setMarkup] = useState<{ [productId: string]: number }>({});
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  useEffect(() => {
    fetchUserCurrency();
    fetchProducts();
    fetchStores();
  }, []);

  useEffect(() => {
    if (userCurrency && userCurrency !== 'USD') {
      fetchExchangeRates();
    }
  }, [userCurrency]);

  const fetchUserCurrency = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        setUserCurrency(user.preferredCurrency || 'USD');
      }
    } catch (error) {
      console.error('Error fetching user currency:', error);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      setConverting(true);
      const response = await fetch(`/api/currency/convert?from=USD&to=${userCurrency}&amount=1`);
      if (response.ok) {
        const data = await response.json();
        setExchangeRates(prev => ({
          ...prev,
          [userCurrency]: data.rate
        }));
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setConverting(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/available');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setStores(data.stores || []);
      if (data.stores && data.stores.length > 0) {
        setSelectedStore(data.stores[0].id);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const convertPrice = (usdPrice: number | null, originalPrice?: number) => {
    const priceToUse = usdPrice || originalPrice || 0;
    if (userCurrency === 'USD') return priceToUse;
    const rate = exchangeRates[userCurrency];
    if (!rate) return priceToUse;
    return Math.round(priceToUse * rate * 100) / 100;
  };

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

  const handleImportProduct = async (productId: string) => {
    if (!selectedStore) {
      alert('Please select a store first');
      return;
    }

    try {
      setImporting(productId);
      const productMarkup = markup[productId] || 0;
      
      const response = await fetch(`/api/stores/import-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          storeId: selectedStore,
          markup: productMarkup,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Product imported successfully!');
        // Refresh the products list to update import status
        fetchProducts();
      } else {
        const error = await response.text();
        alert(`Import failed: ${error}`);
      }
    } catch (error) {
      console.error('Error importing product:', error);
      alert('Failed to import product');
    } finally {
      setImporting(null);
    }
  };

  const handleMarkupChange = (productId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMarkup(prev => ({
      ...prev,
      [productId]: numValue
    }));
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
          Available Products
        </h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Your Currency: <span className="font-semibold">{userCurrency}</span>
          </div>
          {converting && (
            <div className="text-sm text-blue-600">
              Converting prices...
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 space-y-4">
        {stores.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Import to Store:
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Show:
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Only Available Products</span>
              </label>
            </div>
            <div className="text-sm text-gray-600">
              {showOnlyAvailable 
                ? `Showing ${products.filter(p => !p.isImported).length} available products`
                : `Showing ${products.length} total products`
              }
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Currency Conversion Info</h3>
        <p className="text-sm text-blue-800">
          Prices are shown in your preferred currency ({userCurrency}) for display only. 
          When you import a product, the price will be locked in your currency at that moment.
        </p>
      </div>

      {(() => {
        const filteredProducts = showOnlyAvailable 
          ? products.filter(p => !p.isImported)
          : products;
        
        return filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {showOnlyAvailable 
                ? 'No available products for import' 
                : 'No products found'
              }
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
            const convertedPrice = convertPrice(product.lockedUSDPrice, product.price);
            const isNew = new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const hasLockedUSDPrice = product.lockedUSDPrice !== null;
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group relative">
                {/* Product Image */}
                <div className="relative overflow-hidden rounded-t-lg">
                  {product.images && product.images.length > 0 ? (
                    <ProductImageSlider images={product.images} />
                  ) : (
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {product.category?.name || 'N/A'}
                    </span>
                    {isNew && (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        🆕 New
                      </span>
                    )}
                    {product.featured && (
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  {/* Additional Info */}
                  <div className="mb-3 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Supplier: {product.supplier.name}</span>
                      <span>Subcategory: {product.subcategory?.name || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* Price Display */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500">
                        {hasLockedUSDPrice ? 'Original (USD)' : 'Price (USD)'}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {hasLockedUSDPrice 
                          ? formatPrice(product.lockedUSDPrice!, 'USD')
                          : formatPrice(product.price, 'USD')
                        }
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Your Currency</div>
                      <div className="text-xl font-bold text-indigo-600">
                        {formatPrice(convertedPrice, userCurrency)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {hasLockedUSDPrice 
                          ? `Rate: ${exchangeRates[userCurrency]?.toFixed(4) || 'Loading...'}`
                          : 'Using original price'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/vendor/products/${product.id}`)}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-center"
                    >
                      View Details
                    </button>
                    {product.isImported ? (
                      <button
                        onClick={() => handleImportProduct(product.id)}
                        disabled={importing === product.id || !selectedStore}
                        className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {importing === product.id ? 'Importing...' : 'Import Again'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleImportProduct(product.id)}
                        disabled={importing === product.id || !selectedStore}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {importing === product.id ? 'Importing...' : 'Quick Import'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        );
      })()}

    </div>
  );
}
