'use client';

import { useState, useEffect } from 'react';
import { orderCurrencyService, OrderCurrencyDisplay } from '@/lib/order-currency-service';

interface OrderCurrencyDisplayProps {
  userRole: 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER';
  userPreferredCurrency?: string;
  orderTotalAmount: number;
  orderDisplayCurrency?: string;
  orderLockedUSDPrice?: number;
  showSecondary?: boolean;
  className?: string;
}

export default function OrderCurrencyDisplay({
  userRole,
  userPreferredCurrency,
  orderTotalAmount,
  orderDisplayCurrency,
  orderLockedUSDPrice,
  showSecondary = true,
  className = ''
}: OrderCurrencyDisplayProps) {
  const [currencyDisplay, setCurrencyDisplay] = useState<OrderCurrencyDisplay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrencyDisplay = async () => {
      try {
        setLoading(true);
        const display = await orderCurrencyService.getOrderCurrencyDisplay({
          userRole,
          userPreferredCurrency,
          orderTotalAmount,
          orderDisplayCurrency,
          orderLockedUSDPrice
        });
        setCurrencyDisplay(display);
      } catch (error) {
        console.error('Error fetching currency display:', error);
        // Fallback to USD
        setCurrencyDisplay({
          primaryAmount: orderLockedUSDPrice || orderTotalAmount,
          primaryCurrency: 'USD',
          rateSource: 'fallback'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyDisplay();
  }, [userRole, userPreferredCurrency, orderTotalAmount, orderDisplayCurrency, orderLockedUSDPrice]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  if (!currencyDisplay) {
    return (
      <div className={`text-gray-500 ${className}`}>
        ${(orderLockedUSDPrice || orderTotalAmount).toFixed(2)} USD
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string) => {
    return orderCurrencyService.formatCurrency(amount, currency);
  };

  return (
    <div className={className}>
      {/* USD Amount (Always Bold and Primary) */}
      <div className="text-sm font-bold text-gray-900">
        {formatAmount(currencyDisplay.secondaryAmount || currencyDisplay.primaryAmount, 'USD')}
      </div>

      {/* Local Currency Amount (Below, Highlighted) */}
      {showSecondary && currencyDisplay.primaryCurrency !== 'USD' && (
        <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded mt-1 inline-block">
          {formatAmount(currencyDisplay.primaryAmount, currencyDisplay.primaryCurrency)}
        </div>
      )}

      {/* Exchange Rate Info */}
      {currencyDisplay.exchangeRate && currencyDisplay.rateSource && (
        <div className="text-xs text-gray-400">
          Rate: {currencyDisplay.exchangeRate.toFixed(4)} ({currencyDisplay.rateSource})
        </div>
      )}
    </div>
  );
}
