'use client';

import { useState, useEffect } from 'react';

interface IPBasedCurrencyDisplayProps {
  usdAmount: number;
  showLocalCurrency?: boolean;
  showUSDBelow?: boolean;
  className?: string;
}

export default function IPBasedCurrencyDisplay({ 
  usdAmount, 
  showLocalCurrency = true, 
  showUSDBelow = false,
  className = '' 
}: IPBasedCurrencyDisplayProps) {
  const [localCurrency, setLocalCurrency] = useState<string>('USD');
  const [localAmount, setLocalAmount] = useState<number>(usdAmount);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (showLocalCurrency) {
      detectCurrencyAndConvert();
    }
  }, [usdAmount, showLocalCurrency]);

  const detectCurrencyAndConvert = async () => {
    setLoading(true);
    setError('');

    try {
      // First, detect user's currency based on IP
      const currencyResponse = await fetch(`/api/currency/detect?t=${Date.now()}`);
      
      if (currencyResponse.ok) {
        const currencyData = await currencyResponse.json();
        const detectedCurrency = currencyData.currency || 'USD';
        
        // Debug logging
        console.log('Currency detection result:', currencyData);
        console.log('Detected currency:', detectedCurrency);
        console.log('USD Amount:', usdAmount);
        
        setLocalCurrency(detectedCurrency);
        
        // If detected currency is USD, no conversion needed
        if (detectedCurrency === 'USD') {
          setLocalAmount(usdAmount);
          setExchangeRate(1);
          setLoading(false);
          return;
        }
        
        // Convert USD to detected currency
        const conversionResponse = await fetch(`/api/currency/convert?from=USD&to=${detectedCurrency}&amount=${usdAmount}`);
        
        if (conversionResponse.ok) {
          const conversionData = await conversionResponse.json();
          setLocalAmount(conversionData.convertedAmount);
          setExchangeRate(conversionData.exchangeRate);
        } else {
          // Use fallback rates
          useFallbackRates(detectedCurrency);
        }
      } else {
        // Use fallback detection
        useFallbackRates('USD');
      }
    } catch (error) {
      console.error('Currency detection error:', error);
      setError('Failed to detect currency');
      useFallbackRates('USD');
    } finally {
      setLoading(false);
    }
  };

  const useFallbackRates = (currency: string) => {
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
    
    const rate = fallbackRates[currency] || 1;
    const convertedAmount = usdAmount * rate;
    
    setLocalCurrency(currency);
    setLocalAmount(convertedAmount);
    setExchangeRate(rate);
    setError('Using estimated exchange rate');
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

  if (!showLocalCurrency || localCurrency === 'USD') {
    return (
      <span className={className}>
        ${usdAmount.toFixed(2)} USD
      </span>
    );
  }

  if (loading) {
    return (
      <span className={`${className} flex items-center space-x-2`}>
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading...</span>
      </span>
    );
  }

  if (showUSDBelow) {
    return (
      <div className={className}>
        <div className="flex flex-col">
          <span className="font-semibold">
            {getCurrencySymbol(localCurrency)}{localAmount.toFixed(2)} {localCurrency}
            {localCurrency !== 'USD' && (
              <span className="text-xs text-blue-500 ml-2">(IP Detected)</span>
            )}
          </span>
          <span className="text-sm text-gray-500 mt-1">
            ${usdAmount.toFixed(2)} USD
          </span>
        </div>
        {error && (
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <span className="font-semibold">
          {getCurrencySymbol(localCurrency)}{localAmount.toFixed(2)} {localCurrency}
        </span>
        <span className="text-gray-400">•</span>
        <span className="text-sm text-gray-500">
          ${usdAmount.toFixed(2)} USD
        </span>
      </div>
      {error && (
        <p className="text-xs text-orange-600 mt-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
