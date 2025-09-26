'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  lockedUSDPrice?: number;
  exchangeRateAtCreation?: number;
  image: string;
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
  sku?: string;
  brandName?: string;
  minQuantity?: number;
  suggestedAmount?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaTags?: string;
  totalQuantity: number;
  availableQuantity: number;
  shippingInfo?: any;
  featured?: boolean;
  supplier: {
    id: string;
    name: string;
    email: string;
  };
  markup: number;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain: boolean;
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
}

interface CurrencyRate {
  [key: string]: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState(20);
  const [productMargin, setProductMargin] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<CurrencyRate>({});
  const [converting, setConverting] = useState(false);
  const [destination, setDestination] = useState<'myProducts' | 'store'>('myProducts');
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [productResponse, storesResponse, userResponse] = await Promise.all([
        fetch(`/api/products/available`),
        fetch('/api/stores'),
        fetch('/api/auth/me'),
      ]);

      const productData = await productResponse.json();
      const storesData = await storesResponse.json();
      const userData = await userResponse.json();

      // Set user currency
      setUserCurrency(userData.preferredCurrency || 'USD');

      const foundProduct = productData.products?.find((p: Product) => p.id === productId);
      if (foundProduct) {
        setProduct(foundProduct);
        setProductMargin(foundProduct.markup || '');
      }
      
      setStores(storesData.stores || []);
      if (storesData.stores?.length > 0) {
        setSelectedStore(storesData.stores[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalPrice = (basePrice: number, margin?: number) => {
    const marginToUse = margin !== undefined ? margin : markupPercentage;
    return basePrice + (basePrice * marginToUse / 100);
  };

  const handleMarginChange = (margin: number) => {
    setProductMargin(margin);
  };

  const fetchExchangeRates = async () => {
    if (userCurrency === 'USD') return;
    
    try {
      setConverting(true);
      const response = await fetch(`/api/currency/convert?from=USD&to=${userCurrency}&amount=1`);
      if (response.ok) {
        const data = await response.json();
        setExchangeRates({ [userCurrency]: data.rate });
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setConverting(false);
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
      USD: '$',
      EUR: '€',
      GBP: '£',
      PKR: '₨',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
      INR: '₹',
    };
    return symbols[currency] || currency;
  };

  const formatPrice = (price: number, currency: string) => {
    return `${getCurrencySymbol(currency)}${price.toFixed(2)}`;
  };

  useEffect(() => {
    if (userCurrency && userCurrency !== 'USD') {
      fetchExchangeRates();
    }
  }, [userCurrency]);

  const handleAddProduct = async () => {
    if (destination === 'store' && !selectedStore) {
      alert('Please select a store first');
      return;
    }

    setActionLoading(true);
    setSuccess(null);

    try {
      if (destination === 'myProducts') {
        // Add to My Products only
        const response = await fetch('/api/vendor/products/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            markup: productMargin !== '' ? productMargin : markupPercentage,
          }),
        });

        if (response.ok) {
          setSuccess('Product added to your products list successfully!');
          setTimeout(() => {
            router.back();
          }, 2000);
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      } else {
        // Add to Store (which automatically adds to My Products)
        const response = await fetch('/api/products/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            storeId: selectedStore,
            markup: productMargin !== '' ? productMargin : markupPercentage,
            generateHostedLink: true,
          }),
        });

        if (response.ok) {
          setSuccess('Product added to your store and products list successfully!');
          setTimeout(() => {
            router.back();
          }, 2000);
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    } finally {
      setActionLoading(false);
    }
  };

  const generateHostedLink = async () => {
    if (!selectedStore) {
      alert('Please select a store first');
      return;
    }

    try {
      const response = await fetch('/api/products/generate-hosted-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          storeId: selectedStore,
          markup: productMargin !== '' ? productMargin : markupPercentage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Hosted link generated successfully!\n\nLink: ${data.hostedLink}\n\nCopy this link and send it to your customers for direct checkout.`);
        
        if (navigator.clipboard) {
          navigator.clipboard.writeText(data.hostedLink);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate hosted link');
      }
    } catch (error) {
      console.error('Error generating hosted link:', error);
      alert('Failed to generate hosted link');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Mock multiple images for demonstration
  const productImages = [
    product.image,
    product.image, // In real implementation, this would be from product.images array
    product.image,
  ].filter(Boolean);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📋' },
    { id: 'details', name: 'Details', icon: '🔍' },
    { id: 'shipping', name: 'Shipping', icon: '🚚' },
    { id: 'seo', name: 'SEO', icon: '🔍' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500">Product Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <option value="">Select Store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              {/* Main Image */}
              <div className="aspect-square mb-4">
                {productImages[currentImageIndex] ? (
                  <img
                    src={productImages[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No Image Available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        currentImageIndex === index ? 'border-indigo-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Destination Toggle */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose Destination
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="destination"
                        value="myProducts"
                        checked={destination === 'myProducts'}
                        onChange={(e) => setDestination(e.target.value as 'myProducts' | 'store')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">My Products Only</span>
                        <p className="text-xs text-gray-500">Will be added to your products list only</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="destination"
                        value="store"
                        checked={destination === 'store'}
                        onChange={(e) => setDestination(e.target.value as 'myProducts' | 'store')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Store + My Products</span>
                        <p className="text-xs text-gray-500">Will be added to your store and products list</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleAddProduct}
                  disabled={actionLoading || (destination === 'store' && !selectedStore)}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                    destination === 'myProducts'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </div>
                  ) : (
                    destination === 'myProducts' ? 'Add to My Products' : 'Add to Store'
                  )}
                </button>

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Actions for Store */}
                {destination === 'store' && (
                  <button
                    onClick={generateHostedLink}
                    disabled={!selectedStore || actionLoading}
                    className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Generate Hosted Link
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Product Information */}
          <div className="lg:col-span-2">
            <Card>
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-lg mb-4">{product.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                          <p className="text-lg font-semibold text-gray-900">{product.supplier.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <p className="text-lg font-semibold text-gray-900">{product.category?.name || 'N/A'}</p>
                        </div>
                      </div>

                      {(product.tags && product.tags.length > 0) && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                            <div className="flex flex-wrap gap-2">
                              {product.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 rounded-full text-sm"
                                  style={{
                                    backgroundColor: tag.tag.color ? `${tag.tag.color}20` : '#f3f4f6',
                                    color: tag.tag.color || '#374151',
                                  }}
                                >
                                  {tag.tag.name}
                                </span>
                              ))}
                              {product.tags.length > 3 && (
                                <span className="text-sm text-gray-500">
                                  +{product.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                          {product.subcategory && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                              <p className="text-lg font-semibold text-gray-900">{product.subcategory.name}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pricing Section */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Pricing Configuration</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Markup Percentage (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                            value={productMargin}
                            onChange={(e) => handleMarginChange(Number(e.target.value))}
                            placeholder={`${markupPercentage}%`}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Leave empty to use global markup: {markupPercentage}%
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {product.lockedUSDPrice ? 'Original Price (USD)' : 'Price (USD)'}
                            </label>
                            <p className="text-2xl font-bold text-gray-900">
                              {product.lockedUSDPrice 
                                ? formatPrice(product.lockedUSDPrice, 'USD')
                                : formatPrice(product.price, 'USD')
                              }
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Currency</label>
                            <p className="text-2xl font-bold text-indigo-600">
                              {formatPrice(convertPrice(product.lockedUSDPrice, product.price), userCurrency)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.lockedUSDPrice 
                                ? `Rate: ${exchangeRates[userCurrency]?.toFixed(4) || 'Loading...'}`
                                : 'Using original price'
                              }
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Selling Price</label>
                            <p className="text-2xl font-bold text-green-600">
                              {formatPrice(
                                convertPrice(product.lockedUSDPrice, product.price) * 
                                (1 + (productMargin as number || markupPercentage) / 100), 
                                userCurrency
                              )}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Profit</label>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatPrice(
                                convertPrice(product.lockedUSDPrice, product.price) * 
                                (1 + (productMargin as number || markupPercentage) / 100) - 
                                convertPrice(product.lockedUSDPrice, product.price), 
                                userCurrency
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Product Identification */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Identification</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {product.sku && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                            <p className="text-lg font-semibold text-gray-900">{product.sku}</p>
                          </div>
                        )}
                        {product.brandName && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                            <p className="text-lg font-semibold text-gray-900">{product.brandName}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inventory Information */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Inventory Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                          <p className="text-2xl font-bold text-blue-600">{product.totalQuantity}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                          <p className="text-2xl font-bold text-green-600">{product.availableQuantity}</p>
                        </div>
                      </div>
                      {product.minQuantity && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Quantity</label>
                          <p className="text-lg font-semibold text-gray-900">{product.minQuantity} units</p>
                        </div>
                      )}
                    </div>

                    {/* Pricing Information */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
                          <p className="text-3xl font-bold text-indigo-600">${product.price}</p>
                        </div>
                        {product.suggestedAmount && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Selling Price</label>
                            <p className="text-2xl font-bold text-green-600">${product.suggestedAmount}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'shipping' && product.shippingInfo && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h4>
                    
                    {/* Ship From */}
                    {product.shippingInfo.shipFrom && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ship From</label>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-lg font-semibold text-gray-900">
                            {product.shippingInfo.shipFrom.country}
                            {product.shippingInfo.shipFrom.city && `, ${product.shippingInfo.shipFrom.city}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Shipping Methods */}
                    {product.shippingInfo.shippingMethods && product.shippingInfo.shippingMethods.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Available Shipping Methods</label>
                        <div className="space-y-3">
                          {product.shippingInfo.shippingMethods.map((method: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-gray-900">{method.name}</p>
                                  <p className="text-sm text-gray-600">{method.deliveryTime}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-indigo-600">${method.cost}</p>
                                  <p className="text-xs text-gray-500 capitalize">{method.costType.replace(/([A-Z])/g, ' $1').trim()}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Shipping Details */}
                    <div className="grid grid-cols-2 gap-4">
                      {product.shippingInfo.handlingTime && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Handling Time</label>
                          <p className="text-sm font-semibold text-gray-900">{product.shippingInfo.handlingTime}</p>
                        </div>
                      )}
                      {product.shippingInfo.trackingAvailable !== undefined && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tracking</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.shippingInfo.trackingAvailable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.shippingInfo.trackingAvailable ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Free Shipping and Max Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                      {product.shippingInfo.freeShippingAbove && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Above</label>
                          <p className="text-sm font-semibold text-gray-900">${product.shippingInfo.freeShippingAbove}</p>
                        </div>
                      )}
                      {product.shippingInfo.maxOrderQuantity && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Order Quantity</label>
                          <p className="text-sm font-semibold text-gray-900">{product.shippingInfo.maxOrderQuantity} units</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'seo' && (product.metaTitle || product.metaDescription || product.metaTags) && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">SEO Information</h4>
                    <div className="space-y-4">
                      {product.metaTitle && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{product.metaTitle}</p>
                        </div>
                      )}
                      {product.metaDescription && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{product.metaDescription}</p>
                        </div>
                      )}
                      {product.metaTags && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Tags</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{product.metaTags}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
