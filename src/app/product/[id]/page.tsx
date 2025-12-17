'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { useCart } from '@/contexts/CartContext';
import IPBasedCurrencyDisplay from '@/components/IPBasedCurrencyDisplay';
import ProductImageSlider from '@/components/ProductImageSlider';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain: boolean;
    order: number;
  }>;
  category?: {
    name: string;
    slug: string;
  };
  subcategory?: {
    name: string;
    slug: string;
  };
  type?: string;
  subCategory?: string;
  sku?: string;
  brandName?: string;
  minQuantity?: number;
  suggestedAmount?: number;
  totalQuantity: number;
  availableQuantity: number;
  shippingInfo?: any;
  variants?: Array<{
    id: string;
    name: string;
    value: string;
    priceModifier: number;
  }>;
  featured?: boolean;
  bestSelling?: boolean;
  newArrival?: boolean;
  createdAt: string;
  supplier: {
    name: string;
    email: string;
  };
  store?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    currency: string;
  };
  hostedLink: string;
  storeProductId: string;
  lockedUSDPrice: number;
  lockedLocalPrice: number;
  localCurrency: string;
  markup: number;
  finalPrice: number;
  displayPrice: number;
  displayCurrency: string;
  exchangeRate: number;
  isActive: boolean;
  updatedAt: string;
  tags?: Array<{
    tag: {
      name: string;
      color?: string;
    };
  }>;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ShippingInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { addToCart, items, getTotalPrice, getTotalItems } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerCurrency, setCustomerCurrency] = useState('USD');
  const [currencyInfo, setCurrencyInfo] = useState<any>(null);
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState('USD');
  const [showBottomSlider, setShowBottomSlider] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('State changed:', {
      customerCurrency,
      convertedPrice,
      detectedCurrency,
      converting
    });
  }, [customerCurrency, convertedPrice, detectedCurrency, converting]);

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'PKR': '₨',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'INR': '₹',
      'AED': 'د.إ',
      'SAR': '﷼',
      'MYR': 'RM',
    };
    return symbols[currency] || currency;
  };
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [billingInfo, setBillingInfo] = useState<ShippingInfo>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      // Detect customer currency using the same API as store listing
      console.log('Detecting currency...');
      const currencyResponse = await fetch(`/api/currency/detect?t=${Date.now()}`);
      console.log('Currency detection response status:', currencyResponse.status);
      
      let currencyData = null;
      let detected = 'USD';
      
      if (currencyResponse.ok) {
        currencyData = await currencyResponse.json();
        console.log('Currency detection data:', currencyData);
        detected = currencyData.currency || 'USD';
        console.log('Detected currency:', detected);
        setDetectedCurrency(detected);
        setCustomerCurrency(detected);
        setCurrencyInfo({ currency: detected });
      } else {
        console.log('Currency detection failed, using USD');
        setDetectedCurrency('USD');
        setCustomerCurrency('USD');
        setCurrencyInfo({ currency: 'USD' });
      }
      
      // Fetch product data
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      setProduct(data.product);
      
      // Debug product data
      console.log('Product loaded:', {
        id: data.product.id,
        name: data.product.name,
        availableQuantity: data.product.availableQuantity,
        totalQuantity: data.product.totalQuantity,
        price: data.product.price,
        finalPrice: data.product.finalPrice
      });
      
      // Convert price to customer currency
      if (data.product) {
        console.log('About to convert price for currency:', detected);
        console.log('Product data:', data.product);
        console.log('Calling convertProductPrice...');
        await convertProductPrice(data.product, { currency: detected });
        console.log('convertProductPrice completed');
      } else {
        console.log('No product data to convert');
      }
      
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const convertProductPrice = async (product: Product, currencyInfo: any) => {
    console.log('=== convertProductPrice called ===');
    console.log('Product:', product);
    console.log('Currency Info:', currencyInfo);
    
    setConverting(true);
    
    try {
      console.log('Converting price:', {
        productPrice: product.finalPrice,
        targetCurrency: currencyInfo.currency,
        productId: product.id
      });
      
      if (currencyInfo.currency === 'USD') {
        setConvertedPrice(product.finalPrice);
        console.log('No conversion needed - already USD');
      } else {
        const url = `/api/currency/convert?from=USD&to=${currencyInfo.currency}&amount=${product.finalPrice}`;
        console.log('Making request to:', url);
        
        const response = await fetch(url);
        console.log('Currency conversion response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Currency conversion result:', data);
          console.log('Setting converted price to:', data.convertedAmount);
          setConvertedPrice(data.convertedAmount);
        } else {
          const errorText = await response.text();
          console.error('Currency conversion failed:', response.status, errorText);
          setConvertedPrice(null);
        }
      }
    } catch (error) {
      console.error('Error converting price:', error);
      setConvertedPrice(product.finalPrice);
    } finally {
      setConverting(false);
      console.log('=== convertProductPrice finished ===');
    }
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    let basePrice = convertedPrice || product.finalPrice;
    
    // Add variant price modifiers
    Object.values(selectedVariants).forEach(variantValue => {
      const variant = product.variants?.find(v => v.value === variantValue);
      if (variant) {
        basePrice += variant.priceModifier;
      }
    });
    
    return basePrice * quantity;
  };

  const handleVariantChange = (variantName: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: value
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      productId: product.id,
      name: product.name,
      price: calculateTotalPrice() / quantity, // Price per unit
      image: product.image,
      quantity,
      selectedVariants,
      totalPrice: calculateTotalPrice(),
      store: product.store
    });
    
    setIsAddedToCart(true);
    setShowBottomSlider(true);
  };

  const handleViewCart = () => {
    setShowBottomSlider(false);
    // Navigate to cart page or show cart modal
    window.location.href = '/cart';
  };

  const handleCheckout = () => {
    setShowBottomSlider(false);
    setShowCheckout(true);
  };

  const handleBuyNow = () => {
    // Add to cart first if not already added
    if (!isAddedToCart) {
      handleAddToCart();
    }
    setShowBottomSlider(true);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const orderData = {
        productId: product.id,
        storeId: product.store.id,
        quantity,
        selectedVariants,
        customerInfo,
        shippingInfo,
        paymentInfo,
        totalAmount: calculateTotalPrice()
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Order placed successfully! Order ID: ' + result.orderId);
        // Redirect to order confirmation or home page
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert('Error placing order: ' + error.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">{product.store.name}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href={`/store/${product.store.slug}`} className="text-indigo-600 hover:text-indigo-800">
                Back to Store
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1">
              <ProductImageSlider
                images={product.images || []}
                fallbackImage={product.image}
                productName={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                {currencyInfo && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
                    {currencyInfo.currency}
                  </span>
                )}
                {product.featured && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    ⭐ Featured
                  </span>
                )}
                {product.bestSelling && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    🔥 Best Selling
                  </span>
                )}
                {product.newArrival && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    🆕 New
                  </span>
                )}
              </div>
              
              <p className="text-lg text-gray-600">{product.description}</p>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-indigo-600">
                    {getCurrencySymbol(customerCurrency)}
                    {convertedPrice ? convertedPrice.toFixed(2) : product.finalPrice.toFixed(2)}
                    {converting && <span className="text-sm text-gray-500 ml-2">(Converting...)</span>}
                  </span>
                  {convertedPrice && customerCurrency !== product.localCurrency && (
                    <span className="text-sm text-gray-500">
                      Store: {getCurrencySymbol(product.localCurrency)}{product.finalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                
                {/* Currency Selector */}
                <div className="flex flex-col items-end">
                  <label className="text-sm text-gray-600 mb-1">Currency</label>
                  <select
                    value={customerCurrency}
                    onChange={async (e) => {
                      const newCurrency = e.target.value;
                      setCustomerCurrency(newCurrency);
                      setConverting(true);
                      
                      try {
                        if (newCurrency === 'USD') {
                          setConvertedPrice(product.finalPrice);
                        } else {
                          const response = await fetch(`/api/currency/convert?from=USD&to=${newCurrency}&amount=${product.finalPrice}`);
                          if (response.ok) {
                            const data = await response.json();
                            setConvertedPrice(data.convertedAmount);
                          } else {
                            setConvertedPrice(null);
                          }
                        }
                      } catch (error) {
                        console.error('Error converting price:', error);
                        setConvertedPrice(product.finalPrice);
                      } finally {
                        setConverting(false);
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="PKR">PKR (₨)</option>
                    <option value="MYR">MYR (RM)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="BRL">BRL (R$)</option>
                    <option value="MXN">MXN ($)</option>
                    <option value="RUB">RUB (₽)</option>
                    <option value="KRW">KRW (₩)</option>
                    <option value="THB">THB (฿)</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-2">
                <span className="text-sm text-gray-500">Available: {product.availableQuantity}</span>
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-2 text-gray-600">{product.category?.name || 'No Category'}</span>
                </div>
                {product.type && (
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-600">{product.type}</span>
                  </div>
                )}
                {product.brandName && (
                  <div>
                    <span className="font-medium text-gray-700">Brand:</span>
                    <span className="ml-2 text-gray-600">{product.brandName}</span>
                  </div>
                )}
                {product.sku && (
                  <div>
                    <span className="font-medium text-gray-700">SKU:</span>
                    <span className="ml-2 text-gray-600">{product.sku}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Options</h3>
                {product.variants.map((variant) => (
                  <div key={variant.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {variant.name}
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={selectedVariants[variant.name] || ''}
                      onChange={(e) => handleVariantChange(variant.name, e.target.value)}
                    >
                      <option value="">Select {variant.name}</option>
                      <option value={variant.value}>
                        {variant.value}
                        {variant.priceModifier > 0 && ` (+$${variant.priceModifier})`}
                      </option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const newQuantity = Math.max(1, quantity - 1);
                    console.log('Decreasing quantity:', { current: quantity, new: newQuantity, available: product.availableQuantity });
                    setQuantity(newQuantity);
                  }}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => {
                    const newQuantity = Math.min(product.availableQuantity || 100, quantity + 1);
                    console.log('Increasing quantity:', { current: quantity, new: newQuantity, available: product.availableQuantity });
                    setQuantity(newQuantity);
                  }}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {getCurrencySymbol(customerCurrency)}{calculateTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={isAddedToCart}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isAddedToCart
                    ? 'bg-green-600 text-white cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isAddedToCart ? '✓ Added to Cart' : `Add to Cart - ${getCurrencySymbol(customerCurrency)}${calculateTotalPrice().toFixed(2)}`}
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Buy Now - {getCurrencySymbol(customerCurrency)}{calculateTotalPrice().toFixed(2)}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Slider */}
        {showBottomSlider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
            <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                {/* Slider Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Cart Details</h2>
                  <button
                    onClick={() => setShowBottomSlider(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Cart Items Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Items in Cart ({getTotalItems()})</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-xs text-gray-500">Store: {item.store.name}</p>
                          {Object.keys(item.selectedVariants).length > 0 && (
                            <div className="mt-1">
                              {Object.entries(item.selectedVariants).map(([name, value]) => (
                                <span key={name} className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-1">
                                  {name}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${item.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart Summary */}
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Items: {getTotalItems()}</span>
                    <span className="text-xl font-bold text-indigo-600">{getCurrencySymbol(customerCurrency)}{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleViewCart}
                    className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                  >
                    View Cart
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Page */}
        {showCheckout && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="min-h-screen">
              {/* Checkout Header */}
              <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-16">
                    <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkout Content */}
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Checkout Form */}
                  <div className="lg:col-span-2">
                    <form id="checkout-form" onSubmit={handlePurchase} className="space-y-6">
                      {/* Customer Information */}
                      <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                              type="text"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={customerInfo.firstName}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                              type="text"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={customerInfo.lastName}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                              type="email"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={customerInfo.email}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                            <input
                              type="tel"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={customerInfo.phone}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                            />
                          </div>
                        </div>
                      </Card>

                      {/* Delivery Information */}
                      <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                            <input
                              type="text"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={shippingInfo.address}
                              onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                              <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={shippingInfo.city}
                                onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                              <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={shippingInfo.state}
                                onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                              <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={shippingInfo.zipCode}
                                onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                              <select
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={shippingInfo.country}
                                onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                              >
                                <option value="">Select Country</option>
                                <option value="US">United States</option>
                                <option value="CA">Canada</option>
                                <option value="UK">United Kingdom</option>
                                <option value="AU">Australia</option>
                                <option value="DE">Germany</option>
                                <option value="FR">France</option>
                                <option value="IN">India</option>
                                <option value="BR">Brazil</option>
                                <option value="JP">Japan</option>
                                <option value="MX">Mexico</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Billing Information */}
                      <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Billing Information</h3>
                        
                        {/* Same as Shipping Checkbox */}
                        <div className="mb-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={sameAsShipping}
                              onChange={(e) => {
                                setSameAsShipping(e.target.checked);
                                if (e.target.checked) {
                                  setBillingInfo(shippingInfo);
                                }
                              }}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">Same as delivery address</span>
                          </label>
                        </div>

                        {!sameAsShipping && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address *</label>
                              <input
                                type="text"
                                required={!sameAsShipping}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={billingInfo.address}
                                onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                <input
                                  type="text"
                                  required={!sameAsShipping}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  value={billingInfo.city}
                                  onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                <input
                                  type="text"
                                  required={!sameAsShipping}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  value={billingInfo.state}
                                  onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                                <input
                                  type="text"
                                  required={!sameAsShipping}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  value={billingInfo.zipCode}
                                  onChange={(e) => setBillingInfo({ ...billingInfo, zipCode: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                                <select
                                  required={!sameAsShipping}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  value={billingInfo.country}
                                  onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                                >
                                  <option value="">Select Country</option>
                                  <option value="US">United States</option>
                                  <option value="CA">Canada</option>
                                  <option value="UK">United Kingdom</option>
                                  <option value="AU">Australia</option>
                                  <option value="DE">Germany</option>
                                  <option value="FR">France</option>
                                  <option value="IN">India</option>
                                  <option value="BR">Brazil</option>
                                  <option value="JP">Japan</option>
                                  <option value="MX">Mexico</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>

                      {/* Payment Information */}
                      <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="1234 5678 9012 3456"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={paymentInfo.cardNumber}
                              onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name *</label>
                            <input
                              type="text"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={paymentInfo.cardName}
                              onChange={(e) => setPaymentInfo({ ...paymentInfo, cardName: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                              <input
                                type="text"
                                required
                                placeholder="MM/YY"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={paymentInfo.expiryDate}
                                onChange={(e) => setPaymentInfo({ ...paymentInfo, expiryDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                              <input
                                type="text"
                                required
                                placeholder="123"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                value={paymentInfo.cvv}
                                onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </form>
                  </div>

                  {/* Order Summary Sidebar */}
                  <div className="lg:col-span-1">
                    <Card className="p-6 sticky top-24">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                      
                      {/* Product Details */}
                      <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600">Qty: {quantity}</p>
                          {Object.keys(selectedVariants).length > 0 && (
                            <div className="mt-1">
                              {Object.entries(selectedVariants).map(([name, value]) => (
                                <span key={name} className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-1">
                                  {name}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{getCurrencySymbol(customerCurrency)}{calculateTotalPrice().toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">{getCurrencySymbol(customerCurrency)}{calculateTotalPrice().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-medium">Free</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">$0.00</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between text-lg font-semibold">
                            <span>Total</span>
                            <span>{getCurrencySymbol(customerCurrency)}{calculateTotalPrice().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pay Now Button */}
                      <button
                        type="submit"
                        form="checkout-form"
                        disabled={processing}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {processing ? 'Processing...' : `Pay Now - ${getCurrencySymbol(customerCurrency)}${calculateTotalPrice().toFixed(2)}`}
                      </button>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}