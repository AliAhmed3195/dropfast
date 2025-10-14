'use client';

import { useState, useEffect } from 'react';
import { orderCurrencyService } from '@/lib/order-currency-service';

interface OrderDetailCurrencyDisplayProps {
  userRole: 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER';
  userPreferredCurrency?: string;
  amount: number;
  currency?: string;
  showSecondary?: boolean;
  showExchangeRate?: boolean;
  className?: string;
  label?: string;
}

export default function OrderDetailCurrencyDisplay({
  userRole,
  userPreferredCurrency,
  amount,
  currency = 'USD',
  showSecondary = true,
  showExchangeRate = false,
  className = '',
  label
}: OrderDetailCurrencyDisplayProps) {
  const [currencyDisplay, setCurrencyDisplay] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrencyDisplay = async () => {
      try {
        setLoading(true);
        
        // Admin always sees USD
        if (userRole === 'ADMIN') {
          setCurrencyDisplay({
            primaryAmount: amount,
            primaryCurrency: 'USD',
            rateSource: 'live'
          });
          setLoading(false);
          return;
        }

        // For vendors and suppliers, show their preferred currency + USD
        if (userRole === 'VENDOR_USER' || userRole === 'SUPPLIER_USER') {
          const preferredCurrency = userPreferredCurrency || 'USD';
          
          // If user's currency is USD, just show USD
          if (preferredCurrency === 'USD') {
            setCurrencyDisplay({
              primaryAmount: amount,
              primaryCurrency: 'USD',
              rateSource: 'live'
            });
            setLoading(false);
            return;
          }

          // Convert from USD to user's preferred currency
          const conversion = await orderCurrencyService.convertFromUSD(amount, preferredCurrency);

          setCurrencyDisplay({
            primaryAmount: conversion.amount,
            primaryCurrency: preferredCurrency,
            secondaryAmount: amount,
            secondaryCurrency: 'USD',
            exchangeRate: conversion.rate,
            rateSource: conversion.rateSource
          });
        }
      } catch (error) {
        console.error('Error fetching currency display:', error);
        // Fallback to USD
        setCurrencyDisplay({
          primaryAmount: amount,
          primaryCurrency: 'USD',
          rateSource: 'fallback'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyDisplay();
  }, [userRole, userPreferredCurrency, amount, currency]);

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
        ${amount.toFixed(2)} USD
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string) => {
    return orderCurrencyService.formatCurrency(amount, currency);
  };

  return (
    <div className={className}>
      {/* Primary Amount */}
      <div className="font-medium text-gray-900">
        {formatAmount(currencyDisplay.primaryAmount, currencyDisplay.primaryCurrency)}
        {currencyDisplay.primaryCurrency !== 'USD' && (
          <span className="text-sm text-gray-500 ml-1">
            {currencyDisplay.primaryCurrency}
          </span>
        )}
      </div>

      {/* Secondary Amount (USD) */}
      {showSecondary && currencyDisplay.secondaryAmount && currencyDisplay.secondaryCurrency && (
        <div className="text-sm text-gray-500">
          {formatAmount(currencyDisplay.secondaryAmount, currencyDisplay.secondaryCurrency)}
          {currencyDisplay.secondaryCurrency !== 'USD' && (
            <span className="ml-1">{currencyDisplay.secondaryCurrency}</span>
          )}
        </div>
      )}

      {/* Exchange Rate Info */}
      {showExchangeRate && currencyDisplay.exchangeRate && currencyDisplay.rateSource && (
        <div className="text-xs text-gray-400">
          Rate: {currencyDisplay.exchangeRate.toFixed(4)} ({currencyDisplay.rateSource})
        </div>
      )}
    </div>
  );
}
