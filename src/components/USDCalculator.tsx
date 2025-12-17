'use client';

import { useState, useEffect } from 'react';

interface USDCalculatorProps {
  localAmount: number;
  localCurrency: string;
  onUSDCalculated: (usdAmount: number) => void;
  className?: string;
}

export default function USDCalculator({ 
  localAmount, 
  localCurrency, 
  onUSDCalculated, 
  className = '' 
}: USDCalculatorProps) {
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (localAmount > 0 && localCurrency !== 'USD') {
      convertToUSD();
    } else if (localCurrency === 'USD') {
      setUsdAmount(localAmount);
      setExchangeRate(1);
      onUSDCalculated(localAmount);
    }
  }, [localAmount, localCurrency]);

  const convertToUSD = async () => {
    if (localCurrency === 'USD') {
      setUsdAmount(localAmount);
      setExchangeRate(1);
      onUSDCalculated(localAmount);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/currency/convert?from=${localCurrency}&to=USD&amount=${localAmount}`);
      
      if (response.ok) {
        const data = await response.json();
        const convertedAmount = data.convertedAmount;
        const rate = data.exchangeRate;
        
        setUsdAmount(convertedAmount);
        setExchangeRate(rate);
        onUSDCalculated(convertedAmount);
      } else {
        // Use fallback rates
        const fallbackRates: { [key: string]: number } = {
          'EUR': 0.85,
          'GBP': 0.73,
          'PKR': 280.0,
          'CAD': 1.35,
          'AUD': 1.50,
          'JPY': 150.0,
          'INR': 83.0,
          'AED': 3.67,
          'SAR': 3.75,
          'MYR': 4.20,
        };
        
        const fallbackRate = fallbackRates[localCurrency] || 1;
        const convertedAmount = localAmount / fallbackRate;
        
        setUsdAmount(convertedAmount);
        setExchangeRate(fallbackRate);
        onUSDCalculated(convertedAmount);
        setError('Using fallback exchange rate');
      }
    } catch (error) {
      console.error('Currency conversion error:', error);
      setError('Failed to convert currency');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'PKR': '₨',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'INR': '₹',
      'AED': 'د.إ',
      'SAR': '﷼',
      'MYR': 'RM',
    };
    return symbols[currency] || currency;
  };

  if (localCurrency === 'USD') {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Price in USD
            </h3>
            <div className="mt-1 text-sm text-green-700">
              <p className="font-semibold">${localAmount.toFixed(2)} USD</p>
              <p className="text-xs">Your price is already in USD</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            USD Conversion
          </h3>
          <div className="mt-1 text-sm text-blue-700">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-xs text-gray-500">Your Price:</p>
                <p className="font-medium">{getCurrencySymbol(localCurrency)}{localAmount.toFixed(2)} {localCurrency}</p>
              </div>
              <div className="text-gray-400">→</div>
              <div>
                <p className="text-xs text-gray-500">USD Price:</p>
                <p className="font-semibold text-green-600">${usdAmount.toFixed(2)} USD</p>
              </div>
            </div>
            {exchangeRate !== 1 && (
              <p className="text-xs text-gray-500 mt-1">
                Exchange Rate: 1 {localCurrency} = ${(1/exchangeRate).toFixed(4)} USD
              </p>
            )}
            {error && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
