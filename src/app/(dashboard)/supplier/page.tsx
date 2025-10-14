'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/Card";
import { SalesChart, OrdersChart } from "@/components/charts/SalesChart";
import StripeStatusCard from '@/components/StripeStatusCard';

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalOrders: number;
  activeProducts: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  business?: {
    stripeAccountStatus?: string;
    stripePayoutsEnabled?: boolean;
    bankStatus?: string;
    stripeChargesEnabled?: boolean;
  };
}

export default function SupplierDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    totalOrders: 0,
    activeProducts: 0,
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchUser();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/supplier/stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
        <p className="text-gray-600">Manage your products and track sales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats.totalProducts}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Active Products</h3>
          <p className="text-2xl font-bold text-green-600">{stats.activeProducts}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
          <p className="text-2xl font-bold text-blue-600">${stats.totalSales}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.totalOrders}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl mb-2">My Sales</h2>
          <SalesChart />
        </Card>
        <Card>
          <h2 className="text-xl mb-2">Orders</h2>
          <OrdersChart />
        </Card>
      </div>

      {/* Stripe Status */}
      {user && (
        <div className="mb-6">
          <StripeStatusCard user={user} showDetails={true} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6">
        <Card>
          <h2 className="text-xl mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="/supplier/products"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Manage Products
            </a>
            <a
              href="/supplier/products"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Add New Product
            </a>
            <a
              href="/supplier/orders"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Orders
            </a>
            <a
              href="/supplier/onboarding"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Stripe Onboarding
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
