'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TemplateRenderer from '@/components/store-templates/TemplateRenderer';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  template?: string | { // Legacy: template name/id (string) OR New: template object from DB
    id: string;
    name: string;
    baseHtml?: string;
    baseConfig: any;
  };
  templateId?: string; // New: template ID (FK)
  overrides?: any; // Vendor customizations (logo, banner, primaryColor)
  templateConfig?: any; // Legacy: full template config (for backward compatibility)
  logo?: string;
  banner?: string;
  address?: string;
  phone?: string;
  email?: string;
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
  images?: Array<{
    id: string;
    url: string;
    alt: string;
    isMain: boolean;
    order: number;
  }>;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    name: string;
    slug: string;
  };
  tags?: Array<{
    name: string;
    slug: string;
  }>;
  isActive: boolean;
  featured: boolean;
  totalQuantity: number;
  availableQuantity: number;
  minQuantity: number;
  suggestedAmount?: number;
  brandName?: string;
  sku?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaTags?: string;
  shippingInfo?: any;
  variants?: any;
  supplier: {
    id: string;
    name: string;
    email: string;
  };
  business?: {
    id: string;
    businessName: string;
  };
  storeId?: string;
  hostedLink?: string;
  currency: string;
  lockedUSDPrice: number;
  exchangeRateAtCreation: number;
  createdAt: string;
  updatedAt: string;
  // Fields added by StoreProduct mapping
  storeProductId?: string;
  markup?: number;
  markupType?: string;
  finalPrice?: number;
}

export default function StorePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    image: string;
    slug: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        
        // Fetch store data
        const storeResponse = await fetch(`/api/stores/public/${slug}`);
        if (!storeResponse.ok) {
          throw new Error('Store not found');
        }
        const storeData = await storeResponse.json();
        console.log('Store data received:', {
          template: storeData.store.template,
          templateConfig: storeData.store.templateConfig,
          name: storeData.store.name
        });
        setStore(storeData.store);

        // Fetch products for this store (with featured, best-selling, categories)
        const productsResponse = await fetch(`/api/stores/public/${slug}/products`);
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.products || []);
          setFeaturedProducts(productsData.featuredProducts || []);
          setBestSellingProducts(productsData.bestSellingProducts || []);
          setCategories(productsData.categories || []);
        }

      } catch (error) {
        console.error('Error fetching store data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load store');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchStoreData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || 'The store you are looking for does not exist or has been removed.'}
          </p>
          <a
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Format product for template
  const formatProduct = (product: Product) => {
    // Get main image from images array or fallback to image field
    const mainImage = product.images && product.images.length > 0
      ? product.images.find(img => img.isMain)?.url || product.images[0].url
      : product.image || 'https://picsum.photos/300/200?random=' + product.id;

    // Use finalPrice if available (from storeProduct), otherwise use lockedUSDPrice or price
    const displayPrice = product.finalPrice || product.lockedUSDPrice || product.price;

    return {
      id: product.id,
      name: product.name,
      price: displayPrice,
      image: mainImage,
      slug: product.id // Use ID as slug for now
    };
  };

  // Prepare store data for template renderer
  const storeData = {
    ...store,
    products: products.map(formatProduct),
    featuredProducts: featuredProducts.map(formatProduct),
    bestSellingProducts: bestSellingProducts.map(formatProduct),
    categories: categories
  };

  return <TemplateRenderer store={storeData} pageType="landing" />;
}