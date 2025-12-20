'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  };
  quantity: number;
  totalAmount: number;
  lockedUSDPrice?: number;
  status: string;
  displayCurrency: string;
  createdAt: string;
  statusHistory: Array<{
    id: string;
    status: string;
    reason: string;
    changedAt: string;
    notes: string;
  }>;
}

interface PendingApprovalOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function PendingApprovalOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const lastFetchParams = useRef<string>('');

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '10',
      search: searchQuery
    });
    const paramsString = params.toString();
    
    // Prevent duplicate calls with same parameters
    if (lastFetchParams.current === paramsString && orders.length > 0) return;
    lastFetchParams.current = paramsString;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor/orders/pending-approval?${params}`);
      const data: PendingApprovalOrdersResponse = await response.json();

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
  }, [currentPage, searchQuery, orders.length]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleApprove = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      const response = await fetch('/api/vendor/orders/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          notes: 'Order approved by vendor'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Remove the approved order from the list
        setOrders(orders.filter(order => order.id !== orderId));
        alert('Order approved successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Error approving order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(orderId);
      const response = await fetch('/api/vendor/orders/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          reason: rejectionReason,
          notes: rejectionNotes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Remove the rejected order from the list
        setOrders(orders.filter(order => order.id !== orderId));
        setRejectionReason('');
        setRejectionNotes('');
        setSelectedOrderId(null);
        alert('Order rejected successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Error rejecting order');
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
      case 'PENDING_VENDOR_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'AWAITING_SUPPLIER_CONFIRMATION':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pending Approval Orders</h1>
          <p className="mt-2 text-gray-600">
            Review and approve orders before they are forwarded to suppliers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search orders by ID, customer name, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No pending approval orders found</div>
            <p className="text-gray-400 mt-2">
              {searchQuery ? 'Try adjusting your search criteria' : 'All orders have been processed'}
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
                          Customer: {order.customer?.name || 'Guest Customer'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Email: {order.customer?.email || 'N/A (Guest)'}
                        </p>
                      </div>

                      <div>
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

                    {/* Status History */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Status History</h4>
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
                      onClick={() => handleApprove(order.id)}
                      disabled={actionLoading === order.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === order.id ? 'Approving...' : 'Approve'}
                    </button>

                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => router.push(`/vendor/orders/${order.id}`)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      View Details
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

        {/* Rejection Modal */}
        {selectedOrderId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Reject Order</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Rejection *
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select a reason</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Invalid Address">Invalid Address</option>
                    <option value="Suspicious Order">Suspicious Order</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Customer Request">Customer Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Optional additional details..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedOrderId(null);
                    setRejectionReason('');
                    setRejectionNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedOrderId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
