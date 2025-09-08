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
  markup: number;
  hostedLink: string;
  createdAt: string;
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
  const [filter, setFilter] = useState('all'); // all, active, inactive, with-store, without-store
  const [searchTerm, setSearchTerm] = useState('');

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
      case 'with-store':
        return matchesSearch && product.store;
      case 'without-store':
        return matchesSearch && !product.store;
      default:
        return matchesSearch;
    }
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <div className="text-sm text-gray-600">
          Total Products: {products.length} | Filtered: {filteredProducts.length}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => toggleProductStatus(product.id, product.isActive)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        product.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
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
    </div>
  );
}
