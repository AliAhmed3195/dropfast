'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import ProductImageSlider from '@/components/ProductImageSlider';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  hostedLink: string;
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain: boolean;
    order: number;
  }>;
  supplier: {
    name: string;
  };
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export default function StoreProductsPage() {
  const params = useParams();
  const storeId = params.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const hasFetchedStore = useRef<string>('');

  const fetchStoreAndProducts = useCallback(async () => {
    if (!storeId || hasFetchedStore.current === storeId) return;
    hasFetchedStore.current = storeId;
    
    try {
      const [storeResponse, productsResponse] = await Promise.all([
        fetch(`/api/stores/by-id/${storeId}`),
        fetch(`/api/stores/by-id/${storeId}/products`)
      ]);

      const storeData = await storeResponse.json();
      const productsData = await productsResponse.json();

      setStore(storeData.store);
      setProducts(productsData.products);
    } catch (error) {
      console.error('Error fetching store and products:', error);
      hasFetchedStore.current = ''; // Reset on error
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchStoreAndProducts();
    }
  }, [storeId, fetchStoreAndProducts]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Hosted link copied to clipboard!');
  };

  if (loading) {
    return <Loading message="Loading products..." fullScreen />;
  }

  if (!store) {
    return <div className="min-h-screen flex items-center justify-center">Store not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
          <p className="text-gray-600 mt-2">{store.description}</p>
          <div className="mt-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              store.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {store.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              <div className="p-6">
                <div className="w-full h-48 mb-4">
                  <ProductImageSlider
                    images={product.images || []}
                    fallbackImage={product.image}
                    productName={product.name}
                    className="w-full h-48 object-cover rounded-md"
                  />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3">
                  {product.description}
                </p>
                
                <div className="mb-3">
                  <span className="text-sm text-gray-500">Category: </span>
                  <span className="text-sm font-medium">{product.category}</span>
                </div>
                
                <div className="mb-3">
                  <span className="text-sm text-gray-500">Supplier: </span>
                  <span className="text-sm font-medium">{product.supplier.name}</span>
                </div>
                
                <div className="mb-4">
                  <span className="text-2xl font-bold text-indigo-600">
                    ${product.price}
                  </span>
                </div>

                {product.hostedLink && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hosted Link:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={product.hostedLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(product.hostedLink)}
                        className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Share this link with customers for direct checkout
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found in this store.</p>
            <p className="text-gray-400 text-sm mt-2">
              Import products from suppliers to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
