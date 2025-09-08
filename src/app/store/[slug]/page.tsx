'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  template: string;
  owner: {
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  hostedLink: string;
}

export default function StorePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchStoreData();
    }
  }, [slug]);

  const fetchStoreData = async () => {
    try {
      const response = await fetch(`/api/stores/by-slug/${slug}`);
      const data = await response.json();
      setStore(data.store);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!store) {
    return <div className="min-h-screen flex items-center justify-center">Store not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{store.name}</h1>
            <p className="text-lg text-gray-600 mb-4">{store.description}</p>
            <p className="text-sm text-gray-500">by {store.owner.name}</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Products</h2>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-md mb-4"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                  <p className="text-sm text-gray-500 mb-3">Category: {product.category}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-indigo-600">${product.price}</span>
                  </div>
                  <a
                    href={product.hostedLink}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-center block transition-colors"
                  >
                    Buy Now
                  </a>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-gray-500 py-8">
              No products available in this store yet.
            </p>
          </Card>
        )}
      </div>

      {/* Store Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 {store.name}. Powered by Fastdrop.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
