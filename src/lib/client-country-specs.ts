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

export class ClientCountrySpecsService {
  private static instance: ClientCountrySpecsService;

  private constructor() {}

  public static getInstance(): ClientCountrySpecsService {
    if (!ClientCountrySpecsService.instance) {
      ClientCountrySpecsService.instance = new ClientCountrySpecsService();
    }
    return ClientCountrySpecsService.instance;
  }

  /**
   * Get country specifications from API
   */
  async getCountrySpecs(countryCode: string): Promise<any> {
    try {
      const response = await fetch(`/api/stripe/country-specs/${countryCode}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch country specs for ${countryCode}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching country specs for ${countryCode}:`, error);
      throw new Error(`Failed to fetch country specifications for ${countryCode}`);
    }
  }

  /**
   * Generate bank details form fields based on country specs
   */
  async generateBankFields(countryCode: string): Promise<BankFieldSpec[]> {
    try {
      const specs = await this.getCountrySpecs(countryCode);
      return specs.bankFields || [];
    } catch (error) {
      console.error('Error loading bank fields:', error);
      // Return default fields if API fails
      return this.getDefaultFields(countryCode);
    }
  }

  /**
   * Get default fields for a country (fallback)
   */
  private getDefaultFields(countryCode: string): BankFieldSpec[] {
    const fields: BankFieldSpec[] = [
      {
        name: 'account_holder_name',
        label: 'Account Holder Name',
        type: 'text',
        required: true,
        placeholder: 'Enter account holder name',
        validation: {
          minLength: 2,
          maxLength: 100
        }
      },
      {
        name: 'bank_name',
        label: 'Bank Name',
        type: 'text',
        required: true,
        placeholder: 'Enter bank name',
        validation: {
          minLength: 2,
          maxLength: 100
        }
      }
    ];

    // Add country-specific fields
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
    try {
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
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: { general: 'Validation failed' }
      };
    }
  }
}

export const clientCountrySpecsService = ClientCountrySpecsService.getInstance();
