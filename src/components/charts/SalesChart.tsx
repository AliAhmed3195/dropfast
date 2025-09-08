'use client';

import { useState, useEffect } from 'react';

const data = [
  { name: 'Jan', sales: 4000, orders: 24 },
  { name: 'Feb', sales: 3000, orders: 18 },
  { name: 'Mar', sales: 5000, orders: 32 },
  { name: 'Apr', sales: 2780, orders: 22 },
  { name: 'May', sales: 4890, orders: 30 },
  { name: 'Jun', sales: 6390, orders: 35 },
];

export function SalesChart() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[200px] bg-white rounded-lg p-4">
      <div className="text-sm font-medium text-gray-700 mb-4">Sales Overview</div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{item.name}</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(item.sales / 7000) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">${item.sales.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrdersChart() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[200px] bg-white rounded-lg p-4">
      <div className="text-sm font-medium text-gray-700 mb-4">Orders Overview</div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{item.name}</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(item.orders / 40) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">{item.orders}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
