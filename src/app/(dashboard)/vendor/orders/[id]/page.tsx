'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProductImageSlider from '@/components/ProductImageSlider';
import OrderDetailCurrencyDisplay from '@/components/OrderDetailCurrencyDisplay';

interface OrderDetails {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    images: Array<{ url: string }>;
    supplier: {
      id: string;
      name: string;
      email: string;
    };
  };
  customer: {
    name: string;
    email: string;
  } | null;
  store: {
    id: string;
    name: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
  quantity: number;
  productPrice: number;
  markupAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  shippingAddress: any;
  billingAddress: any;
  notes: string;
  lockedUSDPrice?: number;
  lockedLocalPrice?: number;
  displayPrice?: number;
  displayCurrency?: string;
  settlementCurrency?: string;
  markupPercentage?: number;
  markupAmountInVendorCurrency?: number;
  markupType?: string;
  vendorCurrency?: string;
  supplierCurrency?: string;
}

export default function VendorOrderDetailsPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [userCurrency, setUserCurrency] = useState<string>('USD');
  const router = useRouter();

  const hasFetchedOrder = useRef<string>('');
  const hasFetchedCurrency = useRef(false);

  const fetchUserCurrency = useCallback(async () => {
    if (hasFetchedCurrency.current) return;
    hasFetchedCurrency.current = true;
    
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUserCurrency(userData.business?.preferredCurrency || 'USD');
      }
    } catch (error) {
      console.error('Error fetching user currency:', error);
      hasFetchedCurrency.current = false;
    }
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    if (hasFetchedOrder.current === params.id) return;
    hasFetchedOrder.current = params.id;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor/orders/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found');
        } else if (response.status === 403) {
          setError('You are not authorized to view this order');
        } else {
          setError('Failed to fetch order details');
        }
        hasFetchedOrder.current = ''; // Reset on error
        return;
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to fetch order details');
      hasFetchedOrder.current = ''; // Reset on error
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrderDetails();
    fetchUserCurrency();
  }, [fetchOrderDetails, fetchUserCurrency]);

  const updateOrderStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/vendor/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh order details
        await fetchOrderDetails();
        alert('Order status updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
              >
                ← Back to Orders
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600 mt-2">Order #{order.id.slice(-8)}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{formatDate(order.createdAt)}</span>
                </div>
                {order.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notes:</span>
                    <span className="font-medium text-right max-w-xs">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Product Details</h2>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {order.product.images && order.product.images.length > 0 ? (
                    <ProductImageSlider
                      images={((order.product.images as any[]) || []).map((img: any, index: number) => ({
                        id: img.id || `img-${index}`,
                        url: img.url,
                        isMain: img.isMain || index === 0,
                        order: img.order || index,
                        alt: img.alt || order.product.name
                      }))}
                      productName={order.product.name}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{order.product.name}</h3>
                  {order.product.description && (
                    <p className="text-gray-600 mt-2">{order.product.description}</p>
                  )}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{order.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Price (per unit):</span>
                      <span className="font-bold text-gray-900">{formatCurrency(order.productPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Markup (per unit):</span>
                      <span className="font-bold text-gray-900">{formatCurrency(order.markupAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer Price (per unit):</span>
                      <span className="font-bold text-gray-900">{formatCurrency(order.productPrice + order.markupAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <p className="text-gray-900">
                    {order.customer ? order.customer.name : 'Guest Customer'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.customer ? order.customer.email : 'N/A (Guest)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Store Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Store Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Store</label>
                  <p className="text-gray-900">{order.store.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor</label>
                  <p className="text-gray-900">{order.store.owner.name}</p>
                  <p className="text-sm text-gray-600">{order.store.owner.email}</p>
                </div>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Supplier Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier</label>
                  <p className="text-gray-900">{order.product.supplier.name}</p>
                  <p className="text-sm text-gray-600">{order.product.supplier.email}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                <div className="space-y-2">
                  <p className="text-gray-900">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-gray-900">{order.shippingAddress.address}</p>
                  <p className="text-gray-900">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-900">{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="text-gray-600">Phone: {order.shippingAddress.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Billing Address */}
            {order.billingAddress && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Billing Address</h2>
                <div className="space-y-2">
                  <p className="text-gray-900">
                    {order.billingAddress.firstName} {order.billingAddress.lastName}
                  </p>
                  <p className="text-gray-900">{order.billingAddress.address}</p>
                  <p className="text-gray-900">
                    {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
                  </p>
                  <p className="text-gray-900">{order.billingAddress.country}</p>
                  {order.billingAddress.phone && (
                    <p className="text-gray-600">Phone: {order.billingAddress.phone}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Pricing Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Price:</span>
                  <OrderDetailCurrencyDisplay
                    userRole="VENDOR_USER"
                    userPreferredCurrency={userCurrency}
                    amount={order.productPrice * order.quantity}
                    showSecondary={true}
                    className="text-right"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Markup:</span>
                  <div className="text-right">
                    {order.markupAmountInVendorCurrency && order.vendorCurrency && order.vendorCurrency !== 'USD' ? (
                      <>
                        <div className="font-medium">
                          {(order.markupAmountInVendorCurrency * order.quantity).toFixed(2)} {order.vendorCurrency}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${(order.markupAmount * order.quantity).toFixed(2)} USD
                          {order.markupType === 'percentage' && order.markupPercentage && (
                            <span className="ml-2">({order.markupPercentage}%)</span>
                          )}
                          {order.markupType === 'fixed' && (
                            <span className="ml-2">(Fixed)</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="font-medium">${(order.markupAmount * order.quantity).toFixed(2)} USD</div>
                    )}
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <OrderDetailCurrencyDisplay
                      userRole="VENDOR_USER"
                      userPreferredCurrency={userCurrency}
                      amount={(order.productPrice + order.markupAmount) * order.quantity}
                      showSecondary={true}
                      className="text-right"
                    />
                  </div>
                </div>
                
                {/* Currency Reference Information */}
                <div className="border-t pt-3 mt-3">
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Your Currency:</span>
                      <span>{userCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supplier Currency:</span>
                      <span>{order.supplierCurrency || 'USD'}</span>
                    </div>
                    {order.markupType && (
                      <div className="flex justify-between">
                        <span>Markup Type:</span>
                        <span className="capitalize">{order.markupType}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Update Status</h2>
              <div className="space-y-2">
                {['CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(status)}
                    disabled={updating || order.status === status}
                    className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      order.status === status
                        ? 'bg-red-600 text-white cursor-not-allowed'
                        : 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50'
                    }`}
                  >
                    {updating ? 'Updating...' : status}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Vendors can only cancel orders. Status updates are handled by suppliers.
              </p>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Order Notes</h2>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
