import { prisma } from '@/lib/prisma';

export class CurrencyService {
  private static instance: CurrencyService;
  private exchangeRates: Map<string, number> = new Map();
  private lastUpdated: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Get user's preferred currency from their business
   */
  async getUserCurrency(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });

    if (user?.business) {
      return user.business.preferredCurrency;
    }

    return 'USD'; // Default for admin/customer
  }

  /**
   * Get store's currency from owner's business
   */
  async getStoreCurrency(storeId: string): Promise<string> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { 
        owner: { 
          include: { business: true } 
        } 
      }
    });

    if (store?.owner?.business) {
      return store.owner.business.preferredCurrency;
    }

    return 'USD'; // Default
  }

  /**
   * Get business preferred currency
   */
  async getBusinessCurrency(businessId: string): Promise<string> {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    return business?.preferredCurrency || 'USD';
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const now = new Date();

    // Check if we have cached data and it's still fresh
    if (this.exchangeRates.has(cacheKey) && this.lastUpdated && 
        (now.getTime() - this.lastUpdated.getTime()) < this.CACHE_DURATION) {
      return this.exchangeRates.get(cacheKey)!;
    }

    try {
      // Fetch fresh exchange rates
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();

      if (data.rates && data.rates[toCurrency]) {
        const rate = data.rates[toCurrency];
        this.exchangeRates.set(cacheKey, rate);
        this.lastUpdated = now;
        return rate;
      }

      // Fallback to 1 if currency not found
      console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      return 1;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Return cached rate if available, otherwise 1
      return this.exchangeRates.get(cacheKey) || 1;
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Get order currency (from store's business)
   */
  async getOrderCurrency(orderId: string): Promise<string> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          include: {
            owner: {
              include: { business: true }
            }
          }
        }
      }
    });

    if (order?.store?.owner?.business) {
      return order.store.owner.business.preferredCurrency;
    }

    return 'USD';
  }

  /**
   * Get payout currencies for supplier and vendor
   */
  async getPayoutCurrencies(orderId: string): Promise<{ supplierCurrency: string; vendorCurrency: string }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: {
          include: {
            supplier: {
              include: { business: true }
            }
          }
        },
        store: {
          include: {
            owner: {
              include: { business: true }
            }
          }
        }
      }
    });

    const supplierCurrency = order?.product?.supplier?.business?.preferredCurrency || 'USD';
    const vendorCurrency = order?.store?.owner?.business?.preferredCurrency || 'USD';

    return { supplierCurrency, vendorCurrency };
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(amount);
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
      'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB',
      'INR', 'BRL', 'ZAR', 'PKR', 'AED', 'SAR', 'QAR', 'KWD',
      'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'MAD', 'TND', 'DZD'
    ];
  }

  /**
   * Validate currency code
   */
  isValidCurrency(currency: string): boolean {
    return this.getSupportedCurrencies().includes(currency.toUpperCase());
  }

  /**
   * Clear exchange rate cache
   */
  clearCache(): void {
    this.exchangeRates.clear();
    this.lastUpdated = null;
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance();
