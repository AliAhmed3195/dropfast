/**
 * Postal Code Validation Utilities
 * Provides country-specific postal code validation and formatting
 */

export interface PostalCodeValidationResult {
  isValid: boolean;
  formattedCode?: string;
  error?: string;
}

/**
 * Validate postal code based on country
 */
export function validatePostalCode(country: string, postalCode: string): PostalCodeValidationResult {
  if (!postalCode || !country) {
    return { isValid: false, error: 'Postal code and country are required' };
  }

  const countryCode = country.toUpperCase();
  const code = postalCode.trim();

  switch (countryCode) {
    case 'US':
      return validateUSPostalCode(code);
    case 'GB':
      return validateGBPostalCode(code);
    case 'PK':
      return validatePKPostalCode(code);
    case 'CA':
      return validateCAPostalCode(code);
    case 'AU':
      return validateAUPostalCode(code);
    case 'DE':
    case 'FR':
    case 'IT':
    case 'ES':
    case 'NL':
    case 'BE':
    case 'AT':
      return validateEUPostalCode(code);
    default:
      // For other countries, accept any non-empty postal code
      return { isValid: code.length > 0, formattedCode: code };
  }
}

/**
 * Validate US postal code (5 digits or 5+4 format)
 */
function validateUSPostalCode(code: string): PostalCodeValidationResult {
  const usPattern = /^\d{5}(-\d{4})?$/;
  if (usPattern.test(code)) {
    return { isValid: true, formattedCode: code };
  }
  
  // Try to fix common issues
  const cleaned = code.replace(/\D/g, ''); // Remove non-digits
  if (cleaned.length === 5) {
    return { isValid: true, formattedCode: cleaned };
  }
  if (cleaned.length === 9) {
    return { isValid: true, formattedCode: `${cleaned.slice(0, 5)}-${cleaned.slice(5)}` };
  }
  
  return { 
    isValid: false, 
    error: 'US postal code must be 5 digits (e.g., 12345) or 5+4 format (e.g., 12345-6789)' 
  };
}

/**
 * Validate UK postal code
 */
function validateGBPostalCode(code: string): PostalCodeValidationResult {
  const gbPattern = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
  if (gbPattern.test(code)) {
    return { isValid: true, formattedCode: code.toUpperCase() };
  }
  
  return { 
    isValid: false, 
    error: 'UK postal code format is invalid (e.g., SW1A 1AA, M1 1AA)' 
  };
}

/**
 * Validate Pakistan postal code (5 digits)
 */
function validatePKPostalCode(code: string): PostalCodeValidationResult {
  const pkPattern = /^\d{5}$/;
  if (pkPattern.test(code)) {
    return { isValid: true, formattedCode: code };
  }
  
  const cleaned = code.replace(/\D/g, '');
  if (cleaned.length === 5) {
    return { isValid: true, formattedCode: cleaned };
  }
  
  return { 
    isValid: false, 
    error: 'Pakistan postal code must be 5 digits (e.g., 75000)' 
  };
}

/**
 * Validate Canada postal code
 */
function validateCAPostalCode(code: string): PostalCodeValidationResult {
  const caPattern = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
  if (caPattern.test(code)) {
    return { isValid: true, formattedCode: code.toUpperCase().replace(/(\w)(\d)(\w)\s?(\d)(\w)(\d)/, '$1$2$3 $4$5$6') };
  }
  
  return { 
    isValid: false, 
    error: 'Canada postal code format is invalid (e.g., K1A 0A6)' 
  };
}

/**
 * Validate Australia postal code (4 digits)
 */
function validateAUPostalCode(code: string): PostalCodeValidationResult {
  const auPattern = /^\d{4}$/;
  if (auPattern.test(code)) {
    return { isValid: true, formattedCode: code };
  }
  
  const cleaned = code.replace(/\D/g, '');
  if (cleaned.length === 4) {
    return { isValid: true, formattedCode: cleaned };
  }
  
  return { 
    isValid: false, 
    error: 'Australia postal code must be 4 digits (e.g., 2000)' 
  };
}

/**
 * Validate EU postal codes (various formats)
 */
function validateEUPostalCode(code: string): PostalCodeValidationResult {
  // Basic EU postal code validation (5 digits for most countries)
  const euPattern = /^\d{5}$/;
  if (euPattern.test(code)) {
    return { isValid: true, formattedCode: code };
  }
  
  const cleaned = code.replace(/\D/g, '');
  if (cleaned.length === 5) {
    return { isValid: true, formattedCode: cleaned };
  }
  
  return { 
    isValid: false, 
    error: 'EU postal code must be 5 digits (e.g., 10115)' 
  };
}

/**
 * Get postal code placeholder for a country
 */
export function getPostalCodePlaceholder(country: string): string {
  const countryCode = country.toUpperCase();
  
  switch (countryCode) {
    case 'US': return '12345 or 12345-6789';
    case 'GB': return 'SW1A 1AA';
    case 'PK': return '75000';
    case 'CA': return 'K1A 0A6';
    case 'AU': return '2000';
    case 'DE':
    case 'FR':
    case 'IT':
    case 'ES':
    case 'NL':
    case 'BE':
    case 'AT': return '10115';
    default: return 'Postal code';
  }
}

/**
 * Get postal code label for a country
 */
export function getPostalCodeLabel(country: string): string {
  const countryCode = country.toUpperCase();
  
  switch (countryCode) {
    case 'US': return 'ZIP Code';
    case 'GB': return 'Postcode';
    case 'PK': return 'Postal Code';
    case 'CA': return 'Postal Code';
    case 'AU': return 'Postcode';
    case 'DE': return 'PLZ';
    case 'FR': return 'Code Postal';
    case 'IT': return 'CAP';
    case 'ES': return 'Código Postal';
    case 'NL': return 'Postcode';
    case 'BE': return 'Code Postal';
    case 'AT': return 'PLZ';
    default: return 'Postal Code';
  }
}
