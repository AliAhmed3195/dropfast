'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/Loading';
import ProductImageSlider from '@/components/ProductImageSlider';

interface Order {
  id: string;
  product: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
    supplier: {
      id: string;
      name: string;
      email: string;
    };
  };
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
  store: {
    id: string;
    name: string;
    slug: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
  quantity: number;
  totalAmount: number;
  lockedUSDPrice?: number;
  displayCurrency: string;
  status: string;
  requiresVendorApproval: boolean;
  vendorApprovedAt: string | null;
  vendorRejectedAt: string | null;
  vendorRejectionReason: string | null;
  createdAt: string;
  statusHistory: Array<{
    id: string;
    status: string;
    reason: string;
    changedAt: string;
    notes: string;
  }>;
}

interface AdminOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminOrderManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [overrideAction, setOverrideAction] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');

  const lastFetchParams = useRef<string>('');

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '10',
      search: searchQuery,
      status: statusFilter === 'all' ? '' : statusFilter
    });
    const paramsString = params.toString();
    
    // Prevent duplicate calls with same parameters
    if (lastFetchParams.current === paramsString && orders.length > 0) return;
    lastFetchParams.current = paramsString;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders?${params}`);
      const data: AdminOrdersResponse = await response.json();

      if (response.ok) {
        setOrders(data.orders);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Error fetching orders:', data);
        lastFetchParams.current = ''; // Reset on error
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      lastFetchParams.current = ''; // Reset on error
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, orders.length]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAdminOverride = async (orderId: string) => {
    if (!overrideAction) {
      alert('Please select an action');
      return;
    }

    try {
      setActionLoading(orderId);
      const response = await fetch(`/api/admin/orders/${orderId}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: overrideAction,
          reason: overrideReason,
          notes: overrideNotes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: data.order.status }
            : order
        ));
        setSelectedOrder(null);
        setOverrideAction('');
        setOverrideReason('');
        setOverrideNotes('');
        alert(`Order ${overrideAction}ed successfully!`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error performing admin override:', error);
      alert('Error performing admin override');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING_VENDOR_APPROVAL': return 'bg-orange-100 text-orange-800';
      case 'AWAITING_SUPPLIER_CONFIRMATION': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PACKED': return 'bg-purple-100 text-purple-800';
      case 'HANDED_TO_COURIER': return 'bg-indigo-100 text-indigo-800';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverrideActions = (status: string) => {
    switch (status) {
      case 'PENDING_VENDOR_APPROVAL':
        return ['approve', 'reject', 'hold'];
      case 'AWAITING_SUPPLIER_CONFIRMATION':
      case 'CONFIRMED':
      case 'PACKED':
      case 'HANDED_TO_COURIER':
      case 'SHIPPED':
        return ['cancel', 'hold', 'force_deliver'];
      case 'PENDING':
        return ['approve', 'cancel'];
      default:
        return [];
    }
  };

  if (loading) {
    return <Loading message="Loading order management..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-2 text-gray-600">
            Admin override and order management system
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search orders by ID, customer, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PENDING_VENDOR_APPROVAL">Pending Vendor Approval</option>
                <option value="AWAITING_SUPPLIER_CONFIRMATION">Awaiting Supplier Confirmation</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PACKED">Packed</option>
                <option value="HANDED_TO_COURIER">Handed to Courier</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No orders found</div>
            <p className="text-gray-400 mt-2">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search criteria' : 'No orders available'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Product Info */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-lg overflow-hidden">
                      <ProductImageSlider
                        images={((order.product.images as any[]) || []).map((img: any, index: number) => ({
                          id: img.id || `img-${index}`,
                          url: img.url,
                          isMain: img.isMain || index === 0,
                          order: img.order || index,
                          alt: img.alt || order.product.name
                        }))}
                        productName={order.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.product.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Order ID: {order.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          Supplier: {order.product.supplier.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Vendor: {order.store.owner.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Store: {order.store.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">
                          Customer: {order.customer?.name || 'Guest Customer'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Email: {order.customer?.email || 'N/A (Guest)'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantity: {order.quantity}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          Total: ${(order.lockedUSDPrice || order.totalAmount).toFixed(2)} USD
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {formatDate(order.createdAt)}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Approval Status */}
                    {order.requiresVendorApproval && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="text-sm font-medium text-orange-800 mb-1">
                          Vendor Approval Required
                        </h4>
                        {order.vendorApprovedAt ? (
                          <p className="text-sm text-orange-700">
                            Approved on {formatDate(order.vendorApprovedAt)}
                          </p>
                        ) : order.vendorRejectedAt ? (
                          <p className="text-sm text-red-700">
                            Rejected on {formatDate(order.vendorRejectedAt)}: {order.vendorRejectionReason}
                          </p>
                        ) : (
                          <p className="text-sm text-orange-700">
                            Awaiting vendor approval
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status History */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Status History</h4>
                        <div className="space-y-1">
                          {order.statusHistory.slice(0, 3).map((history) => (
                            <div key={history.id} className="text-xs text-gray-600">
                              <span className="font-medium">{history.status.replace(/_/g, ' ')}</span>
                              {history.reason && (
                                <span className="ml-2">- {history.reason}</span>
                              )}
                              <span className="ml-2 text-gray-400">
                                {formatDate(history.changedAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Admin Override
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Admin Override Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Admin Override</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID: {selectedOrder.id}
                  </label>
                  <p className="text-sm text-gray-600">
                    Current Status: {selectedOrder.status.replace(/_/g, ' ')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action *
                  </label>
                  <select
                    value={overrideAction}
                    onChange={(e) => setOverrideAction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select an action</option>
                    {getOverrideActions(selectedOrder.status).map(action => (
                      <option key={action} value={action}>
                        {action.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Reason for override..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={overrideNotes}
                    onChange={(e) => setOverrideNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setOverrideAction('');
                    setOverrideReason('');
                    setOverrideNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAdminOverride(selectedOrder.id)}
                  disabled={!overrideAction || actionLoading === selectedOrder.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedOrder.id ? 'Processing...' : 'Execute Override'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
