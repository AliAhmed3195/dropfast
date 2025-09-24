'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain: boolean;
    order: number;
  }>;
  category: string;
  isActive: boolean;
  sku?: string;
  brandName?: string;
  minQuantity?: number;
  suggestedAmount?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaTags?: string;
  type?: string;
  subCategory?: string;
  totalQuantity: number;
  availableQuantity: number;
  shippingInfo?: any;
  variants?: Array<{
    id: string;
    name: string;
    value: string;
    priceModifier: number;
  }>;
  createdAt: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      setUploadingImages(true);
      
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
            return data.url;
          }
          throw new Error('Upload failed');
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        const newImages = uploadedUrls.map((url, index) => ({
          id: `temp-${Date.now()}-${index}`, // Temporary ID for new images
          url,
          alt: `Product image ${(product?.images?.length || 0) + index + 1}`,
          isMain: false,
          order: (product?.images?.length || 0) + index
        }));
        
        setProduct(prev => prev ? {
          ...prev,
          images: [...(prev.images || []), ...newImages]
        } : null);
        setSelectedFiles([]); // Clear selected files after upload
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('Failed to upload some files');
      } finally {
        setUploadingImages(false);
      }
    }
  };


  const removeImage = (imageId: string) => {
    if (!product) return;
    
    const newImages = (product.images || []).filter(img => img.id !== imageId);
    
    setProduct(prev => prev ? {
      ...prev,
      images: newImages
    } : null);
  };

  const setMainImage = (imageId: string) => {
    if (!product || !product.images) return;
    
    const newImages = product.images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));
    
    setProduct(prev => prev ? {
      ...prev,
      images: newImages
    } : null);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Only allow editing of certain fields (restricted fields)
          name: product.name,
          description: product.description,
          image: product.image,
          category: product.category,
          type: product.type,
          subCategory: product.subCategory,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          metaTags: product.metaTags,
          totalQuantity: product.totalQuantity,
          availableQuantity: product.availableQuantity,
          shippingInfo: product.shippingInfo,
          variants: product.variants,
        }),
      });

      if (response.ok) {
        // Update images if there are any
        if (product.images && product.images.length > 0) {
          const imageResponse = await fetch(`/api/products/${productId}/images`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              images: product.images
            }),
          });

          if (!imageResponse.ok) {
            console.error('Failed to update images');
          }
        }
        
        alert('Product updated successfully!');
        router.push('/supplier/products');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or you don't have permission to edit it.</p>
          <button
            onClick={() => router.push('/supplier/products')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/supplier/products')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Edit Product</h1>
        </div>
        <div className="text-sm text-gray-500">
          Product ID: {product.id}
        </div>
      </div>

      <form onSubmit={handleUpdateProduct} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={product.category}
                onChange={(e) => setProduct({ ...product, category: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
            />
          </div>
        </Card>

        {/* Product Categorization */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Product Categorization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={product.type || ''}
                onChange={(e) => setProduct({ ...product, type: e.target.value })}
              >
                <option value="">Select Type</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Sports">Sports</option>
                <option value="Beauty">Beauty</option>
                <option value="Books">Books</option>
                <option value="Toys">Toys</option>
                <option value="Automotive">Automotive</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Smartphones, T-Shirts"
                value={product.subCategory || ''}
                onChange={(e) => setProduct({ ...product, subCategory: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Inventory Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Inventory Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
              <input
                type="number"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 100"
                value={product.totalQuantity}
                onChange={(e) => setProduct({ ...product, totalQuantity: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">Total stock quantity</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
              <input
                type="number"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 95"
                value={product.availableQuantity}
                onChange={(e) => setProduct({ ...product, availableQuantity: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">Currently available for sale</p>
            </div>
          </div>
        </Card>

        {/* SEO Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">SEO Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="SEO title for search engines"
                value={product.metaTitle || ''}
                onChange={(e) => setProduct({ ...product, metaTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="SEO description for search engines"
                value={product.metaDescription || ''}
                onChange={(e) => setProduct({ ...product, metaDescription: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Tags</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="tag1, tag2, tag3"
                value={product.metaTags || ''}
                onChange={(e) => setProduct({ ...product, metaTags: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated tags</p>
            </div>
          </div>
        </Card>

        {/* Product Images */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Product Images</h2>
          <div className="space-y-6">
            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Image URL
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter main image URL"
                value={product.image || ''}
                onChange={(e) => setProduct({ ...product, image: e.target.value })}
              />
              {product.image && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Main Image (1)</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="relative group">
                      <img
                        src={product.image}
                        alt="Main product"
                        className="w-20 h-20 object-cover rounded-md border-2 border-indigo-500"
                      />
                      <div className="absolute top-1 left-1 bg-indigo-500 text-white text-xs px-1 rounded">
                        Main
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                          <button
                            type="button"
                            onClick={() => setProduct({ ...product, image: '' })}
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
            </div>

            {/* Additional Images Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add More Images
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={uploadingImages}
                />
                {uploadingImages && (
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Uploading images...
                  </div>
                )}
              </div>
            </div>

            {/* Display All Images */}
            {product.images && product.images.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  All Images ({product.images.length + 1})
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {/* Main Image */}
                  {product.image && (
                    <div className="relative group">
                      <img
                        src={product.image}
                        alt="Main product"
                        className="w-24 h-24 object-cover rounded-md border-2 border-green-500"
                      />
                      <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded">
                        Main
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Images */}
                  {product.images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={image.alt || `Product image`}
                        className={`w-24 h-24 object-cover rounded-md border ${image.isMain ? 'border-2 border-indigo-500' : 'border'}`}
                      />
                      {image.isMain && (
                        <div className="absolute top-1 left-1 bg-indigo-500 text-white text-xs px-1 py-0.5 rounded">
                          Main
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                          {!image.isMain && (
                            <button
                              type="button"
                              onClick={() => setMainImage(image.id)}
                              className="bg-green-600 text-white p-1 rounded text-xs hover:bg-green-700"
                              title="Set as main image"
                            >
                              ⭐
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="bg-red-600 text-white p-1 rounded text-xs hover:bg-red-700"
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Restricted Fields Notice */}
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Restricted Fields (Read Only)</h3>
          <p className="text-sm text-yellow-700 mb-4">
            The following fields cannot be edited after product creation to maintain data integrity:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-600"
                value={product.price}
                disabled
                title="This field cannot be edited after product creation"
              />
              <p className="text-xs text-gray-500 mt-1">Locked after creation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-600"
                value={product.sku || 'Not set'}
                disabled
                title="This field cannot be edited after product creation"
              />
              <p className="text-xs text-gray-500 mt-1">Locked after creation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-600"
                value={product.brandName || 'Not set'}
                disabled
                title="This field cannot be edited after product creation"
              />
              <p className="text-xs text-gray-500 mt-1">Locked after creation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity Purchasing</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-600"
                value={product.minQuantity || 'Not set'}
                disabled
                title="This field cannot be edited after product creation"
              />
              <p className="text-xs text-gray-500 mt-1">Locked after creation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Amount</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-600"
                value={product.suggestedAmount || 'Not set'}
                disabled
                title="This field cannot be edited after product creation"
              />
              <p className="text-xs text-gray-500 mt-1">Locked after creation</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/supplier/products')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{saving ? 'Saving...' : 'Update Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
