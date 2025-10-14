import { currencyService } from './currency-conversion';

export interface OrderCurrencyDisplay {
  primaryAmount: number;
  primaryCurrency: string;
  secondaryAmount?: number;
  secondaryCurrency?: string;
  exchangeRate?: number;
  rateSource: 'live' | 'fallback';
}

export interface OrderCurrencyOptions {
  userRole: 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER';
  userPreferredCurrency?: string;
  orderTotalAmount: number;
  orderDisplayCurrency?: string;
  orderLockedUSDPrice?: number;
}

export class OrderCurrencyService {
  private fallbackRates: { [key: string]: number } = {
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

  /**
   * Get currency display for orders based on user role
   */
  async getOrderCurrencyDisplay(options: OrderCurrencyOptions): Promise<OrderCurrencyDisplay> {
    const { userRole, userPreferredCurrency, orderTotalAmount, orderDisplayCurrency, orderLockedUSDPrice } = options;

    // Admin always sees USD
    if (userRole === 'ADMIN') {
      return {
        primaryAmount: orderLockedUSDPrice || orderTotalAmount,
        primaryCurrency: 'USD',
        rateSource: 'live'
      };
    }

    // For vendors and suppliers, show their preferred currency + USD
    if (userRole === 'VENDOR_USER' || userRole === 'SUPPLIER_USER') {
      const preferredCurrency = userPreferredCurrency || 'USD';
      
      // If user's currency is USD, just show USD
      if (preferredCurrency === 'USD') {
        return {
          primaryAmount: orderLockedUSDPrice || orderTotalAmount,
          primaryCurrency: 'USD',
          rateSource: 'live'
        };
      }

      // Convert from USD to user's preferred currency
      const usdAmount = orderLockedUSDPrice || orderTotalAmount;
      const conversion = await this.convertFromUSD(usdAmount, preferredCurrency);

      return {
        primaryAmount: conversion.amount,
        primaryCurrency: preferredCurrency,
        secondaryAmount: usdAmount,
        secondaryCurrency: 'USD',
        exchangeRate: conversion.rate,
        rateSource: conversion.rateSource
      };
    }

    // Fallback to USD
    return {
      primaryAmount: orderLockedUSDPrice || orderTotalAmount,
      primaryCurrency: 'USD',
      rateSource: 'live'
    };
  }

  /**
   * Convert amount from USD to target currency
   */
  async convertFromUSD(usdAmount: number, targetCurrency: string): Promise<{
    amount: number;
    rate: number;
    rateSource: 'live' | 'fallback';
  }> {
    try {
      // Try to get live exchange rate
      const rate = await currencyService.getRate('USD', targetCurrency);
      const convertedAmount = Math.round(usdAmount * rate * 100) / 100;
      
      return {
        amount: convertedAmount,
        rate: Math.round(rate * 10000) / 10000, // Round to 4 decimal places
        rateSource: 'live'
      };
    } catch (error) {
      console.warn(`Failed to get live exchange rate for ${targetCurrency}, using fallback:`, error);
      
      // Use fallback rate
      const fallbackRate = this.fallbackRates[targetCurrency] || 1;
      const convertedAmount = Math.round(usdAmount * fallbackRate * 100) / 100;
      
      return {
        amount: convertedAmount,
        rate: fallbackRate,
        rateSource: 'fallback'
      };
    }
  }

  /**
   * Format currency amount with symbol
   */
  formatCurrency(amount: number, currency: string): string {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'PKR': '₨',
      'INR': '₹',
      'AED': 'د.إ',
      'SAR': '﷼',
      'MYR': 'RM',
    };

    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }

  /**
   * Get currency name for display
   */
  getCurrencyName(currency: string): string {
    const names: { [key: string]: string } = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'JPY': 'Japanese Yen',
      'PKR': 'Pakistani Rupee',
      'INR': 'Indian Rupee',
      'AED': 'UAE Dirham',
      'SAR': 'Saudi Riyal',
      'MYR': 'Malaysian Ringgit',
    };

    return names[currency] || currency;
  }
}

// Export singleton instance
export const orderCurrencyService = new OrderCurrencyService();
