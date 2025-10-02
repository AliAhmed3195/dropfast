'use client';

interface CurrencyInfo {
  currency: string;
  country: string;
  symbol: string;
  rate: number;
}

const CURRENCY_MAP: { [key: string]: { currency: string; symbol: string } } = {
  'US': { currency: 'USD', symbol: '$' },
  'CA': { currency: 'CAD', symbol: 'C$' },
  'GB': { currency: 'GBP', symbol: '£' },
  'DE': { currency: 'EUR', symbol: '€' },
  'FR': { currency: 'EUR', symbol: '€' },
  'IT': { currency: 'EUR', symbol: '€' },
  'ES': { currency: 'EUR', symbol: '€' },
  'NL': { currency: 'EUR', symbol: '€' },
  'AU': { currency: 'AUD', symbol: 'A$' },
  'JP': { currency: 'JPY', symbol: '¥' },
  'IN': { currency: 'INR', symbol: '₹' },
  'PK': { currency: 'PKR', symbol: '₨' },
  'MY': { currency: 'MYR', symbol: 'RM' },
  'SG': { currency: 'SGD', symbol: 'S$' },
  'CN': { currency: 'CNY', symbol: '¥' },
  'BR': { currency: 'BRL', symbol: 'R$' },
  'MX': { currency: 'MXN', symbol: '$' },
  'RU': { currency: 'RUB', symbol: '₽' },
  'KR': { currency: 'KRW', symbol: '₩' },
  'TH': { currency: 'THB', symbol: '฿' },
};

// Fallback exchange rates (USD to other currencies)
const FALLBACK_RATES: { [key: string]: number } = {
  'USD': 1.0,
  'CAD': 1.35,
  'GBP': 0.79,
  'EUR': 0.92,
  'AUD': 1.52,
  'JPY': 150.0,
  'INR': 83.0,
  'PKR': 280.0,
  'MYR': 4.7,
  'SGD': 1.35,
  'CNY': 7.2,
  'BRL': 5.0,
  'MXN': 17.0,
  'RUB': 90.0,
  'KRW': 1300.0,
  'THB': 36.0,
};

export class CurrencyDetectionService {
  private static instance: CurrencyDetectionService;
  private cachedCurrency: CurrencyInfo | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Exchange rate cache
  private exchangeRateCache: { [key: string]: { rate: number; timestamp: number } } = {};
  private readonly RATE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CurrencyDetectionService {
    if (!CurrencyDetectionService.instance) {
      CurrencyDetectionService.instance = new CurrencyDetectionService();
    }
    return CurrencyDetectionService.instance;
  }

  async detectCurrency(): Promise<CurrencyInfo> {
    // Check cache first
    if (this.cachedCurrency && Date.now() < this.cacheExpiry) {
      return this.cachedCurrency;
    }

    try {
      // Try to get location from IP
      const location = await this.getLocationFromIP();
      const currencyInfo = this.getCurrencyFromLocation(location);
      
      // Cache the result
      this.cachedCurrency = currencyInfo;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      
      return currencyInfo;
    } catch (error) {
      console.warn('Currency detection failed, using fallback:', error);
      return this.getFallbackCurrency();
    }
  }

  private async getLocationFromIP(): Promise<string> {
    try {
      // Try multiple IP geolocation services with better error handling
      const services = [
        {
          url: 'https://ipapi.co/json/',
          getCountryCode: (data: any) => data.country_code
        },
        {
          url: 'https://ip-api.com/json/',
          getCountryCode: (data: any) => data.countryCode
        },
        {
          url: 'https://api.country.is/',
          getCountryCode: (data: any) => data.country
        },
        {
          url: 'https://ipinfo.io/json',
          getCountryCode: (data: any) => data.country
        }
      ];

      for (const service of services) {
        try {
          console.log(`Trying IP service: ${service.url}`);
          const response = await fetch(service.url, { 
            method: 'GET',
            headers: { 
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; CurrencyDetector/1.0)'
            },
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          
          if (!response.ok) {
            console.warn(`Service ${service.url} returned ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          console.log(`Service ${service.url} response:`, data);
          
          const countryCode = service.getCountryCode(data);
          if (countryCode && typeof countryCode === 'string') {
            console.log(`Detected country: ${countryCode}`);
            return countryCode.toUpperCase();
          }
        } catch (serviceError) {
          console.warn(`Service ${service.url} failed:`, serviceError);
          continue;
        }
      }
      
      throw new Error('All IP geolocation services failed');
    } catch (error) {
      console.warn('IP geolocation failed:', error);
      throw error;
    }
  }

  private getCurrencyFromLocation(countryCode: string): CurrencyInfo {
    const currencyData = CURRENCY_MAP[countryCode] || CURRENCY_MAP['US'];
    const rate = FALLBACK_RATES[currencyData.currency] || 1.0;
    
    return {
      currency: currencyData.currency,
      country: countryCode,
      symbol: currencyData.symbol,
      rate: rate
    };
  }

  private getFallbackCurrency(): CurrencyInfo {
    return {
      currency: 'USD',
      country: 'US',
      symbol: '$',
      rate: 1.0
    };
  }

  async convertPrice(price: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return price;
    
    try {
      // Try to get live exchange rate
      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      return price * rate;
    } catch (error) {
      console.warn('Live exchange rate failed, using fallback:', error);
      return this.convertWithFallbackRate(price, fromCurrency, toCurrency);
    }
  }

  private async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const now = Date.now();
    
    // Check cache first
    if (this.exchangeRateCache[cacheKey] && 
        now - this.exchangeRateCache[cacheKey].timestamp < this.RATE_CACHE_DURATION) {
      console.log(`Using cached exchange rate for ${cacheKey}:`, this.exchangeRateCache[cacheKey].rate);
      return this.exchangeRateCache[cacheKey].rate;
    }
    
    try {
      console.log(`Fetching fresh exchange rate for ${cacheKey}`);
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
        { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        }
      );
      
      if (!response.ok) throw new Error('Exchange rate API failed');
      
      const data = await response.json();
      const rate = data.rates[toCurrency] || 1.0;
      
      // Cache the rate
      this.exchangeRateCache[cacheKey] = {
        rate: rate,
        timestamp: now
      };
      
      console.log(`Cached exchange rate for ${cacheKey}:`, rate);
      return rate;
    } catch (error) {
      console.warn('Exchange rate API failed:', error);
      throw error;
    }
  }

  private convertWithFallbackRate(price: number, fromCurrency: string, toCurrency: string): number {
    const fromRate = FALLBACK_RATES[fromCurrency] || 1.0;
    const toRate = FALLBACK_RATES[toCurrency] || 1.0;
    return (price / fromRate) * toRate;
  }

  getCurrencySymbol(currency: string): string {
    const currencyData = Object.values(CURRENCY_MAP).find(c => c.currency === currency);
    return currencyData?.symbol || currency;
  }
}

export const currencyDetection = CurrencyDetectionService.getInstance();
