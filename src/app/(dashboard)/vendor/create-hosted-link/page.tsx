'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface Store {
  id: string;
  name: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  supplier: {
    name: string;
  };
}

export default function CreateHostedLinkPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [markup, setMarkup] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [showLink, setShowLink] = useState(false);

  useEffect(() => {
    fetchStores();
    fetchAvailableProducts();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setStores(data.stores || []);
      if (data.stores?.length > 0) {
        setSelectedStore(data.stores[0].id);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const response = await fetch('/api/products/available');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const calculateFinalPrice = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return 0;
    return product.price * (1 + markup / 100);
  };

  const handleGenerateLink = async () => {
    if (!selectedStore || !selectedProduct) {
      alert('Please select both store and product');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/products/generate-hosted-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct,
          storeId: selectedStore,
          markup: markup
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedLink(data.hostedLink);
        setShowLink(true);
        alert('Hosted link generated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate hosted link');
      }
    } catch (error) {
      console.error('Error generating hosted link:', error);
      alert('Failed to generate hosted link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Link copied to clipboard!');
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);
  const selectedStoreData = stores.find(s => s.id === selectedStore);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Hosted Link</h1>
        <p className="text-gray-600">Generate a direct purchase link to send to your customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div>
          <Card>
            <h2 className="text-lg font-semibold mb-4">Link Configuration</h2>
            
            <div className="space-y-4">
              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Store *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                >
                  <option value="">Choose a store...</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Product *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">Choose a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price} (by {product.supplier.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Markup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Markup (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={markup}
                  onChange={(e) => setMarkup(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is your profit margin on top of the supplier's price
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateLink}
                disabled={loading || !selectedStore || !selectedProduct}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Hosted Link'}
              </button>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div>
          <Card>
            <h2 className="text-lg font-semibold mb-4">Link Preview</h2>
            
            {selectedProductData && selectedStoreData ? (
              <div className="space-y-4">
                {/* Product Info */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {selectedProductData.image && (
                      <img
                        src={selectedProductData.image}
                        alt={selectedProductData.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedProductData.name}</h3>
                      <p className="text-sm text-gray-600">{selectedProductData.description}</p>
                      <p className="text-sm text-gray-500">Supplier: {selectedProductData.supplier.name}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Pricing Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Supplier Price:</span>
                      <span>${selectedProductData.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Markup ({markup}%):</span>
                      <span>${(selectedProductData.price * markup / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Customer Price:</span>
                      <span>${calculateFinalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Store Info */}
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Store:</span> {selectedStoreData.name}</p>
                  <p><span className="font-medium">Your Profit:</span> ${(selectedProductData.price * markup / 100).toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Select a store and product to see preview
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Generated Link */}
      {showLink && generatedLink && (
        <div className="mt-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Generated Hosted Link</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Your hosted link:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to use this link:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Send this link directly to your customers</li>
                  <li>• Customers can purchase without creating accounts</li>
                  <li>• You'll receive your markup amount as profit</li>
                  <li>• Supplier receives the base product price</li>
                  <li>• Customer receives branded invoice with your logo</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">How Hosted Links Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h4 className="font-medium">1. Generate Link</h4>
                <p className="text-gray-600">Select product and set your markup to create a unique purchase link</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="font-medium">2. Send to Customer</h4>
                <p className="text-gray-600">Share the link via email, WhatsApp, or any messaging platform</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-medium">3. Customer Purchases</h4>
                <p className="text-gray-600">Customer completes purchase and receives branded invoice</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
