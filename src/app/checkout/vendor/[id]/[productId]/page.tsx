'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  variants?: Array<{
    id: string;
    name: string;
    value: string;
    priceModifier: number;
  }>;
  store: {
    name: string;
    slug: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  supplier: {
    name: string;
  };
}

export default function VendorCheckoutPage() {
  const params = useParams();
  const storeId = params.id as string;
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [selectedVariants, setSelectedVariants] = useState<{[key: string]: string}>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (storeId && productId) {
      fetchProduct();
    }
  }, [storeId, productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/checkout/vendor/${storeId}/${productId}`);
      const data = await response.json();
      
      if (response.ok) {
        setProduct(data.product);
      } else {
        console.error('Error fetching product:', data.error);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    let total = product.price;
    
    // Add variant price modifiers
    if (product.variants) {
      product.variants.forEach(variant => {
        if (selectedVariants[variant.name] === variant.value) {
          total += variant.priceModifier;
        }
      });
    }
    
    return total;
  };

  const handleVariantChange = (variantName: string, variantValue: string) => {
    setSelectedVariants(prev => {
      // If the same variant is clicked, unselect it
      if (prev[variantName] === variantValue) {
        const newVariants = { ...prev };
        delete newVariants[variantName];
        return newVariants;
      }
      // Otherwise, select the new variant
      return {
        ...prev,
        [variantName]: variantValue
      };
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const response = await fetch(`/api/checkout/vendor/${storeId}/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          quantity: 1,
          selectedVariants: selectedVariants,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`🎉 Order created successfully!\n\nOrder ID: ${data.order.id}\nInvoice: ${data.invoice.invoiceNumber}\nTotal: $${data.order.totalAmount}\n\n📧 Emails have been sent to:\n- Customer: Invoice confirmation\n- Supplier: Order notification\n- Vendor: Sale confirmation`);
        
        // Reset form
        setCustomerInfo({
          name: '',
          email: '',
          phone: '',
          address: '',
        });
      } else {
        alert(data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Info */}
          <Card>
            <div className="flex items-center mb-4">
              {product.store.logo && (
                <img
                  src={product.store.logo}
                  alt={product.store.name}
                  className="w-12 h-12 object-cover rounded-md mr-3"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{product.store.name}</h1>
                <p className="text-sm text-gray-600">Official Store</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 mb-6">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-md"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{product.name}</h2>
                <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                <p className="text-sm text-gray-500">Category: {product.category}</p>
                <p className="text-sm text-gray-500">Supplier: {product.supplier.name}</p>
              </div>
            </div>

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 ? (
              <div className="border-t pt-4 mb-4">
                <h3 className="text-lg font-semibold mb-3">Select Options</h3>
                <div className="space-y-4">
                  {Object.entries(
                    product.variants.reduce((acc: {[key: string]: any[]}, variant) => {
                      if (!acc[variant.name]) acc[variant.name] = [];
                      acc[variant.name].push(variant);
                      return acc;
                    }, {})
                  ).map(([variantName, variants]) => (
                    <div key={variantName}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {variantName}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {variants.map((variant: any) => (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => handleVariantChange(variantName, variant.value)}
                            className={`p-2 text-sm border rounded-md text-center transition-colors ${
                              selectedVariants[variantName] === variant.value
                                ? 'border-indigo-500 bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200'
                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium">{variant.value}</div>
                            {variant.priceModifier > 0 && (
                              <div className="text-xs text-green-600">+${variant.priceModifier}</div>
                            )}
                            {variant.priceModifier < 0 && (
                              <div className="text-xs text-red-600">-${Math.abs(variant.priceModifier)}</div>
                            )}
                            {variant.priceModifier === 0 && (
                              <div className="text-xs text-gray-500">No change</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-t pt-4 mb-4">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-600">
                    ℹ️ This product has no variant options available
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Base Price</span>
                  <span className="text-sm">${product.price.toFixed(2)}</span>
                </div>
                {product.variants && product.variants.length > 0 && (
                  <>
                    {Object.entries(selectedVariants).map(([variantName, variantValue]) => {
                      const variant = product.variants?.find(v => v.name === variantName && v.value === variantValue);
                      if (variant && variant.priceModifier !== 0) {
                        return (
                          <div key={`${variantName}-${variantValue}`} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{variantName}: {variantValue}</span>
                            <span className="text-sm text-green-600">
                              {variant.priceModifier > 0 ? '+' : ''}${variant.priceModifier.toFixed(2)}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </>
                )}
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-indigo-600">${calculateTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Checkout Form */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : `Pay $${calculateTotalPrice().toFixed(2)}`}
              </button>
            </form>

            {/* <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
             
              </p>
            </div> */}
          </Card>
        </div>
      </div>
    </div>
  );
}
