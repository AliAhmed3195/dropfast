'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from "@/components/ui/Card";
import { SalesChart, OrdersChart } from "@/components/charts/SalesChart";
import { Loading } from "@/components/ui/Loading";

interface DashboardStats {
  totalUsers: number;
  totalSuppliers: number;
  totalVendors: number;
  totalProducts: number;
  totalStores: number;
  totalOrders: number;
  totalRevenue: number;
}

interface SalesData {
  name: string;
  sales: number;
}

interface OrdersData {
  name: string;
  orders: number;
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
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [ordersData, setOrdersData] = useState<OrdersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const hasFetched = useRef(false);
  const hasFetchedCharts = useRef(false);

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

  const fetchSalesOrders = useCallback(async () => {
    if (hasFetchedCharts.current) return;
    hasFetchedCharts.current = true;
    
    try {
      const response = await fetch('/api/admin/dashboard/sales-orders');
      if (response.ok) {
        const data = await response.json();
        setSalesData(data.sales || []);
        setOrdersData(data.orders || []);
      } else {
        console.error('Error fetching sales/orders data:', response.statusText);
        hasFetchedCharts.current = false; // Reset on error to allow retry
      }
    } catch (error) {
      console.error('Error fetching sales/orders data:', error);
      hasFetchedCharts.current = false; // Reset on error to allow retry
    } finally {
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchSalesOrders();
  }, [fetchStats, fetchSalesOrders]);

  if (loading) {
    return <Loading message="Loading dashboard..." />;
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

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesChart data={salesData} loading={chartsLoading} />
        <OrdersChart data={ordersData} loading={chartsLoading} />
      </div>
    </div>
  );
}
