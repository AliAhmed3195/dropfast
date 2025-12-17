'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import TemplateRenderer from '@/components/store-templates/TemplateRenderer';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  template?: {
    id: string;
    name: string;
    slug: string;
    theme: any;
    pages: any;
  };
  templateId?: string;
  overrides?: any;
  logo?: string;
  banner?: string;
}

export default function StoreCartPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { items: allCartItems } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch store data
        const storeResponse = await fetch(`/api/stores/public/${storeSlug}`);
        if (!storeResponse.ok) {
          throw new Error('Store not found');
        }
        const storeData = await storeResponse.json();
        setStore(storeData.store);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (storeSlug) {
      fetchData();
    }
  }, [storeSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error || 'Store not found'}</p>
          <button
            onClick={() => router.push(`/store/${storeSlug}`)}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  // Filter cart items for this store only
  const storeCartItems = allCartItems.filter(item => item.store?.slug === storeSlug);

  // Prepare store data for template renderer with cart
  const storeData = {
    ...store,
    cart: {
      items: storeCartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    },
  };

  return <TemplateRenderer store={storeData} pageType="cart" />;
}

