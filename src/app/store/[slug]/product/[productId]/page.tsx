'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: Array<{
    id: string;
    url: string;
    alt: string;
    isMain: boolean;
    order: number;
  }>;
}

export default function StoreProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.slug as string;
  const productId = params.productId as string;

  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Fetch product data
        const productResponse = await fetch(`/api/stores/public/${storeSlug}/products/${productId}`);
        if (productResponse.ok) {
          const productData = await productResponse.json();
          setProduct(productData.product);
        } else {
          throw new Error('Product not found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (storeSlug && productId) {
      fetchData();
    }
  }, [storeSlug, productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !store || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error || 'Product not found'}</p>
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

  // Format product for template
  const formatProduct = (p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price || 0,
    image: p.images && p.images.length > 0 ? p.images[0].url : p.image || '',
    images: p.images || [],
  });

  // Prepare store data for template renderer with product detail
  const storeData = {
    ...store,
    productDetail: {
      product: formatProduct(product),
    },
  };

  return <TemplateRenderer store={storeData} pageType="productDetail" />;
}

