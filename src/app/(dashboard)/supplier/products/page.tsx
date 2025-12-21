'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import ProductImageSlider from '@/components/ProductImageSlider';
import SupplierPriceCalculator from '@/components/SupplierPriceCalculator';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isActive: boolean;
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
  variants?: Array<{
    id: string;
    name: string;
    value: string;
    priceModifier: number;
  }>;
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain: boolean;
    order: number;
  }>;
  // New catalog system
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
  }>;
  // Multi-currency support
  currency: string;
  lockedUSDPrice?: number;
  exchangeRateAtCreation?: number;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [userPreferredCurrency, setUserPreferredCurrency] = useState<string>('USD');
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    images: [] as string[], // Multiple images
    sku: '',
    brandName: '',
    minQuantity: '',
    suggestedAmount: '',
    metaTitle: '',
    metaDescription: '',
    metaTags: '',
    totalQuantity: '',
    availableQuantity: '',
    currency: 'USD', // Default currency
    categoryId: '',
    subcategoryId: '',
    tagIds: [] as string[]
  });
  const [variants, setVariants] = useState<Array<{name: string, value: string, priceModifier: string}>>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Multiple files
  const [uploadingMultiple, setUploadingMultiple] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    shipFrom: {
      country: '',
      city: '',
    },
    shippingMethods: [] as Array<{
      name: string;
      deliveryTime: string;
      cost: string;
      costType: 'flat' | 'perItem' | 'perWeight';
    }>,
    handlingTime: '',
    supportedRegions: {
      countries: [] as string[],
      excludedCountries: [] as string[],
    },
    trackingAvailable: false,
    freeShippingAbove: '',
    maxOrderQuantity: '',
  });

  const hasFetchedProducts = useRef(false);
  const hasFetchedCurrency = useRef(false);
  const hasFetchedCategories = useRef(false);
  const hasFetchedTags = useRef(false);

  const fetchProducts = useCallback(async () => {
    if (hasFetchedProducts.current) return;
    hasFetchedProducts.current = true;
    
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      hasFetchedProducts.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserCurrency = useCallback(async () => {
    if (hasFetchedCurrency.current) return;
    hasFetchedCurrency.current = true;
    
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        setUserCurrency('USD');
        setUserPreferredCurrency(userData.business?.preferredCurrency || 'USD');
        setNewProduct(prev => ({ ...prev, currency: 'USD' }));
        setCurrentExchangeRate(1);
      } else {
        setUserCurrency('USD');
        setUserPreferredCurrency('USD');
        setNewProduct(prev => ({ ...prev, currency: 'USD' }));
        setCurrentExchangeRate(1);
      }
    } catch (error) {
      console.error('Error fetching user currency:', error);
      setUserCurrency('USD');
      setUserPreferredCurrency('USD');
      setNewProduct(prev => ({ ...prev, currency: 'USD' }));
      setCurrentExchangeRate(1);
      hasFetchedCurrency.current = false;
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    if (hasFetchedCategories.current) return;
    hasFetchedCategories.current = true;
    
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      hasFetchedCategories.current = false;
    }
  }, []);

  const fetchTags = useCallback(async () => {
    if (hasFetchedTags.current) return;
    hasFetchedTags.current = true;
    
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || data || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      hasFetchedTags.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchUserCurrency();
    fetchCategories();
    fetchTags();
  }, [fetchProducts, fetchUserCurrency, fetchCategories, fetchTags]);

  // Persist form data to localStorage
  useEffect(() => {
    const savedFormData = localStorage.getItem('supplierProductForm');
    if (savedFormData && !showAddForm) {
      try {
        const parsed = JSON.parse(savedFormData);
        if (parsed.images && parsed.images.length > 0) {
          setNewProduct(prev => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, [showAddForm]);

  // Save form data to localStorage when it changes
  useEffect(() => {
    if (newProduct.images.length > 0 || newProduct.image) {
      console.log('Saving form data:', { 
        mainImage: newProduct.image, 
        additionalImages: newProduct.images 
      });
      localStorage.setItem('supplierProductForm', JSON.stringify(newProduct));
    }
  }, [newProduct]);

  const getCurrencyName = (currency: string) => {
    const currencyNames: { [key: string]: string } = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'INR': 'Indian Rupee',
      'PKR': 'Pakistani Rupee',
      'MYR': 'Malaysian Ringgit',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'JPY': 'Japanese Yen',
      'CNY': 'Chinese Yuan',
      'AED': 'UAE Dirham',
      'SAR': 'Saudi Riyal',
    };
    return currencyNames[currency] || currency;
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/subcategories?categoryId=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSubcategories(data);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };



  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Main image uploaded successfully:', data.url);
        setNewProduct({ ...newProduct, image: data.url });
        return data.url;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload image');
        return null;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log('Selected file:', file.name, file.type, file.size);
      
      // Upload the file first
      const uploadedUrl = await handleFileUpload(file);
      if (uploadedUrl) {
        // Set the uploaded URL directly
        setNewProduct(prev => ({ ...prev, image: uploadedUrl }));
      }
    }
  };

  const handleMultipleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      setUploadingMultiple(true);
      
      try {
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Additional image uploaded successfully:', data.url);
            return data.url;
          }
          throw new Error('Upload failed');
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        console.log('All additional images uploaded:', uploadedUrls);
        
        // Add uploaded URLs to images array
        setNewProduct(prev => {
          const newImages = [...prev.images, ...uploadedUrls];
          console.log('Updated images array:', newImages);
          return {
            ...prev,
            images: newImages
          };
        });
        
        setSelectedFiles([]); // Clear selected files after upload
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('Failed to upload some files');
      } finally {
        setUploadingMultiple(false);
      }
    }
  };


  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setMainImage = (index: number) => {
    const newImages = [...newProduct.images];
    const mainImage = newImages[index];
    newImages.splice(index, 1);
    newImages.unshift(mainImage);
    
    setNewProduct(prev => ({
      ...prev,
      image: mainImage,
      images: newImages
    }));
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', value: '', priceModifier: '0' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          minQuantity: newProduct.minQuantity ? parseInt(newProduct.minQuantity) : null,
          suggestedAmount: newProduct.suggestedAmount ? parseFloat(newProduct.suggestedAmount) : null,
          totalQuantity: parseInt(newProduct.totalQuantity),
          availableQuantity: parseInt(newProduct.availableQuantity),
          shippingInfo: shippingInfo,
          variants: variants.filter(v => v.name && v.value)
        }),
      });

      if (response.ok) {
        // Clear localStorage
        localStorage.removeItem('supplierProductForm');
        
        setNewProduct({
          name: '',
          description: '',
          price: '',
          image: '',
          images: [],
          sku: '',
          brandName: '',
          minQuantity: '',
          suggestedAmount: '',
          metaTitle: '',
          metaDescription: '',
          metaTags: '',
          totalQuantity: '',
          availableQuantity: '',
          currency: userCurrency,
          categoryId: '',
          subcategoryId: '',
          tagIds: []
        });
        setSelectedTags([]);
        setShippingInfo({
          shipFrom: {
            country: '',
            city: '',
          },
          shippingMethods: [],
          handlingTime: '',
          supportedRegions: {
            countries: [],
            excludedCountries: [],
          },
          trackingAvailable: false,
          freeShippingAbove: '',
          maxOrderQuantity: '',
        });
        setVariants([]);
        setSelectedFile(null);
        setSelectedFiles([]);
        setShowAddForm(false);
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to create product');
    }
  };

  const handleEditProduct = (productId: string) => {
    window.location.href = `/supplier/products/${productId}/edit`;
  };

  if (loading) {
    return <Loading message="Loading products..." />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Product
        </button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
          
          {/* Currency Information Box */}
          
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <SupplierPriceCalculator
                  onUSDCalculated={(usdAmount) => {
                    setNewProduct({ ...newProduct, price: usdAmount.toString() });
                  }}
                  onSuggestedAmountCalculated={(usdAmount) => {
                    setNewProduct({ ...newProduct, suggestedAmount: usdAmount.toString() });
                  }}
                  defaultCurrency={userPreferredCurrency}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={newProduct.categoryId}
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    setNewProduct({ ...newProduct, categoryId, subcategoryId: '' });
                    if (categoryId) {
                      fetchSubcategories(categoryId);
                    } else {
                      setSubcategories([]);
                    }
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subcategory and Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={newProduct.subcategoryId}
                  onChange={(e) => setNewProduct({ ...newProduct, subcategoryId: e.target.value })}
                  disabled={!newProduct.categoryId}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tagId) => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color || '#6B7280' }}
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => setSelectedTags(prev => prev.filter(id => id !== tagId))}
                            className="ml-1 text-white hover:text-gray-200"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value=""
                    onChange={(e) => {
                      const tagId = e.target.value;
                      if (tagId && !selectedTags.includes(tagId)) {
                        setSelectedTags(prev => [...prev, tagId]);
                        setNewProduct(prev => ({ ...prev, tagIds: [...prev.tagIds, tagId] }));
                      }
                    }}
                  >
                    <option value="">Add Tags</option>
                    {tags.filter(tag => !selectedTags.includes(tag.id)).map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory Tracking */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 100"
                  value={newProduct.totalQuantity}
                  onChange={(e) => setNewProduct({ ...newProduct, totalQuantity: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Total stock quantity</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 95"
                  value={newProduct.availableQuantity}
                  onChange={(e) => setNewProduct({ ...newProduct, availableQuantity: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Currently available for sale</p>
              </div>
            </div>

            {/* Main Product Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Product Image
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={uploading}
                />
                {uploading && (
                  <div className="flex items-center text-sm text-blue-600 mb-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Uploading main image...
                  </div>
                )}
                {newProduct.image && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Main Image (1)</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="relative group">
                    <img
                      src={newProduct.image}
                          alt="Main product"
                          className="w-20 h-20 object-cover rounded-md border-2 border-indigo-500"
                          onError={(e) => {
                            console.error('Image failed to load:', newProduct.image);
                            e.currentTarget.style.display = 'none';
                            // Show fallback
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          onLoad={() => {
                            console.log('Main image loaded successfully:', newProduct.image);
                          }}
                        />
                        <div className="w-20 h-20 bg-gray-200 rounded-md border-2 border-indigo-500 flex items-center justify-center text-xs text-gray-500 hidden">
                          <div className="text-center">
                            <div className="text-red-500 mb-1">⚠️</div>
                            <div>Image Error</div>
                          </div>
                        </div>
                        <div className="absolute top-1 left-1 bg-indigo-500 text-white text-xs px-1 rounded">
                          Main
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                            <button
                              type="button"
                              onClick={() => setNewProduct(prev => ({ ...prev, image: '' }))}
                              className="bg-red-600 text-white p-1 rounded text-xs hover:bg-red-700"
                              title="Remove main image"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Supported formats: JPEG, PNG, WebP (Max 5MB)
                </div>
             
              </div>
            </div>

            {/* Multiple Product Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Product Images
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={uploadingMultiple}
                />
                {uploadingMultiple && (
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Uploading images...
                  </div>
                )}
                
                {/* Display uploaded images */}
                {newProduct.images.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Images ({newProduct.images.length})</p>
                    <div className="grid grid-cols-4 gap-2">
                      {newProduct.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Product ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-md border"
                            onError={(e) => {
                              console.error('Image failed to load:', imageUrl);
                              e.currentTarget.style.display = 'none';
                              // Show fallback
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log('Additional image loaded successfully:', imageUrl);
                            }}
                          />
                          <div className="w-20 h-20 bg-gray-200 rounded-md border flex items-center justify-center text-xs text-gray-500 hidden">
                            <div className="text-center">
                              <div className="text-red-500 mb-1">⚠️</div>
                              <div>Error</div>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                              <button
                                type="button"
                                onClick={() => setMainImage(index)}
                                className="bg-green-600 text-white p-1 rounded text-xs hover:bg-green-700"
                                title="Set as main image"
                              >
                                ⭐
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="bg-red-600 text-white p-1 rounded text-xs hover:bg-red-700"
                                title="Remove image"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          {index === 0 && (
                            <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  You can upload up to 10 additional images. First image will be set as main image.
                </div>
              </div>
            </div>
            
            {/* Product Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product Variants (Optional)
                </label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200"
                >
                  + Add Variant
                </button>
              </div>
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs text-green-700">
                  ✅ Variants feature is now active! You can add color, size, and other options to your products.
                </p>
              </div>
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 p-3 border border-gray-200 rounded-md">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type (e.g., Color, Size)
                      </label>
                      <input
                        type="text"
                        placeholder="Color"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Value (e.g., Blue, Large)
                      </label>
                      <input
                        type="text"
                        placeholder="Blue"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={variant.value}
                        onChange={(e) => updateVariant(index, 'value', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Price Modifier ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={variant.priceModifier}
                        onChange={(e) => updateVariant(index, 'priceModifier', e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="w-full bg-red-100 text-red-700 px-2 py-1 text-sm rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {variants.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No variants added. Click "Add Variant" to add color, size, or other options.
                  </p>
                )}
              </div>
            </div>

            {/* New Product Fields */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Additional Product Information</h3>
              
              {/* SKU and Brand Name */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., PROD-001"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Nike, Apple"
                    value={newProduct.brandName}
                    onChange={(e) => setNewProduct({ ...newProduct, brandName: e.target.value })}
                  />
                </div>
              </div>

              {/* Min Quantity */}
              <div className="mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Quantity Purchasing
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 10"
                    value={newProduct.minQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, minQuantity: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum order quantity for this product</p>
                </div>
              </div>


              {/* SEO Fields */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">SEO Information (Optional)</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="SEO optimized title (max 60 characters)"
                    value={newProduct.metaTitle}
                    onChange={(e) => setNewProduct({ ...newProduct, metaTitle: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">{newProduct.metaTitle.length}/60 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={160}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="SEO optimized description (max 160 characters)"
                    value={newProduct.metaDescription}
                    onChange={(e) => setNewProduct({ ...newProduct, metaDescription: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">{newProduct.metaDescription.length}/160 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Tags
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., electronics, gadgets, tech (comma-separated)"
                    value={newProduct.metaTags}
                    onChange={(e) => setNewProduct({ ...newProduct, metaTags: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Shipping Information</h3>
              
              {/* Ship From */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Ship From (Origin Warehouse)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={shippingInfo.shipFrom.country}
                      onChange={(e) => setShippingInfo({
                        ...shippingInfo,
                        shipFrom: { ...shippingInfo.shipFrom, country: e.target.value }
                      })}
                    >
                      <option value="">Select Country</option>
                      <option value="China">China 🇨🇳</option>
                      <option value="USA">United States 🇺🇸</option>
                      <option value="Pakistan">Pakistan 🇵🇰</option>
                      <option value="India">India 🇮🇳</option>
                      <option value="Germany">Germany 🇩🇪</option>
                      <option value="UK">United Kingdom 🇬🇧</option>
                      <option value="Canada">Canada 🇨🇦</option>
                      <option value="Australia">Australia 🇦🇺</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Shanghai, New York"
                      value={shippingInfo.shipFrom.city}
                      onChange={(e) => setShippingInfo({
                        ...shippingInfo,
                        shipFrom: { ...shippingInfo.shipFrom, city: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Methods */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-700">Available Shipping Methods</h4>
                  <button
                    type="button"
                    onClick={() => setShippingInfo({
                      ...shippingInfo,
                      shippingMethods: [...shippingInfo.shippingMethods, {
                        name: '',
                        deliveryTime: '',
                        cost: '',
                        costType: 'flat'
                      }]
                    })}
                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200"
                  >
                    + Add Method
                  </button>
                </div>
                
                <div className="space-y-3">
                  {shippingInfo.shippingMethods.map((method, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 p-3 border border-gray-200 rounded-md">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Method Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Standard, Express"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={method.name}
                          onChange={(e) => {
                            const updated = [...shippingInfo.shippingMethods];
                            updated[index].name = e.target.value;
                            setShippingInfo({ ...shippingInfo, shippingMethods: updated });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Delivery Time
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 7-14 days"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={method.deliveryTime}
                          onChange={(e) => {
                            const updated = [...shippingInfo.shippingMethods];
                            updated[index].deliveryTime = e.target.value;
                            setShippingInfo({ ...shippingInfo, shippingMethods: updated });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Cost
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 5.00"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={method.cost}
                          onChange={(e) => {
                            const updated = [...shippingInfo.shippingMethods];
                            updated[index].cost = e.target.value;
                            setShippingInfo({ ...shippingInfo, shippingMethods: updated });
                          }}
                        />
                      </div>
                      <div className="flex items-end gap-1">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Cost Type
                          </label>
                          <select
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={method.costType}
                            onChange={(e) => {
                              const updated = [...shippingInfo.shippingMethods];
                              updated[index].costType = e.target.value as 'flat' | 'perItem' | 'perWeight';
                              setShippingInfo({ ...shippingInfo, shippingMethods: updated });
                            }}
                          >
                            <option value="flat">Flat Rate</option>
                            <option value="perItem">Per Item</option>
                            <option value="perWeight">Per Weight</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = shippingInfo.shippingMethods.filter((_, i) => i !== index);
                            setShippingInfo({ ...shippingInfo, shippingMethods: updated });
                          }}
                          className="text-red-600 hover:text-red-800 px-2 py-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {shippingInfo.shippingMethods.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No shipping methods added. Click "Add Method" to add shipping options.
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Shipping Settings */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Handling Time (Processing)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 1-3 business days"
                    value={shippingInfo.handlingTime}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, handlingTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Free Shipping Above ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 50.00"
                    value={shippingInfo.freeShippingAbove}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, freeShippingAbove: e.target.value })}
                  />
                </div>
              </div>

              {/* Tracking and Max Quantity */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trackingAvailable"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={shippingInfo.trackingAvailable}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, trackingAvailable: e.target.checked })}
                  />
                  <label htmlFor="trackingAvailable" className="ml-2 block text-sm text-gray-700">
                    Tracking Available
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Order Quantity
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 10"
                    value={shippingInfo.maxOrderQuantity}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, maxOrderQuantity: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Add Product
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Card key={product.id}>
            <ProductImageSlider
              images={product.images || []}
              fallbackImage={product.image}
              productName={product.name}
              className="w-full h-32 object-cover rounded-md mb-3"
            />
            <h3 className="text-base font-semibold mb-2 line-clamp-2">{product.name}</h3>
            <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
            <div className="mb-2">
              <p className="text-base font-bold text-indigo-600">
                {product.currency} {product.price}
              </p>
              {product.lockedUSDPrice && product.currency !== 'USD' && (
                <p className="text-xs text-gray-500">
                  Locked USD: ${product.lockedUSDPrice.toFixed(2)}
                </p>
              )}
              {product.exchangeRateAtCreation && product.currency !== 'USD' && (
                <p className="text-xs text-gray-400">
                  Rate used: {product.exchangeRateAtCreation.toFixed(4)}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Category: {product.category?.name || 'N/A'}
              {product.subcategory && ` > ${product.subcategory.name}`}
            </p>
            
            {/* New Product Fields Display */}
            <div className="space-y-1 mb-3 text-xs text-gray-600">
              {product.sku && (
                <p><span className="font-medium">SKU:</span> {product.sku}</p>
              )}
              {product.brandName && (
                <p><span className="font-medium">Brand:</span> {product.brandName}</p>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="font-medium">Tags:</span>
                  {product.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color || '#6B7280' }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              {product.minQuantity && (
                <p><span className="font-medium">Min Qty:</span> {product.minQuantity}</p>
              )}
              {product.suggestedAmount && (
                <p><span className="font-medium">Suggested Price:</span> ${product.suggestedAmount} USD</p>
              )}
            </div>

            {/* Inventory Status */}
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-blue-800">Inventory Status:</span>
                <span className="text-blue-600">
                  {product.availableQuantity} / {product.totalQuantity} available
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ 
                    width: `${product.totalQuantity > 0 ? (product.availableQuantity / product.totalQuantity) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Variants:</p>
                <div className="space-y-1">
                  {product.variants.map((variant: any, index: number) => (
                    <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      <span className="font-medium">{variant.name}:</span> {variant.value}
                      {variant.priceModifier > 0 && (
                        <span className="text-green-600 ml-1">(+${variant.priceModifier})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Show message when no variants */}
            {(!product.variants || product.variants.length === 0) && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 italic">
                  No variants added to this product
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status:</span> Available for Import
              </p>
              <p className="text-xs text-gray-500">
                Vendors can import this product to their stores and create hosted links
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEditProduct(product.id)}
                className="w-full bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
              >
                ✏️ Edit Product
              </button>
            </div>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <p className="text-center text-gray-500">No products found. Add your first product!</p>
        </Card>
      )}
    </div>
  );
}
