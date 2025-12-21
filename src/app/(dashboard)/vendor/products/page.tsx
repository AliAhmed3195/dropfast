'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
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
  featured?: boolean;
  sku?: string;
  brandName?: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [tags, setTags] = useState<Array<{id: string; name: string; color?: string}>>([]);
  const hasFetchedTags = useRef(false);

  const hasFetchedCurrency = useRef(false);
  const hasFetchedProducts = useRef(false);
  const hasFetchedStores = useRef(false);
  const hasFetchedRates = useRef<string>('');

  const fetchUserCurrency = useCallback(async () => {
    if (hasFetchedCurrency.current) return;
    hasFetchedCurrency.current = true;
    
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        const currency = user.business?.preferredCurrency || 'USD';
        setUserCurrency(currency);
      }
    } catch (error) {
      console.error('Error fetching user currency:', error);
      hasFetchedCurrency.current = false;
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    if (hasFetchedProducts.current) return;
    hasFetchedProducts.current = true;
    
    try {
      const response = await fetch('/api/products/available');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
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
        if (data.stores && data.stores.length > 0) {
          setSelectedStore(data.stores[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      hasFetchedStores.current = false;
    }
  }, []);

  const fetchTags = useCallback(async () => {
    if (hasFetchedTags.current) return;
    hasFetchedTags.current = true;
    
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || data || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      hasFetchedTags.current = false;
    }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    if (userCurrency === 'USD' || hasFetchedRates.current === userCurrency) return;
    hasFetchedRates.current = userCurrency;
    
    try {
      setConverting(true);
      console.log('Fetching exchange rate for:', userCurrency);
      const response = await fetch(`/api/currency/convert?from=USD&to=${userCurrency}&amount=1`);
      console.log('Exchange rate response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Exchange rate data:', data);
        setExchangeRates(prev => ({
          ...prev,
          [userCurrency]: data.exchangeRate
        }));
      } else {
        const errorText = await response.text();
        console.error('Exchange rate API error:', errorText);
        // Set a fallback rate
        const fallbackRates: { [key: string]: number } = {
          'EUR': 0.85,
          'GBP': 0.73,
          'PKR': 280.0,
          'CAD': 1.35,
          'AUD': 1.50,
          'JPY': 150.0,
          'INR': 83.0,
        };
        if (fallbackRates[userCurrency]) {
          setExchangeRates(prev => ({
            ...prev,
            [userCurrency]: fallbackRates[userCurrency]
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Set a fallback rate
      const fallbackRates: { [key: string]: number } = {
        'EUR': 0.85,
        'GBP': 0.73,
        'PKR': 280.0,
        'CAD': 1.35,
        'AUD': 1.50,
        'JPY': 150.0,
        'INR': 83.0,
      };
      if (fallbackRates[userCurrency]) {
        setExchangeRates(prev => ({
          ...prev,
          [userCurrency]: fallbackRates[userCurrency]
        }));
      }
    } finally {
      setConverting(false);
    }
  }, [userCurrency]);

  useEffect(() => {
    fetchUserCurrency();
    fetchProducts();
    fetchStores();
    fetchTags();
  }, [fetchUserCurrency, fetchProducts, fetchStores, fetchTags]);

  const convertPrice = (usdPrice: number | null, originalPrice?: number) => {
    const priceToUse = usdPrice || originalPrice || 0;
    if (userCurrency === 'USD') return priceToUse;
    const rate = exchangeRates[userCurrency];
    if (!rate) {
      console.log('No exchange rate available for:', userCurrency, 'using fallback');
      // Use fallback rates if no rate is available
      const fallbackRates: { [key: string]: number } = {
        'EUR': 0.85,
        'GBP': 0.73,
        'PKR': 280.0,
        'CAD': 1.35,
        'AUD': 1.50,
        'JPY': 150.0,
        'INR': 83.0,
      };
      const fallbackRate = fallbackRates[userCurrency] || 1;
      console.log('Using fallback rate:', fallbackRate, 'for currency:', userCurrency);
      return Math.round(priceToUse * fallbackRate * 100) / 100;
    }
    console.log('Using real exchange rate:', rate, 'for currency:', userCurrency);
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
        hasFetchedProducts.current = false;
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
    return <Loading message="Loading products..." />;
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

      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Currency Conversion Info</h3>
        <p className="text-sm text-blue-800">
          Prices are shown in your preferred currency ({userCurrency}) for display only. 
          When you import a product, the price will be locked in your currency at that moment.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name, SKU, or brand..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Supplier
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="all">All Suppliers</option>
                {Array.from(new Set(products.map(p => p.supplier.name))).map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Only Available Products</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {(() => {
        const filteredProducts = products.filter(product => {
          const productTags = product.tags || [];
          const tagNames = productTags.map(t => t.tag?.name || '').filter(Boolean);
          
          const matchesSearch = searchTerm === '' || 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.brandName && product.brandName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.category?.name && product.category.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            tagNames.some(tagName => tagName.toLowerCase().includes(searchTerm.toLowerCase()));
          
          const matchesCategory = categoryFilter === 'all' || 
            product.category?.name === categoryFilter;
          
          const matchesTag = tagFilter === 'all' || 
            (productTags && productTags.some(t => (t.tag?.id || '') === tagFilter));
          
          const matchesSupplier = supplierFilter === 'all' || 
            product.supplier.name === supplierFilter;
          
          const matchesAvailable = !showOnlyAvailable || !product.isImported;
          
          return matchesSearch && matchesCategory && matchesTag && matchesSupplier && matchesAvailable;
        });
        
        return filteredProducts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                {showOnlyAvailable 
                  ? 'No available products for import' 
                  : 'No products found'
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
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (USD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price ({userCurrency})
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
                  {filteredProducts.map((product) => {
                    const convertedPrice = convertPrice(product.lockedUSDPrice, product.price);
                    const isNew = new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    const hasLockedUSDPrice = product.lockedUSDPrice !== null;
                    
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 mr-3">
                              {product.images && product.images.length > 0 ? (
                                <ProductImageSlider 
                                  images={product.images} 
                                  productName={product.name || 'Product'}
                                  className="w-12 h-12 object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-md">
                                  <span className="text-gray-400 text-xs">No Image</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">{product.description}</div>
                              <div className="flex gap-2 mt-1">
                                {isNew && (
                                  <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                    🆕 New
                                  </span>
                                )}
                                {product.featured && (
                                  <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                    ⭐ Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                          {product.subcategory && (
                            <div className="text-xs text-gray-500 mt-1">{product.subcategory.name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.supplier.name}</div>
                          <div className="text-xs text-gray-500">{product.supplier.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {hasLockedUSDPrice 
                              ? formatPrice(product.lockedUSDPrice!, 'USD')
                              : formatPrice(product.price, 'USD')
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-indigo-600">
                            {formatPrice(convertedPrice, userCurrency)}
                          </div>
                          {hasLockedUSDPrice && (
                            <div className="text-xs text-gray-500">
                              {exchangeRates[userCurrency] 
                                ? `Rate: ${exchangeRates[userCurrency].toFixed(4)}`
                                : 'Rate: N/A'
                              }
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.isImported 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.isImported ? 'Imported' : 'Available'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/vendor/products/${product.id}`)}
                            className="px-3 py-1 text-xs rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}

    </div>
  );
}
