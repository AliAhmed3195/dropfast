'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isActive: boolean;
  variants?: Array<{
    id: string;
    name: string;
    value: string;
    priceModifier: number;
  }>;
  createdAt: string;
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
  });
  const [variants, setVariants] = useState<Array<{name: string, value: string, priceModifier: string}>>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
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
        setNewProduct({ ...newProduct, image: data.fileUrl });
        return data.fileUrl;
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
      await handleFileUpload(file);
    }
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
          variants: variants.filter(v => v.name && v.value)
        }),
      });

      if (response.ok) {
        setNewProduct({
          name: '',
          description: '',
          price: '',
          image: '',
          category: '',
        });
        setVariants([]);
        setSelectedFile(null);
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


  if (loading) {
    return <div className="p-6">Loading...</div>;
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image
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
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Uploading image...
                  </div>
                )}
                {newProduct.image && (
                  <div className="mt-2">
                    <img
                      src={newProduct.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                    <p className="text-xs text-gray-500 mt-1">Image uploaded successfully</p>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Supported formats: JPEG, PNG, WebP (Max 5MB)
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{product.description}</p>
            <p className="text-lg font-bold text-indigo-600 mb-2">${product.price}</p>
            <p className="text-sm text-gray-500 mb-2">Category: {product.category}</p>
            
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
