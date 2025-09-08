'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

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
  };
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/vendor/orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Sales</h1>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {order.product.image && (
                  <img
                    src={order.product.image}
                    alt={order.product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{order.product.name}</h3>
                  <p className="text-sm text-gray-600">Order ID: {order.id}</p>
                  <p className="text-sm text-gray-600">Customer: {order.customer.name}</p>
                  <p className="text-sm text-gray-600">Email: {order.customer.email}</p>
                  <p className="text-sm text-gray-600">Store: {order.store.name}</p>
                  <p className="text-sm text-gray-600">Supplier: {order.product.supplier.name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Quantity:</span> {order.quantity}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Your Profit:</span> ${order.markupAmount.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Total Sale:</span> ${order.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Supplier Revenue:</span> ${order.productPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card>
          <p className="text-center text-gray-500">No sales yet. Start by importing products and generating hosted links!</p>
        </Card>
      )}
    </div>
  );
}
