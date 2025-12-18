import Stripe from 'stripe';

// Validate Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️ STRIPE_SECRET_KEY is not set in environment variables');
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover' as any,
});

export interface CountrySpecs {
  id: string;
  object: string;
  country: string;
  default_currency: string;
  supported_bank_account_currencies: string[];
  supported_payment_currencies: string[];
  supported_payout_currencies: string[];
  verification_fields: {
    individual: {
      additional: string[];
      minimum: string[];
    };
    company: {
      additional: string[];
      minimum: string[];
    };
  };
  bank_account_specifications: {
    supported_bank_account_types: string[];
    supported_payment_methods: string[];
  };
}

export interface BankFieldSpec {
  name: string;
  label: string;
  type: 'text' | 'select' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export class StripeCountrySpecsService {
  private static instance: StripeCountrySpecsService;
  private cache: Map<string, CountrySpecs> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  public static getInstance(): StripeCountrySpecsService {
    if (!StripeCountrySpecsService.instance) {
      StripeCountrySpecsService.instance = new StripeCountrySpecsService();
    }
    return StripeCountrySpecsService.instance;
  }

  /**
   * Get country specifications from Stripe
   */
  async getCountrySpecs(countryCode: string): Promise<CountrySpecs> {
    const cacheKey = `country_specs_${countryCode}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const countrySpecs = await stripe.countrySpecs.retrieve(countryCode.toUpperCase());
      
      // Cache the result
      this.cache.set(cacheKey, countrySpecs as unknown as CountrySpecs);

      return countrySpecs as unknown as CountrySpecs;
    } catch (error) {
      console.error(`Error fetching country specs for ${countryCode}:`, error);
      throw new Error(`Failed to fetch country specifications for ${countryCode}`);
    }
  }

  /**
   * Get supported payout currencies for a country
   */
  async getSupportedPayoutCurrencies(countryCode: string): Promise<string[]> {
    const specs = await this.getCountrySpecs(countryCode);
    return specs.supported_payout_currencies;
  }

  /**
   * Generate bank details form fields based on country specs
   */
  async generateBankFields(countryCode: string): Promise<BankFieldSpec[]> {
    const specs = await this.getCountrySpecs(countryCode);
    const fields: BankFieldSpec[] = [];

    // Common fields for all countries
    fields.push({
      name: 'account_holder_name',
      label: 'Account Holder Name',
      type: 'text',
      required: true,
      placeholder: 'Enter account holder name',
      validation: {
        minLength: 2,
        maxLength: 100
      }
    });

    fields.push({
      name: 'bank_name',
      label: 'Bank Name',
      type: 'text',
      required: true,
      placeholder: 'Enter bank name',
      validation: {
        minLength: 2,
        maxLength: 100
      }
    });

    // Country-specific fields
    switch (countryCode.toUpperCase()) {
      case 'US':
        fields.push({
          name: 'routing_number',
          label: 'Routing Number',
          type: 'text',
          required: true,
          placeholder: 'Enter 9-digit routing number',
          validation: {
            pattern: '^[0-9]{9}$',
            minLength: 9,
            maxLength: 9
          }
        });
        fields.push({
          name: 'account_number',
          label: 'Account Number',
          type: 'text',
          required: true,
          placeholder: 'Enter account number',
          validation: {
            minLength: 4,
            maxLength: 17
          }
        });
        break;

      case 'GB':
        fields.push({
          name: 'sort_code',
          label: 'Sort Code',
          type: 'text',
          required: true,
          placeholder: 'Enter sort code (e.g., 12-34-56)',
          validation: {
            pattern: '^[0-9]{2}-[0-9]{2}-[0-9]{2}$',
            minLength: 8,
            maxLength: 8
          }
        });
        fields.push({
          name: 'account_number',
          label: 'Account Number',
          type: 'text',
          required: true,
          placeholder: 'Enter 8-digit account number',
          validation: {
            pattern: '^[0-9]{8}$',
            minLength: 8,
            maxLength: 8
          }
        });
        break;

      case 'DE':
      case 'FR':
      case 'IT':
      case 'ES':
      case 'NL':
      case 'BE':
      case 'AT':
        fields.push({
          name: 'iban',
          label: 'IBAN',
          type: 'text',
          required: true,
          placeholder: 'Enter IBAN',
          validation: {
            pattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$',
            minLength: 15,
            maxLength: 34
          }
        });
        break;

      case 'PK':
        fields.push({
          name: 'swift_code',
          label: 'SWIFT Code',
          type: 'text',
          required: true,
          placeholder: 'Enter SWIFT code (e.g., HBLBPKKA)',
          validation: {
            pattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$',
            minLength: 8,
            maxLength: 11
          }
        });
        fields.push({
          name: 'iban',
          label: 'IBAN',
          type: 'text',
          required: true,
          placeholder: 'Enter IBAN',
          validation: {
            pattern: '^PK[0-9]{2}[A-Z]{4}[0-9]{16}$',
            minLength: 24,
            maxLength: 24
          }
        });
        break;

      case 'CA':
        fields.push({
          name: 'routing_number',
          label: 'Transit Number',
          type: 'text',
          required: true,
          placeholder: 'Enter 9-digit transit number',
          validation: {
            pattern: '^[0-9]{9}$',
            minLength: 9,
            maxLength: 9
          }
        });
        fields.push({
          name: 'account_number',
          label: 'Account Number',
          type: 'text',
          required: true,
          placeholder: 'Enter account number',
          validation: {
            minLength: 4,
            maxLength: 20
          }
        });
        break;

      case 'AU':
        fields.push({
          name: 'bsb',
          label: 'BSB',
          type: 'text',
          required: true,
          placeholder: 'Enter BSB (e.g., 123-456)',
          validation: {
            pattern: '^[0-9]{3}-[0-9]{3}$',
            minLength: 7,
            maxLength: 7
          }
        });
        fields.push({
          name: 'account_number',
          label: 'Account Number',
          type: 'text',
          required: true,
          placeholder: 'Enter account number',
          validation: {
            minLength: 4,
            maxLength: 10
          }
        });
        break;

      default:
        // Generic fields for unsupported countries
        fields.push({
          name: 'account_number',
          label: 'Account Number',
          type: 'text',
          required: true,
          placeholder: 'Enter account number'
        });
        fields.push({
          name: 'swift_code',
          label: 'SWIFT Code',
          type: 'text',
          required: false,
          placeholder: 'Enter SWIFT code if available'
        });
        break;
    }

    return fields;
  }

  /**
   * Validate bank details based on country specifications
   */
  async validateBankDetails(countryCode: string, fields: Record<string, any>): Promise<{
    isValid: boolean;
    errors: Record<string, string>;
  }> {
    const fieldSpecs = await this.generateBankFields(countryCode);
    const errors: Record<string, string> = {};

    for (const spec of fieldSpecs) {
      const value = fields[spec.name];
      
      if (spec.required && (!value || value.trim() === '')) {
        errors[spec.name] = `${spec.label} is required`;
        continue;
      }

      if (value && spec.validation) {
        if (spec.validation.pattern && !new RegExp(spec.validation.pattern).test(value)) {
          errors[spec.name] = `${spec.label} format is invalid`;
        }
        
        if (spec.validation.minLength && value.length < spec.validation.minLength) {
          errors[spec.name] = `${spec.label} must be at least ${spec.validation.minLength} characters`;
        }
        
        if (spec.validation.maxLength && value.length > spec.validation.maxLength) {
          errors[spec.name] = `${spec.label} must be no more than ${spec.validation.maxLength} characters`;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Get supported countries for payouts
   */
  getSupportedCountries(): string[] {
    return [
      'US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT',
      'AU', 'NZ', 'JP', 'SG', 'HK', 'CH', 'SE', 'NO', 'DK', 'FI',
      'IE', 'PT', 'LU', 'MT', 'CY', 'EE', 'LV', 'LT', 'SI', 'SK',
      'CZ', 'HU', 'PL', 'RO', 'BG', 'HR', 'GR'
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const stripeCountrySpecsService = StripeCountrySpecsService.getInstance();

