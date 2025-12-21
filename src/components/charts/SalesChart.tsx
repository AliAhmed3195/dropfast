'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SalesData {
  name: string;
  sales: number;
}

export function SalesChart() {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      const response = await fetch('/api/admin/dashboard/sales-orders');
      if (response.ok) {
        const result = await response.json();
        setData(result.sales || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchData();
    }
  }, [isClient, fetchData]);

  if (!isClient || loading) {
    return (
      <div className="w-full h-[300px] bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-lg font-semibold text-gray-900 mb-2">Sales Overview</div>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 text-sm">No sales data available</div>
        </div>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{payload[0].payload.name}</p>
          <p className="text-sm text-blue-600 font-semibold">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Color gradient for bars
  const colors = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'];

  return (
    <div className="w-full h-[300px] bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
        <p className="text-sm text-gray-500">Last 6 months revenue</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="sales" 
            radius={[8, 8, 0, 0]}
            fill="#3b82f6"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface OrdersData {
  name: string;
  orders: number;
}

export function OrdersChart() {
  const [data, setData] = useState<OrdersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      const response = await fetch('/api/admin/dashboard/sales-orders');
      if (response.ok) {
        const result = await response.json();
        setData(result.orders || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching orders data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchData();
    }
  }, [isClient, fetchData]);

  if (!isClient || loading) {
    return (
      <div className="w-full h-[300px] bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-lg font-semibold text-gray-900 mb-2">Orders Overview</div>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 text-sm">No orders data available</div>
        </div>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{payload[0].payload.name}</p>
          <p className="text-sm text-green-600 font-semibold">
            {payload[0].value} {payload[0].value === 1 ? 'order' : 'orders'}
          </p>
        </div>
      );
    }
    return null;
  };

  // Color gradient for bars
  const colors = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#022c22'];

  return (
    <div className="w-full h-[300px] bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Orders Overview</h3>
        <p className="text-sm text-gray-500">Last 6 months order count</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="orders" 
            radius={[8, 8, 0, 0]}
            fill="#10b981"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
