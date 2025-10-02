'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { useCart } from '@/contexts/CartContext';
import ProductImageSlider from '@/components/ProductImageSlider';
import Link from 'next/link';
import { currencyDetection } from '@/lib/currency-detection';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  template: string;
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
  category?: {
    name: string;
    slug: string;
  };
  subcategory?: {
    name: string;
    slug: string;
  };
  hostedLink: string;
  featured?: boolean;
  bestSelling?: boolean;
  newArrival?: boolean;
  createdAt: string;
  type?: string;
  subCategory?: string;
  sku?: string;
  brandName?: string;
  storeProductId: string;
  lockedUSDPrice: number;
  lockedLocalPrice: number;
  localCurrency: string;
  markup: number;
  finalPrice: number;
  displayPrice: number;
  displayCurrency: string;
  exchangeRate: number;
  isActive: boolean;
  updatedAt: string;
  tags?: Array<{
    tag: {
      name: string;
      color?: string;
    };
  }>;
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain: boolean;
    order: number;
  }>;
}

// Product Card Component
function ProductCard({ product, isFeatured = false, isBestSelling = false, isNewArrival = false }: { 
  product: Product; 
  isFeatured?: boolean; 
  isBestSelling?: boolean; 
  isNewArrival?: boolean; 
}) {
  const getCurrencySymbol = (currency: string) => {
    return currencyDetection.getCurrencySymbol(currency);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group relative">
      {/* Product Image */}
      <div className="relative overflow-hidden rounded-t-lg">
        <ProductImageSlider
          images={product.images || []}
          fallbackImage={product.image}
          productName={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            {product.category?.name || 'N/A'}
          </span>
          {isFeatured && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              ⭐ Featured
            </span>
          )}
          {isBestSelling && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              🔥 Best Selling
            </span>
          )}
          {isNewArrival && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              🆕 New
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        {/* Additional Info */}
        {(product.brandName || product.type) && (
          <div className="mb-3 text-xs text-gray-500">
            {product.brandName && <span className="block">Brand: {product.brandName}</span>}
            {product.type && <span className="block">Type: {product.type}</span>}
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-right">
            <span className="text-2xl font-bold text-indigo-600">
              {getCurrencySymbol(product.displayCurrency)}{product.displayPrice.toFixed(2)}
            </span>
            {product.displayCurrency !== product.localCurrency && (
              <div className="text-xs text-gray-500 mt-1">
                Store: {getCurrencySymbol(product.localCurrency)}{product.finalPrice.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Buy Button */}
        <a
          href={`/product/${product.id}`}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-center block"
        >
          Buy Now
        </a>
      </div>
    </div>
  );
}

export default function StorePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { getTotalItems } = useCart();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerCurrency, setCustomerCurrency] = useState('USD');
  const [currencyInfo, setCurrencyInfo] = useState<any>(null);
  const [convertedProducts, setConvertedProducts] = useState<Product[]>([]);
  const [converting, setConverting] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    priceRange: '',
    sortBy: 'newest'
  });
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (slug) {
      fetchStoreData();
    }
  }, [slug]);

  // Debug logging
  useEffect(() => {
    if (products.length > 0) {
      console.log('Products data:', products[0]);
      console.log('First product category:', products[0].category);
      console.log('First product subcategory:', products[0].subcategory);
      console.log('First product tags:', products[0].tags);
      
      // Check for any objects being rendered directly
      products.forEach((product, index) => {
        if (typeof product.category === 'object' && product.category !== null) {
          console.warn(`Product ${index} has category object:`, product.category);
        }
        if (typeof product.subcategory === 'object' && product.subcategory !== null) {
          console.warn(`Product ${index} has subcategory object:`, product.subcategory);
        }
        if (Array.isArray(product.tags)) {
          product.tags.forEach((tag, tagIndex) => {
            if (typeof tag === 'object' && tag !== null) {
              console.warn(`Product ${index} tag ${tagIndex} is object:`, tag);
            }
          });
        }
      });
    }
  }, [products]);

  // Filter products based on current filters
  useEffect(() => {
    let filtered = convertedProducts.length > 0 ? convertedProducts : products;

    if (filters.category) {
      filtered = filtered.filter(product =>
        product.category?.name?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(product =>
        product.type?.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (max) {
        filtered = filtered.filter(product => product.displayPrice >= min && product.displayPrice <= max);
      } else {
        filtered = filtered.filter(product => product.displayPrice >= min);
      }
    }

    // Sort products
    switch (filters.sortBy) {
      case 'price-low':
        filtered = filtered.sort((a, b) => a.displayPrice - b.displayPrice);
        break;
      case 'price-high':
        filtered = filtered.sort((a, b) => b.displayPrice - a.displayPrice);
        break;
      case 'name':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredProducts(filtered);
  }, [convertedProducts, products, filters]);

  const convertProductPrices = async (products: Product[], currencyInfo: any) => {
    setConverting(true);
    
    try {
      // Group products by their base currency to minimize API calls
      const currencyGroups: { [key: string]: Product[] } = {};
      products.forEach(product => {
        const baseCurrency = product.localCurrency || 'USD';
        if (!currencyGroups[baseCurrency]) {
          currencyGroups[baseCurrency] = [];
        }
        currencyGroups[baseCurrency].push(product);
      });
      
      // Get exchange rates for each unique currency pair
      const exchangeRates: { [key: string]: number } = {};
      for (const baseCurrency of Object.keys(currencyGroups)) {
        if (baseCurrency !== currencyInfo.currency) {
          exchangeRates[baseCurrency] = await currencyDetection.convertPrice(1, baseCurrency, currencyInfo.currency);
        } else {
          exchangeRates[baseCurrency] = 1;
        }
      }
      
      const convertedProducts = products.map((product) => {
        const baseCurrency = product.localCurrency || 'USD';
        const rate = exchangeRates[baseCurrency] || 1;
        const convertedPrice = product.finalPrice * rate;
        
        return {
          ...product,
          displayPrice: convertedPrice,
          displayCurrency: currencyInfo.currency,
          exchangeRate: rate
        };
      });
      
      setConvertedProducts(convertedProducts);
      
      // Separate products by status
      const featured = convertedProducts.filter(product => product.featured);
      const bestSelling = convertedProducts.filter(product => product.bestSelling);
      const newArrival = convertedProducts.filter(product => {
        const createdAt = new Date(product.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt >= thirtyDaysAgo;
      });
      
      setFeaturedProducts(featured);
      setBestSellingProducts(bestSelling);
      setNewArrivalProducts(newArrival);
      
    } catch (error) {
      console.error('Error converting prices:', error);
      // Fallback to original products
      setConvertedProducts(products);
    } finally {
      setConverting(false);
    }
  };

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      
      // Detect customer currency using frontend-only service
      const detectedCurrencyInfo = await currencyDetection.detectCurrency();
      setCustomerCurrency(detectedCurrencyInfo.currency);
      setCurrencyInfo(detectedCurrencyInfo);
      
      console.log('Detected currency:', detectedCurrencyInfo);
      
      // Fetch store data (without currency parameter - backend unchanged)
      const response = await fetch(`/api/stores/by-slug/${slug}`);
      const data = await response.json();
      console.log('Store data received:', data);
      
      setStore(data.store);
      
      const allProducts = data.store?.products || [];
      setProducts(allProducts);
      
      // Convert prices to customer currency on frontend
      await convertProductPrices(allProducts, detectedCurrencyInfo);
      
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
    <div className="min-h-screen bg-white">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Store Name */}
            <div className="flex items-center space-x-4">
              {store.logo && (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="h-10 w-10 object-contain"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
                <p className="text-xs text-gray-500">Online Store</p>
                {currencyInfo && (
                  <p className="text-xs text-indigo-600 mt-1">
                    Prices in {currencyInfo.currency} ({currencyInfo.country})
                  </p>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#products" className="text-gray-700 hover:text-gray-900 font-medium">Products</a>
              <a href="#about" className="text-gray-700 hover:text-gray-900 font-medium">About</a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</a>
            </nav>

            {/* Cart Icon */}
            <div className="flex items-center space-x-4">
              <Link href="/cart" className="relative p-2 text-gray-700 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
          </div>
        </div>
      </div>
      </header>

      {/* Hero Section with Banner */}
      <section className="relative">
        {store.banner ? (
          <div className="relative h-96 md:h-[500px] overflow-hidden">
            <img
              src={store.banner}
              alt={`${store.name} banner`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">{store.name}</h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-200">{store.description}</p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="#products"
                    className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Shop Now
                  </a>
                  <a
                    href="#about"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
                  </div>
        ) : (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">{store.name}</h1>
                <p className="text-xl md:text-2xl mb-8 text-indigo-100">{store.description}</p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="#products"
                    className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Shop Now
                  </a>
                  <a
                    href="#about"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h2>
            <p className="text-lg text-gray-600">Discover our amazing collection</p>
          </div>
        
          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">All Types</option>
                  {Array.from(new Set(products.map(p => p.type).filter(Boolean))).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.priceRange}
                  onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                >
                  <option value="">All Prices</option>
                  <option value="0-25">$0 - $25</option>
                  <option value="25-50">$25 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200">$200+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {convertedProducts.length > 0 ? convertedProducts.length : products.length} products
                {converting && <span className="ml-2 text-indigo-600">(Converting prices...)</span>}
              </p>
              <button
                onClick={() => setFilters({ category: '', type: '', priceRange: '', sortBy: 'newest' })}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Featured Products Section */}
          {featuredProducts.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">⭐ Featured Products</h3>
                <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  {featuredProducts.length} products
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={`featured-${product.id}`} product={product} isFeatured={true} />
                ))}
              </div>
            </div>
          )}

          {/* Best Selling Products Section */}
          {bestSellingProducts.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">🔥 Best Selling</h3>
                <span className="ml-3 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                  {bestSellingProducts.length} products
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bestSellingProducts.map((product) => (
                  <ProductCard key={`bestselling-${product.id}`} product={product} isBestSelling={true} />
                ))}
              </div>
            </div>
          )}

          {/* New Arrivals Section */}
          {newArrivalProducts.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">🆕 New Arrivals</h3>
                <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {newArrivalProducts.length} products
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {newArrivalProducts.map((product) => (
                  <ProductCard key={`newarrival-${product.id}`} product={product} isNewArrival={true} />
                ))}
              </div>
            </div>
          )}

          {/* All Products Section */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">All Products</h3>
              <span className="ml-3 px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                {filteredProducts.length} products
              </span>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters to see more products.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About {store.name}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {store.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Products</h3>
              <p className="text-gray-600">We offer only the highest quality products from trusted suppliers.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable delivery to your doorstep.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support for all your needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-lg text-gray-600">Have questions? We'd love to hear from you.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {store.email && (
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600">{store.email}</p>
              </div>
            )}
            
            {store.phone && (
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
                <p className="text-gray-600">{store.phone}</p>
              </div>
            )}
            
            {store.address && (
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
                <p className="text-gray-600">{store.address}</p>
              </div>
        )}
      </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Store Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                {store.logo && (
                  <img
                    src={store.logo}
                    alt={store.name}
                    className="h-10 w-10 object-contain"
                  />
                )}
                <h3 className="text-xl font-bold">{store.name}</h3>
              </div>
              <p className="text-gray-400 mb-4">{store.description}</p>
              <p className="text-sm text-gray-500">by {store.owner.name}</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#products" className="text-gray-400 hover:text-white transition-colors">Products</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Shipping Info</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Returns</a></li>
              </ul>
            </div>
      </div>

          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                &copy; 2024 {store.name}. All rights reserved. Powered by Fastdrop.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
