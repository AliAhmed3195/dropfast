/**
 * Stripe Fee Calculator
 * Handles all Stripe-related fee calculations including processing fees and country-based payout fees
 */

export interface FeeCalculation {
  grossAmount: number;
  stripeProcessingFee: number;
  platformFee: number;
  supplierAmount: number;
  grossVendorAmount: number;
  stripePayoutFee: number;
  netVendorAmount: number;
  platformRevenue: number;
  totalFees: number;
}

export interface PayoutBreakdown {
  orderTotal: number;
  fees: FeeCalculation;
  currency: string;
  country: string;
  exchangeRate?: number;
}

export class StripeFeeCalculator {
  // Country-based payout fee mapping (in USD)
  private static payoutFees: Record<string, number> = {
    'US': 0.25,
    'UK': 0.20,
    'CA': 0.25,
    'PK': 0.50,
    'AU': 0.30,
    'DE': 0.25,
    'FR': 0.25,
    'IN': 0.50,
    'BR': 0.50,
    'MX': 0.50,
    'SG': 0.30,
    'JP': 0.30,
    'KR': 0.30,
    'TH': 0.50,
    'PH': 0.50,
    'ID': 0.50,
    'MY': 0.50,
    'VN': 0.50,
    'NZ': 0.30,
    'CH': 0.25,
    'AT': 0.25,
    'BE': 0.25,
    'NL': 0.25,
    'SE': 0.25,
    'NO': 0.25,
    'DK': 0.25,
    'FI': 0.25,
    'IE': 0.25,
    'PT': 0.25,
    'ES': 0.25,
    'IT': 0.25,
    'PL': 0.25,
    'CZ': 0.25,
    'HU': 0.25,
    'RO': 0.25,
    'BG': 0.25,
    'HR': 0.25,
    'SI': 0.25,
    'SK': 0.25,
    'LT': 0.25,
    'LV': 0.25,
    'EE': 0.25,
    'CY': 0.25,
    'MT': 0.25,
    'LU': 0.25
  };

  // Stripe processing fee rates by country
  private static processingFeeRates: Record<string, { rate: number; fixedFee: number }> = {
    'US': { rate: 0.029, fixedFee: 0.30 },
    'CA': { rate: 0.029, fixedFee: 0.30 },
    'UK': { rate: 0.014, fixedFee: 0.20 },
    'EU': { rate: 0.014, fixedFee: 0.20 },
    'DEFAULT': { rate: 0.035, fixedFee: 0.30 }
  };

  /**
   * Calculate Stripe processing fee based on amount and country
   */
  static calculateProcessingFee(amount: number, country: string): number {
    const feeConfig = this.getProcessingFeeConfig(country);
    return (amount * feeConfig.rate) + feeConfig.fixedFee;
  }

  /**
   * Get payout fee by country
   */
  static getPayoutFee(country: string): number {
    return this.payoutFees[country.toUpperCase()] || this.payoutFees['US'];
  }

  /**
   * Calculate platform fee
   */
  static calculatePlatformFee(amount: number): number {
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '3.5') / 100;
    return amount * platformFeePercent;
  }

  /**
   * Calculate complete payout breakdown
   */
  static calculatePayoutBreakdown(
    orderTotal: number,
    supplierBaseCost: number,
    customerCountry: string,
    supplierCountry: string,
    vendorCountry: string,
    exchangeRate: number = 1
  ): PayoutBreakdown {
    // Convert to USD if needed
    const grossAmountUSD = orderTotal * exchangeRate;
    const supplierBaseCostUSD = supplierBaseCost * exchangeRate;

    // Calculate Stripe processing fee (from customer payment)
    const stripeProcessingFee = this.calculateProcessingFee(grossAmountUSD, customerCountry);

    // Calculate platform fee (from net amount after Stripe fee)
    const netAfterStripeFee = grossAmountUSD - stripeProcessingFee;
    const platformFee = this.calculatePlatformFee(netAfterStripeFee);

    // Calculate supplier amount (base cost - no deductions)
    const supplierAmount = supplierBaseCostUSD;

    // Calculate vendor gross amount (remaining after supplier and platform fee)
    const grossVendorAmount = netAfterStripeFee - platformFee - supplierAmount;

    // Calculate Stripe payout fee for vendor
    const stripePayoutFee = this.getPayoutFee(vendorCountry);

    // Calculate final vendor amount (after payout fee)
    const netVendorAmount = Math.max(0, grossVendorAmount - stripePayoutFee);

    // Calculate platform revenue (platform fee)
    const platformRevenue = platformFee;

    // Calculate total fees
    const totalFees = stripeProcessingFee + platformFee + stripePayoutFee;

    const fees: FeeCalculation = {
      grossAmount: grossAmountUSD,
      stripeProcessingFee,
      platformFee,
      supplierAmount,
      grossVendorAmount,
      stripePayoutFee,
      netVendorAmount,
      platformRevenue,
      totalFees
    };

    return {
      orderTotal: grossAmountUSD,
      fees,
      currency: 'USD',
      country: vendorCountry,
      exchangeRate
    };
  }

  /**
   * Get processing fee configuration for country
   */
  private static getProcessingFeeConfig(country: string): { rate: number; fixedFee: number } {
    const upperCountry = country.toUpperCase();
    
    // Check for specific country
    if (this.processingFeeRates[upperCountry]) {
      return this.processingFeeRates[upperCountry];
    }

    // Check for EU countries
    const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
    if (euCountries.includes(upperCountry)) {
      return this.processingFeeRates['EU'];
    }

    // Default configuration
    return this.processingFeeRates['DEFAULT'];
  }

  /**
   * Validate fee calculation
   */
  static validateCalculation(breakdown: PayoutBreakdown): boolean {
    const { fees } = breakdown;
    
    // Check if all amounts are positive
    if (fees.supplierAmount < 0 || fees.netVendorAmount < 0) {
      return false;
    }

    // Check if total adds up correctly
    const calculatedTotal = fees.stripeProcessingFee + fees.platformFee + fees.supplierAmount + fees.netVendorAmount + fees.stripePayoutFee;
    const tolerance = 0.01; // 1 cent tolerance for rounding
    
    return Math.abs(calculatedTotal - fees.grossAmount) <= tolerance;
  }

  /**
   * Get fee breakdown summary
   */
  static getFeeSummary(breakdown: PayoutBreakdown): {
    totalFees: number;
    feePercentage: number;
    netAmount: number;
    netPercentage: number;
  } {
    const { fees } = breakdown;
    
    return {
      totalFees: fees.totalFees,
      feePercentage: (fees.totalFees / fees.grossAmount) * 100,
      netAmount: fees.supplierAmount + fees.netVendorAmount,
      netPercentage: ((fees.supplierAmount + fees.netVendorAmount) / fees.grossAmount) * 100
    };
  }

  /**
   * Format fee for display
   */
  static formatFee(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Get all supported countries
   */
  static getSupportedCountries(): string[] {
    return Object.keys(this.payoutFees);
  }

  /**
   * Get country fee information
   */
  static getCountryFeeInfo(country: string): {
    payoutFee: number;
    processingFeeRate: number;
    processingFixedFee: number;
  } {
    const feeConfig = this.getProcessingFeeConfig(country);
    
    return {
      payoutFee: this.getPayoutFee(country),
      processingFeeRate: feeConfig.rate,
      processingFixedFee: feeConfig.fixedFee
    };
  }
}

export default StripeFeeCalculator;
