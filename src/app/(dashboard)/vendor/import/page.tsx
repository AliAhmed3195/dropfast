'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

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
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    title: '',
    status: '' // New filter for product status
  });
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products based on current filters
  useEffect(() => {
    let filtered = availableProducts;

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
      } else if (filters.status === 'best-selling') {
        filtered = filtered.filter(product => product.bestSelling);
      } else if (filters.status === 'new-arrival') {
        filtered = filtered.filter(product => product.newArrival);
      }
    }

    setFilteredProducts(filtered);
  }, [availableProducts, filters]);

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

      // Mark products as imported and add margin info
      const productsWithImportStatus = (productsData.products || []).map((product: Product) => {
        const importedProduct = importedData.products?.find((ip: any) => 
          ip.supplierId === product.supplier.id && ip.name === product.name
        );
        
        if (importedProduct) {
          return {
            ...product,
            isImported: true,
            importedMargin: importedProduct.markup || 0,
            finalPrice: product.price + (product.price * (importedProduct.markup || 0) / 100)
          };
        }
        
        return {
          ...product,
          isImported: false
        };
      });

          // Separate products by status
          const featured = productsWithImportStatus.filter(product => product.featured);
          const bestSelling = productsWithImportStatus.filter(product => product.bestSelling);
          const newArrival = productsWithImportStatus.filter(product => {
            const createdAt = new Date(product.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return createdAt >= thirtyDaysAgo;
          });
          const regular = productsWithImportStatus.filter(product => 
            !product.featured && !product.bestSelling && !newArrival.includes(product)
          );
          
          setFeaturedProducts(featured);
          setBestSellingProducts(bestSelling);
          setNewArrivalProducts(newArrival);
          setAvailableProducts(regular);
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




  const viewProductDetails = (productId: string) => {
    router.push(`/vendor/products/${productId}`);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  placeholder="Filter by product type..."
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
                  <option value="best-selling">🔥 Best Selling</option>
                  <option value="new-arrival">🆕 New Arrivals</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {availableProducts.length + featuredProducts.length + bestSellingProducts.length + newArrivalProducts.length} products
              </p>
              <button
                onClick={() => setFilters({ type: '', category: '', title: '', status: '' })}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear Filters
              </button>
        </div>
      </Card>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">⭐ Featured Products</h2>
            <span className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              {featuredProducts.length} products
            </span>
          </div>
          <p className="text-gray-600 mb-4">Hand-picked products by our admin team</p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <Card key={`featured-${product.id}`} className="group border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 relative">
                {/* Featured Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                    ⭐ Featured
                  </span>
                </div>

                {/* Product Image Slider */}
                <div className="relative overflow-hidden rounded-md mb-4">
                  {product.image ? (
                    <div className="relative w-full h-48 bg-gray-100">
              <img
                src={product.image}
                alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No Image</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  {product.isImported && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Imported
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm">
                <span className="font-medium">Supplier:</span> {product.supplier.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Category:</span> {product.category}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Base Price:</span> ${product.price}
                  </p>
                  
                  {/* Imported Product Info */}
                  {product.isImported && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Your Margin</p>
                          <p className="text-lg font-bold text-green-600">{product.importedMargin}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-800">Your Price</p>
                          <p className="text-lg font-bold text-green-600">${product.finalPrice?.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-green-700">
                        Profit: ${((product.finalPrice || 0) - product.price).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => viewProductDetails(product.id)}
                    className={`w-full px-3 py-2 rounded-md transition-colors duration-200 ${
                      product.isImported
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {product.isImported ? 'View Details' : 'Import Item'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
          )}

          {/* Best Selling Products Section */}
          {bestSellingProducts.length > 0 && (
            <Card className="mb-6">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">🔥 Best Selling Products</h2>
                <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {bestSellingProducts.length} products
                </span>
              </div>
              <p className="text-gray-600 mb-4">Top performing products based on sales data</p>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {bestSellingProducts.map((product) => (
                  <Card key={`bestselling-${product.id}`} className="group border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 relative">
                    {/* Best Selling Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                        🔥 Best Selling
                      </span>
                    </div>

                    {/* Product Image */}
                    <div className="relative overflow-hidden rounded-md mb-4">
                      {product.image ? (
                        <div className="relative w-full h-48 bg-gray-100">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">No Image</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      {product.isImported && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Imported
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <span className="font-medium">Supplier:</span> {product.supplier.name}
              </p>
              <p className="text-sm">
                        <span className="font-medium">Category:</span> {product.category}
                      </p>
                      <p className="text-sm text-gray-600">
                <span className="font-medium">Base Price:</span> ${product.price}
              </p>
                      
                      {/* Imported Product Info */}
                      {product.isImported && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">Your Margin</p>
                              <p className="text-lg font-bold text-green-600">{product.importedMargin}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-800">Your Price</p>
                              <p className="text-lg font-bold text-green-600">${product.finalPrice?.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-green-700">
                            Profit: ${((product.finalPrice || 0) - product.price).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => viewProductDetails(product.id)}
                        className={`w-full px-3 py-2 rounded-md transition-colors duration-200 ${
                          product.isImported
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {product.isImported ? 'View Details' : 'Import Item'}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* New Arrivals Section */}
          {newArrivalProducts.length > 0 && (
            <Card className="mb-6">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">🆕 New Arrivals</h2>
                <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {newArrivalProducts.length} products
                </span>
              </div>
              <p className="text-gray-600 mb-4">Fresh products added in the last 30 days</p>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {newArrivalProducts.map((product) => (
                  <Card key={`newarrival-${product.id}`} className="group border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 relative">
                    {/* New Arrival Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                        🆕 New
                      </span>
                    </div>

                    {/* Product Image */}
                    <div className="relative overflow-hidden rounded-md mb-4">
                      {product.image ? (
                        <div className="relative w-full h-48 bg-gray-100">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">No Image</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      {product.isImported && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Imported
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <span className="font-medium">Supplier:</span> {product.supplier.name}
              </p>
              <p className="text-sm">
                        <span className="font-medium">Category:</span> {product.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Base Price:</span> ${product.price}
                      </p>
                      
                      {/* Imported Product Info */}
                      {product.isImported && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">Your Margin</p>
                              <p className="text-lg font-bold text-green-600">{product.importedMargin}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-800">Your Price</p>
                              <p className="text-lg font-bold text-green-600">${product.finalPrice?.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-green-700">
                            Profit: ${((product.finalPrice || 0) - product.price).toFixed(2)}
                          </div>
                        </div>
                      )}
            </div>

            <div className="space-y-2">
              <button
                        onClick={() => viewProductDetails(product.id)}
                        className={`w-full px-3 py-2 rounded-md transition-colors duration-200 ${
                          product.isImported
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {product.isImported ? 'View Details' : 'Import Item'}
              </button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Regular Products Section */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">All Products</h2>
            <p className="text-gray-600">Browse all available products</p>
          </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group">
            {/* Product Image Slider */}
            <div className="relative overflow-hidden rounded-md mb-4">
              {product.image ? (
                <div className="relative w-full h-32 bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Image overlay for better text visibility */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No Image</p>
                  </div>
                </div>
              )}
            </div>
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
              <p className="text-xs text-gray-600">
                <span className="font-medium">Base Price:</span> ${product.price}
              </p>
              
              {/* Imported Product Info */}
              {product.isImported && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                  <div className="flex items-center justify-between">
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
            </div>

            <div className="space-y-2">
              <button
                onClick={() => viewProductDetails(product.id)}
                className={`w-full px-3 py-2 rounded-md transition-colors duration-200 ${
                  product.isImported
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {product.isImported ? 'View Details' : 'Import Item'}
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
