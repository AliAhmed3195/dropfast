interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyResponse {
  success: boolean;
  rates: ExchangeRates;
  base: string;
  date: string;
}

class CurrencyService {
  private static instance: CurrencyService;
  private rates: ExchangeRates = {};
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

  private constructor() {}

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  private async fetchRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    // Return cached rates if still valid
    if (now - this.lastFetch < this.CACHE_DURATION && Object.keys(this.rates).length > 0) {
      return this.rates;
    }

    try {
      console.log('Fetching fresh exchange rates...');
      const response = await fetch(this.API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CurrencyResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      this.rates = data.rates;
      this.lastFetch = now;
      
      console.log('Exchange rates updated:', Object.keys(this.rates).length, 'currencies');
      return this.rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Return cached rates if available, otherwise fallback rates
      if (Object.keys(this.rates).length > 0) {
        console.log('Using cached exchange rates due to API error');
        return this.rates;
      }
      
      // Fallback rates (approximate values)
      return {
        'USD': 1,
        'EUR': 0.85,
        'GBP': 0.73,
        'INR': 83.0,
        'PKR': 280.0,
        'MYR': 4.2,
        'CAD': 1.35,
        'AUD': 1.5,
        'JPY': 150.0,
        'CNY': 7.2
      };
    }
  }

  public async convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'USD') {
      return amount;
    }

    const rates = await this.fetchRates();
    const rate = rates[fromCurrency];
    
    if (!rate) {
      throw new Error(`Currency ${fromCurrency} not supported`);
    }
    
    return amount / rate;
  }

  public async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.fetchRates();
    
    // Convert to USD first, then to target currency
    let usdAmount: number;
    if (fromCurrency === 'USD') {
      usdAmount = amount;
    } else {
      const fromRate = rates[fromCurrency];
      if (!fromRate) {
        throw new Error(`Currency ${fromCurrency} not supported`);
      }
      usdAmount = amount / fromRate;
    }
    
    // Convert from USD to target currency
    if (toCurrency === 'USD') {
      return usdAmount;
    }
    
    const toRate = rates[toCurrency];
    if (!toRate) {
      throw new Error(`Currency ${toCurrency} not supported`);
    }
    
    return usdAmount * toRate;
  }

  public async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const rates = await this.fetchRates();
    
    if (fromCurrency === 'USD') {
      const rate = rates[toCurrency];
      if (!rate) {
        throw new Error(`Currency ${toCurrency} not supported`);
      }
      return rate;
    }
    
    if (toCurrency === 'USD') {
      const rate = rates[fromCurrency];
      if (!rate) {
        throw new Error(`Currency ${fromCurrency} not supported`);
      }
      return 1 / rate;
    }
    
    // Convert through USD
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    
    if (!fromRate || !toRate) {
      throw new Error(`Currency not supported: ${fromCurrency} or ${toCurrency}`);
    }
    
    return toRate / fromRate;
  }

  public getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'INR', 'PKR', 'MYR', 
      'CAD', 'AUD', 'JPY', 'CNY', 'AED', 'SAR'
    ];
  }
}

export const currencyService = CurrencyService.getInstance();
export default currencyService;