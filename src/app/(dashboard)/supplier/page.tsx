'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { SalesChart, OrdersChart } from "@/components/charts/SalesChart";
import StripeStatusCard from '@/components/StripeStatusCard';

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalOrders: number;
  activeProducts: number;
}

interface SalesData {
  name: string;
  sales: number;
}

interface OrdersData {
  name: string;
  orders: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  business?: {
    stripeAccount?: {
      stripeAccountStatus?: string;
      stripePayoutsEnabled?: boolean;
      bankStatus?: string;
      stripeChargesEnabled?: boolean;
    };
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
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [ordersData, setOrdersData] = useState<OrdersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const hasFetchedStats = useRef(false);
  const hasFetchedUser = useRef(false);
  const hasFetchedCharts = useRef(false);

  const fetchStats = useCallback(async () => {
    if (hasFetchedStats.current) return;
    hasFetchedStats.current = true;
    
    try {
      const response = await fetch('/api/supplier/stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      hasFetchedStats.current = false;
    }
  }, []);

  const fetchUser = useCallback(async () => {
    if (hasFetchedUser.current) return;
    hasFetchedUser.current = true;
    
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      // Handle both { user: ... } and direct user object formats
      setUser(data.user || data);
    } catch (error) {
      console.error('Error fetching user:', error);
      hasFetchedUser.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSalesOrders = useCallback(async () => {
    if (hasFetchedCharts.current) return;
    hasFetchedCharts.current = true;
    
    try {
      const response = await fetch('/api/supplier/dashboard/sales-orders');
      if (response.ok) {
        const data = await response.json();
        setSalesData(data.sales || []);
        setOrdersData(data.orders || []);
      } else {
        console.error('Error fetching sales/orders data:', response.statusText);
        hasFetchedCharts.current = false;
      }
    } catch (error) {
      console.error('Error fetching sales/orders data:', error);
      hasFetchedCharts.current = false;
    } finally {
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUser();
    fetchSalesOrders();
  }, [fetchStats, fetchUser, fetchSalesOrders]);

  if (loading) {
    return <Loading message="Loading dashboard..." />;
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
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <SalesChart data={salesData} loading={chartsLoading} />
        <OrdersChart data={ordersData} loading={chartsLoading} />
      </div>

      {/* Stripe Status */}
      {user && (
        <div className="mt-6">
          <StripeStatusCard user={user} showDetails={true} />
        </div>
      )}
    </div>
  );
}
