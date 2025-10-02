'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductImageSlider from '@/components/ProductImageSlider';

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
}

export default function OrderDetailsPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchOrderDetails();
  }, [params.orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/vendor/orders/${params.orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        setError('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    return `${address.firstName} ${address.lastName}\n${address.address}\n${address.city}, ${address.state} ${address.zipCode}\n${address.country}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-500 mb-4">{error || 'The order you are looking for does not exist.'}</p>
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600">Order ID: {order.id}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              ← Back to Orders
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Product Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="space-y-4">
              {order.product.images && order.product.images.length > 0 && (
                <div className="w-full h-64">
                  <ProductImageSlider
                    images={order.product.images}
                    productName={order.product.name}
                  />
                </div>
              )}
              <div>
                <h3 className="text-xl font-medium text-gray-900">{order.product.name}</h3>
                <p className="text-gray-600 mt-2">{order.product.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-gray-500">Supplier</p>
                  <p className="text-sm text-gray-900">{order.product.supplier.name}</p>
                  <p className="text-xs text-gray-500">{order.product.supplier.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Quantity</p>
                  <p className="text-sm text-gray-900">{order.quantity}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-sm text-gray-900">
                  {order.customer ? order.customer.name : 'Guest Customer'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">
                  {order.customer ? order.customer.email : 'N/A (Guest)'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Shipping Address</p>
                <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                  {formatAddress(order.shippingAddress)}
                </pre>
              </div>
              {order.billingAddress && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Billing Address</p>
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                    {formatAddress(order.billingAddress)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Order Date</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Order ID</span>
                <span className="text-sm font-mono text-gray-900">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Store</span>
                <span className="text-sm text-gray-900">{order.store.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Product Price (Supplier)</span>
                <span className="text-sm text-gray-900">${order.productPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Your Markup</span>
                <span className="text-sm text-gray-900">${order.markupAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quantity</span>
                <span className="text-sm text-gray-900">{order.quantity}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total Amount</span>
                  <span className="text-base font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Currency Information */}
          {(order.lockedUSDPrice || order.lockedLocalPrice || order.displayPrice) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Currency Information</h2>
              <div className="space-y-3">
                {order.lockedUSDPrice && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Locked USD Price</span>
                    <span className="text-sm text-gray-900">${order.lockedUSDPrice.toFixed(2)}</span>
                  </div>
                )}
                {order.lockedLocalPrice && order.displayCurrency && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Locked Local Price</span>
                    <span className="text-sm text-gray-900">
                      {order.displayCurrency} {order.lockedLocalPrice.toFixed(2)}
                    </span>
                  </div>
                )}
                {order.displayPrice && order.displayCurrency && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Display Price</span>
                    <span className="text-sm text-gray-900">
                      {order.displayCurrency} {order.displayPrice.toFixed(2)}
                    </span>
                  </div>
                )}
                {order.settlementCurrency && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Settlement Currency</span>
                    <span className="text-sm text-gray-900">{order.settlementCurrency}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
