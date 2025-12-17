'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import ProductImageSlider from '@/components/ProductImageSlider';
import VendorProfitCalculator from '@/components/VendorProfitCalculator';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  type?: string;
  subCategory?: string;
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
  bestSelling?: boolean;
  newArrival?: boolean;
  createdAt: string;
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
  markup: number;
  isImported?: boolean;
  importedMargin?: number;
  finalPrice?: number;
}

interface Store {
  id: string;
  name: string;
  slug: string;
}

export default function VendorImportPage() {
  const router = useRouter();
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [importedProducts, setImportedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    title: '',
    status: '' // New filter for product status
  });
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [markupValue, setMarkupValue] = useState<number>(10);
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage');

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products based on current filters
  useEffect(() => {
    // Combine all products (available + featured + new arrivals)
    const allProducts = [
      ...availableProducts,
      ...featuredProducts,
      ...newArrivalProducts
    ];

    // Remove duplicates based on product ID
    const uniqueProducts = allProducts.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );

    let filtered = uniqueProducts;

    if (filters.type) {
      filtered = filtered.filter(product =>
        product.type?.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(product =>
        product.category?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.title) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(filters.title.toLowerCase())
      );
    }

    if (filters.status) {
      if (filters.status === 'featured') {
        filtered = filtered.filter(product => product.featured);
      } else if (filters.status === 'new-arrival') {
        filtered = filtered.filter(product => isNewArrival(product));
      }
    }

    // Sort products: Featured and New Arrivals at top, then others
    filtered.sort((a, b) => {
      const aIsFeatured = a.featured;
      const bIsFeatured = b.featured;
      const aIsNew = isNewArrival(a);
      const bIsNew = isNewArrival(b);
      
      // Both featured and new arrivals get top priority
      const aIsTop = aIsFeatured || aIsNew;
      const bIsTop = bIsFeatured || bIsNew;
      
      if (aIsTop && !bIsTop) return -1;
      if (!aIsTop && bIsTop) return 1;
      
      // Within top products, featured first, then new arrivals
      if (aIsFeatured && !bIsFeatured) return -1;
      if (!aIsFeatured && bIsFeatured) return 1;
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      
      return 0;
    });

    setFilteredProducts(filtered);
  }, [availableProducts, featuredProducts, newArrivalProducts, filters]);

  // Helper function to check if product is new arrival (last 7 days)
  const isNewArrival = (product: Product) => {
    const productDate = new Date(product.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return productDate >= sevenDaysAgo;
  };

  const fetchData = async () => {
    try {
      const [productsResponse, storesResponse, importedProductsResponse] = await Promise.all([
        fetch('/api/products/available'),
        fetch('/api/stores'),
        fetch('/api/vendor/products/imported'),
      ]);

      const productsData = await productsResponse.json();
      const storesData = await storesResponse.json();
      const importedData = await importedProductsResponse.json();

      const products = productsData.products || [];
      const imported = importedData.products || [];

      // Separate products into categories
      const featured = products.filter((product: Product) => product.featured);
      const newArrival = products.filter((product: Product) => {
        const productDate = new Date(product.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return productDate >= sevenDaysAgo;
      });
      const regular = products.filter((product: Product) => 
        !product.featured && !isNewArrival(product)
      );

      setAvailableProducts(regular);
      setFeaturedProducts(featured);
      setNewArrivalProducts(newArrival);
      setStores(storesData.stores || []);
      setImportedProducts(imported);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportProduct = async (productId: string) => {
    const product = [...availableProducts, ...featuredProducts, ...newArrivalProducts].find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setShowImportModal(true);
    }
  };

  const confirmImport = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch('/api/vendor/products/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          markup: markupValue,
          markupType: markupType
        }),
      });

      if (response.ok) {
        alert('Product imported successfully!');
        setShowImportModal(false);
        setSelectedProduct(null);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error importing product:', error);
      alert('Error importing product');
    }
  };

  const viewProductDetails = (productId: string) => {
    router.push(`/vendor/products/${productId}`);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Import Products</h1>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <input
              type="text"
              placeholder="Filter by type..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
            </label>
                <input
                  type="text"
                  placeholder="Filter by category..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
            </label>
            <input
                  type="text"
                  placeholder="Filter by product name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.title}
                  onChange={(e) => setFilters({ ...filters, title: e.target.value })}
            />
          </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Products</option>
                  <option value="featured">⭐ Featured</option>
                  <option value="new-arrival">🆕 New Arrivals</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {filteredProducts.length} products
              </p>
              <button
                onClick={() => setFilters({ type: '', category: '', title: '', status: '' })}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear Filters
              </button>
        </div>
      </Card>

      {/* All Products Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">All Products</h2>
        <p className="text-gray-600">Browse all available products</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group relative">
            {/* Product Tags */}
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
              {product.featured && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                  ⭐ Featured
                </span>
              )}
              {isNewArrival(product) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                  🆕 New
                </span>
              )}
            </div>

            {/* Product Image Slider */}
            <ProductImageSlider
              images={product.images || []}
              fallbackImage={product.image}
              productName={product.name}
              className="w-full h-32 object-cover rounded-md mb-4"
            />
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-base font-semibold line-clamp-2">{product.name}</h3>
              {product.isImported && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Imported
                </span>
              )}
            </div>
            <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
            
            <div className="space-y-2 mb-4">
              <p className="text-xs">
                <span className="font-medium">Supplier:</span> {product.supplier.name}
              </p>
              <p className="text-xs">
                <span className="font-medium">Category:</span> {product.category}
              </p>
              <p className="text-xs">
                <span className="font-medium">Price:</span> ${product.price.toFixed(2)}
              </p>
              <p className="text-xs">
                <span className="font-medium">Available:</span> {product.availableQuantity} / {product.totalQuantity}
              </p>
            </div>

            {product.isImported && (
              <div className="bg-green-50 p-3 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-medium text-green-800">Your Margin</p>
                    <p className="text-sm font-bold text-green-600">{product.importedMargin}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-green-800">Your Price</p>
                    <p className="text-sm font-bold text-green-600">${product.finalPrice?.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-700">
                  Profit: ${((product.finalPrice || 0) - product.price).toFixed(2)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => viewProductDetails(product.id)}
                className={`w-full px-3 py-2 rounded-md transition-colors duration-200 ${
                  product.isImported 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                disabled={product.isImported}
              >
                {product.isImported ? 'Already Imported' : 'Import Product'}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Import Modal with Profit Calculator */}
      {showImportModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Product</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Product Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-medium">{selectedProduct.name}</h4>
                      <p className="text-sm text-gray-600">{selectedProduct.category}</p>
                      <p className="text-lg font-bold text-blue-600">
                        ${selectedProduct.price.toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{selectedProduct.description}</p>
                </div>
              </div>

              {/* Profit Calculator */}
              <div>
                <VendorProfitCalculator
                  supplierPrice={selectedProduct.price}
                  suggestedAmount={selectedProduct.suggestedAmount}
                  onMarkupCalculated={(markup, markupType, finalPrice) => {
                    setMarkupValue(markup);
                    setMarkupType(markupType);
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Import Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}