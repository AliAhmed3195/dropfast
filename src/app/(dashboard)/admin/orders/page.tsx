'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import ProductImageSlider from '@/components/ProductImageSlider';

interface Order {
  id: string;
  quantity: number;
  productPrice: number;
  markupAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  product: {
    name: string;
    image: string;
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
  };
  customer: {
    name: string;
    email: string;
  };
  store: {
    name: string;
    owner: {
      name: string;
    };
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, paid, shipped, delivered, cancelled
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-purple-100 text-purple-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.store.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && order.status === filter;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="text-sm text-gray-600">
          Total Orders: {orders.length} | Filtered: {filteredOrders.length}
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Orders
              </label>
              <input
                type="text"
                placeholder="Search by product, customer, or store..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Orders</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store/Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 mr-3">
                        <ProductImageSlider
                          images={order.product.images || []}
                          fallbackImage={order.product.image}
                          productName={order.product.name}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.product.name}</div>
                        <div className="text-sm text-gray-500">Qty: {order.quantity}</div>
                        <div className="text-xs text-gray-400">#{order.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.store.name}</div>
                      <div className="text-sm text-gray-500">{order.store.owner.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.product.supplier.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${order.totalAmount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      Profit: ${order.markupAmount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
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

      {filteredOrders.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">
            {searchTerm || filter !== 'all' 
              ? 'No orders match your search criteria.' 
              : 'No orders found.'}
          </p>
        </Card>
      )}

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Order Details</h2>
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
                {/* Order Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order ID</label>
                      <p className="text-gray-900">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <p className="text-gray-900">{selectedOrder.quantity}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                      <p className="text-gray-900 font-semibold">${selectedOrder.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order Date</label>
                      <p className="text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Customer & Store Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer & Store Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer</label>
                      <p className="text-gray-900">{selectedOrder.customer.name}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.customer.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Store</label>
                      <p className="text-gray-900">{selectedOrder.store.name}</p>
                      <p className="text-sm text-gray-600">Vendor: {selectedOrder.store.owner.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier</label>
                      <p className="text-gray-900">{selectedOrder.product.supplier.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-24">
                    <ProductImageSlider
                      images={selectedOrder.product.images || []}
                      fallbackImage={selectedOrder.product.image}
                      productName={selectedOrder.product.name}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedOrder.product.name}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Supplier Price:</span> ${selectedOrder.productPrice.toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Vendor Markup:</span> ${selectedOrder.markupAmount.toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Customer Paid:</span> ${selectedOrder.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        selectedOrder.status === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
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
