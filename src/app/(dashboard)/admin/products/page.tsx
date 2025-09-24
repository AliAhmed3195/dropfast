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
  featured: boolean;
  markup: number;
  hostedLink: string;
  createdAt: string;
  totalSales?: number;
  orders?: Array<{
    id: string;
    quantity: number;
    createdAt: string;
  }>;
  supplier: {
    id: string;
    name: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
    owner: {
      name: string;
    };
  } | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, inactive, featured, best-selling, new-arrivals, with-store, without-store
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeaturedManager, setShowFeaturedManager] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update product status');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Failed to update product status');
    }
  };

  const toggleFeaturedStatus = async (productId: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featured: !currentFeatured }),
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update featured status');
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      alert('Failed to update featured status');
    }
  };

  const handleBulkFeaturedAction = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }

    if (!bulkAction) {
      alert('Please select an action');
      return;
    }

    const featured = bulkAction === 'add-featured';
    
    try {
      const promises = selectedProducts.map(productId => 
        fetch(`/api/admin/products/${productId}/featured`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ featured }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(result => !result.ok);
      
      if (failed.length === 0) {
        alert(`Successfully ${featured ? 'added' : 'removed'} ${selectedProducts.length} products ${featured ? 'to' : 'from'} featured`);
        setSelectedProducts([]);
        setBulkAction('');
        fetchProducts();
      } else {
        alert(`Failed to update ${failed.length} products`);
      }
    } catch (error) {
      console.error('Error in bulk featured action:', error);
      alert('Failed to perform bulk action');
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
        if (selectedProduct?.id === productId) {
          setSelectedProduct(null);
          setShowDetails(false);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'active':
        return matchesSearch && product.isActive;
      case 'inactive':
        return matchesSearch && !product.isActive;
      case 'featured':
        return matchesSearch && product.featured;
      case 'best-selling':
        return matchesSearch && (product.totalSales || 0) > 0;
      case 'new-arrivals':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return matchesSearch && new Date(product.createdAt) >= thirtyDaysAgo;
      case 'with-store':
        return matchesSearch && product.store;
      case 'without-store':
        return matchesSearch && !product.store;
      default:
        return matchesSearch;
    }
  }).sort((a, b) => {
    // Sort best selling products by sales count (descending)
    if (filter === 'best-selling') {
      return (b.totalSales || 0) - (a.totalSales || 0);
    }
    // Sort new arrivals by creation date (descending)
    if (filter === 'new-arrivals') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Total Products: {products.length} | Filtered: {filteredProducts.length}
          </div>
          <div className="flex items-center space-x-2">
            {selectedProducts.length > 0 && (
              <button
                onClick={() => {
                  setBulkAction('add-featured');
                  handleBulkFeaturedAction();
                }}
                className="bg-yellow-500 text-white px-3 py-2 rounded-md hover:bg-yellow-600 flex items-center space-x-1 text-sm"
              >
                <span>⭐</span>
                <span>Add {selectedProducts.length} to Featured</span>
              </button>
            )}
            <button
              onClick={() => setShowFeaturedManager(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 flex items-center space-x-2"
            >
              <span>⭐</span>
              <span>Manage Featured Products</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name, supplier, or category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Products
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Products</option>
                <option value="active">Active Products</option>
                <option value="inactive">Inactive Products</option>
                <option value="featured">Featured Products</option>
                <option value="best-selling">🏆 Best Selling Products</option>
                <option value="new-arrivals">🆕 New Arrivals (Last 30 Days)</option>
                <option value="with-store">Products in Stores</option>
                <option value="without-store">Products Not in Stores</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store/Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleProductSelect(product.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-md mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.supplier.name}</div>
                    <div className="text-sm text-gray-500">{product.supplier.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${product.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Markup: {product.markup}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.totalSales || 0} sold
                    </div>
                    <div className="text-xs text-gray-500">
                      Revenue: ${((product.totalSales || 0) * product.price).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.store ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.store.name}</div>
                        <div className="text-sm text-gray-500">{product.store.owner.name}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not in store</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                    <button
                      onClick={() => toggleProductStatus(product.id, product.isActive)}
                      className={`px-2 py-1 text-xs rounded-md ${
                        product.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {!product.featured ? (
                      <button
                        onClick={() => toggleFeaturedStatus(product.id, false)}
                        className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        ⭐ Add Featured
                      </button>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-700">
                        ⭐ Featured
                      </span>
                    )}
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowDetails(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50"
                      title="View Details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card className="mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-800">
                  {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => {
                    setBulkAction('add-featured');
                    handleBulkFeaturedAction();
                  }}
                  className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center space-x-1"
                >
                  <span>⭐</span>
                  <span>Add to Featured</span>
                </button>
                <button
                  onClick={() => {
                    setBulkAction('remove-featured');
                    handleBulkFeaturedAction();
                  }}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center space-x-1"
                >
                  <span>❌</span>
                  <span>Remove from Featured</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedProducts([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </Card>
      )}

      {filteredProducts.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">
            {searchTerm || filter !== 'all' 
              ? 'No products match your search criteria.' 
              : 'No products found.'}
          </p>
        </Card>
      )}

      {/* Product Details Modal */}
      {showDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Product Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900">{selectedProduct.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="text-gray-900">{selectedProduct.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <p className="text-gray-900">${selectedProduct.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Markup</label>
                      <p className="text-gray-900">{selectedProduct.markup}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedProduct.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedProduct.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Featured</label>
                      <button
                        onClick={() => toggleFeaturedStatus(selectedProduct.id, selectedProduct.featured)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          selectedProduct.featured
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {selectedProduct.featured ? '⭐ Featured' : 'Add to Featured'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Supplier & Store Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Supplier & Store Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier</label>
                      <p className="text-gray-900">{selectedProduct.supplier.name}</p>
                      <p className="text-sm text-gray-600">{selectedProduct.supplier.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Store</label>
                      {selectedProduct.store ? (
                        <div>
                          <p className="text-gray-900">{selectedProduct.store.name}</p>
                          <p className="text-sm text-gray-600">Owner: {selectedProduct.store.owner.name}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">Not in any store</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hosted Link</label>
                      {selectedProduct.hostedLink ? (
                        <a
                          href={selectedProduct.hostedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm break-all"
                        >
                          {selectedProduct.hostedLink}
                        </a>
                      ) : (
                        <p className="text-gray-500">No hosted link</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="text-gray-900">{new Date(selectedProduct.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProduct.image && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Product Image</h3>
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full max-w-md h-64 object-cover rounded-md"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => toggleProductStatus(selectedProduct.id, selectedProduct.isActive)}
                  className={`px-4 py-2 rounded-md text-white ${
                    selectedProduct.isActive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {selectedProduct.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteProduct(selectedProduct.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Products Manager Modal */}
      {showFeaturedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">⭐ Featured Products Manager</h2>
                  <p className="text-gray-600 mt-1">Manage which products are featured on the vendor page</p>
                </div>
                <button
                  onClick={() => setShowFeaturedManager(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Featured Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-800">
                    ⭐ Currently Featured ({products.filter(p => p.featured).length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {products.filter(p => p.featured).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {product.image && (
                            <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.supplier.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFeaturedStatus(product.id, true)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {products.filter(p => p.featured).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No featured products yet</p>
                    )}
                  </div>
                </div>

                {/* Available Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-800">
                    📦 Available Products ({products.filter(p => !p.featured).length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {products.filter(p => !p.featured).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {product.image && (
                            <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.supplier.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFeaturedStatus(product.id, false)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                        >
                          Add to Featured
                        </button>
                      </div>
                    ))}
                    {products.filter(p => !p.featured).length === 0 && (
                      <p className="text-gray-500 text-center py-4">All products are featured</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowFeaturedManager(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
