'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from "@/components/ui/Card";
import { SalesChart, OrdersChart } from "@/components/charts/SalesChart";

interface DashboardStats {
  totalUsers: number;
  totalSuppliers: number;
  totalVendors: number;
  totalProducts: number;
  totalStores: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSuppliers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalStores: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchStats = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      hasFetched.current = false; // Reset on error to allow retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold text-indigo-600">{stats.totalUsers}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Suppliers</h3>
            <p className="text-2xl font-bold text-green-600">{stats.totalSuppliers}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Vendors</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalVendors}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.totalProducts}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Stores</h3>
            <p className="text-2xl font-bold text-orange-600">{stats.totalStores}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-2xl font-bold text-red-600">{stats.totalOrders}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue}</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/users"
              className="bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 text-center transition-colors"
            >
              Manage Users
            </a>
            <a
              href="/admin/products"
              className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 text-center transition-colors"
            >
              Manage Products
            </a>
            <a
              href="/admin/orders"
              className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 text-center transition-colors"
            >
              View Orders
            </a>
            <button
              onClick={async () => {
                if (confirm('This will seed sample catalog data. Continue?')) {
                  try {
                    const response = await fetch('/api/admin/seed-catalog', { method: 'POST' });
                    const data = await response.json();
                    if (response.ok) {
                      alert('Catalog initialized successfully!');
                      window.location.reload();
                    } else {
                      alert(data.error || 'Failed to initialize catalog');
                    }
                  } catch (error) {
                    alert('Error initializing catalog');
                  }
                }
              }}
              className="bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 text-center transition-colors"
            >
              Initialize Catalog
            </button>
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesChart />
        <OrdersChart />
      </div>
    </div>
  );
}
