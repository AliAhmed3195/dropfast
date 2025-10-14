/**
 * KYC Requirements by Country
 * Defines what fields are required for each country's KYC process
 */

export interface KycRequirements {
  required: string[];
  optional: string[];
  nationalIdLabel: string;
  nationalIdPlaceholder: string;
  nationalIdPattern?: string;
  postalCodeLabel: string;
  postalCodePlaceholder: string;
  postalCodePattern?: string;
}

export const kycRequirementsByCountry: Record<string, KycRequirements> = {
  US: {
    required: ['dob', 'ssn_last_4', 'phone', 'address', 'postal_code', 'state'],
    optional: ['address_line2'],
    nationalIdLabel: 'SSN Last 4 Digits',
    nationalIdPlaceholder: '1234',
    nationalIdPattern: '[0-9]{4}',
    postalCodeLabel: 'ZIP Code',
    postalCodePlaceholder: '12345 or 12345-6789',
    postalCodePattern: '^\\d{5}(-\\d{4})?$'
  },
  CA: {
    required: ['dob', 'sin', 'phone', 'postal_code'],
    optional: ['address_line2'],
    nationalIdLabel: 'SIN (Social Insurance Number)',
    nationalIdPlaceholder: '123-456-789',
    nationalIdPattern: '[0-9]{3}-[0-9]{3}-[0-9]{3}',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'K1A 0A6',
    postalCodePattern: '^[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d$'
  },
  IN: {
    required: ['dob', 'pan_number', 'phone', 'postal_code'],
    optional: ['address_line2'],
    nationalIdLabel: 'PAN Number',
    nationalIdPlaceholder: 'ABCDE1234F',
    nationalIdPattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}',
    postalCodeLabel: 'PIN Code',
    postalCodePlaceholder: '110001',
    postalCodePattern: '^[1-9][0-9]{5}$'
  },
  PK: {
    required: ['dob', 'cnic', 'phone', 'postal_code'],
    optional: ['address_line2'],
    nationalIdLabel: 'CNIC Number',
    nationalIdPlaceholder: '12345-1234567-1',
    nationalIdPattern: '[0-9]{5}-[0-9]{7}-[0-9]{1}',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '75000',
    postalCodePattern: '^[0-9]{5}$'
  },
  CN: {
    required: ['dob', 'national_id', 'phone', 'postal_code'],
    optional: ['address_line2'],
    nationalIdLabel: 'National ID',
    nationalIdPlaceholder: '123456789012345678',
    nationalIdPattern: '[0-9]{18}',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '100000',
    postalCodePattern: '^[0-9]{6}$'
  },
  GB: {
    required: ['dob', 'national_insurance', 'phone', 'postal_code'],
    optional: ['address_line2'],
    nationalIdLabel: 'National Insurance Number',
    nationalIdPlaceholder: 'AB123456C',
    nationalIdPattern: '[A-Z]{2}[0-9]{6}[A-Z]{1}',
    postalCodeLabel: 'Postcode',
    postalCodePlaceholder: 'SW1A 1AA',
    postalCodePattern: '^[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}$'
  },
  AU: {
    required: ['dob', 'tax_file_number', 'phone', 'postal_code'],
    optional: ['address_line2'],
    nationalIdLabel: 'Tax File Number',
    nationalIdPlaceholder: '123456789',
    nationalIdPattern: '[0-9]{9}',
    postalCodeLabel: 'Postcode',
    postalCodePlaceholder: '2000',
    postalCodePattern: '^[0-9]{4}$'
  }
};

/**
 * Get KYC requirements for a specific country
 */
export function getKycRequirements(countryCode: string): KycRequirements {
  const requirements = kycRequirementsByCountry[countryCode.toUpperCase()];
  
  if (!requirements) {
    // Default requirements for unsupported countries
    return {
      required: ['dob', 'national_id', 'phone', 'address', 'postal_code'],
      optional: ['address_line2'],
      nationalIdLabel: 'National ID',
      nationalIdPlaceholder: 'Enter your national ID',
      postalCodeLabel: 'Postal Code',
      postalCodePlaceholder: 'Enter postal code'
    };
  }
  
  return requirements;
}

/**
 * Check if a country is supported by Stripe
 */
export function isStripeSupportedCountry(countryCode: string): boolean {
  const supportedCountries = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT'];
  return supportedCountries.includes(countryCode.toUpperCase());
}

/**
 * Get fallback country data for unsupported countries
 */
export function getFallbackCountryData(originalCountry: string): {
  countryCode: string;
  state: string;
  postalCode: string;
} {
  const fallbackMap: Record<string, { countryCode: string; state: string; postalCode: string }> = {
    'PK': { countryCode: 'US', state: 'CA', postalCode: '90001' },
    'IN': { countryCode: 'US', state: 'CA', postalCode: '90001' },
    'CN': { countryCode: 'US', state: 'CA', postalCode: '90001' },
    'BD': { countryCode: 'US', state: 'CA', postalCode: '90001' },
    'LK': { countryCode: 'US', state: 'CA', postalCode: '90001' }
  };
  
  return fallbackMap[originalCountry.toUpperCase()] || { 
    countryCode: 'US', 
    state: 'CA', 
    postalCode: '90001' 
  };
}

/**
 * Validate KYC data based on country requirements
 */
export function validateKycData(countryCode: string, data: any): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const requirements = getKycRequirements(countryCode);
  const errors: Record<string, string> = {};
  
  // Check required fields
  requirements.required.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors[field] = `${field} is required`;
    }
  });
  
  // Validate national ID pattern
  if (data.nationalId && requirements.nationalIdPattern) {
    const pattern = new RegExp(requirements.nationalIdPattern);
    if (!pattern.test(data.nationalId)) {
      errors.nationalId = `Invalid ${requirements.nationalIdLabel} format`;
    }
  }
  
  // Validate postal code pattern
  if (data.postalCode && requirements.postalCodePattern) {
    const pattern = new RegExp(requirements.postalCodePattern);
    if (!pattern.test(data.postalCode)) {
      errors.postalCode = `Invalid ${requirements.postalCodeLabel} format`;
    }
  }
  
  // Validate date of birth
  if (data.dobDay && data.dobMonth && data.dobYear) {
    const dob = new Date(data.dobYear, data.dobMonth - 1, data.dobDay);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    
    if (age < 18) {
      errors.dob = 'Must be at least 18 years old';
    }
    
    if (dob > today) {
      errors.dob = 'Date of birth cannot be in the future';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
