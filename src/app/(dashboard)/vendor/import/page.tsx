'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

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
  markup: number;
}

interface Store {
  id: string;
  name: string;
  slug: string;
}

export default function VendorImportPage() {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState(20);
  const [productMargins, setProductMargins] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsResponse, storesResponse] = await Promise.all([
        fetch('/api/products/available'),
        fetch('/api/stores'),
      ]);

      const productsData = await productsResponse.json();
      const storesData = await storesResponse.json();

      setAvailableProducts(productsData.products || []);
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

  const importProduct = async (productId: string) => {
    if (!selectedStore) {
      alert('Please select a store first');
      return;
    }

    // Use individual product margin if set, otherwise use global markup
    const productMargin = productMargins[productId] !== undefined ? productMargins[productId] : markupPercentage;

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          storeId: selectedStore,
          markup: productMargin,
          generateHostedLink: true, // Always generate hosted link for vendors
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Product imported successfully! Hosted link: ${data.hostedLink}`);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to import product');
      }
    } catch (error) {
      console.error('Error importing product:', error);
      alert('Failed to import product');
    }
  };

  const calculateFinalPrice = (basePrice: number, productId?: string) => {
    const margin = productId && productMargins[productId] !== undefined ? productMargins[productId] : markupPercentage;
    return basePrice + (basePrice * margin / 100);
  };

  const handleProductMarginChange = (productId: string, margin: number) => {
    setProductMargins(prev => ({
      ...prev,
      [productId]: margin
    }));
  };

  const generateStandaloneHostedLink = async (productId: string) => {
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
          markup: productMargins[productId] !== undefined ? productMargins[productId] : markupPercentage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Hosted link generated successfully!\n\nLink: ${data.hostedLink}\n\nCopy this link and send it to your customers for direct checkout.`);
        
        // Copy to clipboard if possible
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
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Import Products</h1>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Import Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Store
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Global Markup Percentage (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setProductMargins({})}
              className="w-full bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 text-sm"
            >
              Reset All to Global
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <p>• Global markup applies to all products by default</p>
          <p>• Set individual margins for specific products below</p>
          <p>• Individual margins override global markup</p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableProducts.map((product) => (
          <Card key={product.id}>
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{product.description}</p>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm">
                <span className="font-medium">Supplier:</span> {product.supplier.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Category:</span> {product.category}
              </p>
              <p className="text-sm">
                <span className="font-medium">Base Price:</span> ${product.price}
              </p>
              
              {/* Individual Margin Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">
                    Margin % (leave empty for global: {markupPercentage}%)
                  </label>
                  {productMargins[product.id] !== undefined && (
                    <button
                      onClick={() => {
                        const newMargins = { ...productMargins };
                        delete newMargins[product.id];
                        setProductMargins(newMargins);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Reset to Global
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={productMargins[product.id] || ''}
                  onChange={(e) => handleProductMarginChange(product.id, Number(e.target.value))}
                  placeholder={`${markupPercentage}%`}
                />
              </div>

              <p className="text-sm">
                <span className="font-medium">Your Price:</span> ${calculateFinalPrice(product.price, product.id).toFixed(2)}
              </p>
              <p className="text-sm text-green-600">
                <span className="font-medium">Profit:</span> ${(calculateFinalPrice(product.price, product.id) - product.price).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => importProduct(product.id)}
                className="w-full bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700"
              >
                Import to Store
              </button>
              <button
                onClick={() => generateStandaloneHostedLink(product.id)}
                className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
              >
                Generate Hosted Link
              </button>
            </div>
          </Card>
        ))}
      </div>

      {availableProducts.length === 0 && (
        <Card>
          <p className="text-center text-gray-500">No products available for import.</p>
        </Card>
      )}
    </div>
  );
}
