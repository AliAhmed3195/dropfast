import Stripe from 'stripe';

// Validate Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️ STRIPE_SECRET_KEY is not set in environment variables');
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover' as any,
});

// Client-side Stripe loader
export const loadStripe = async () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error('⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is required');
  }
  const { loadStripe: loadStripeJS } = await import('@stripe/stripe-js');
  return loadStripeJS(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
};

// Calculate Stripe fees (2.9% + 30¢ for most cards)
export function calculateStripeFee(amount: number): number {
  return Math.round((amount * 0.029 + 30) * 100) / 100; // Round to 2 decimal places
}

// Calculate platform fee (e.g., 5% of the order)
export function calculatePlatformFee(amount: number, platformFeePercentage: number = 5): number {
  return Math.round((amount * platformFeePercentage / 100) * 100) / 100;
}

// Calculate payment distribution for multi-party system
export interface PaymentDistribution {
  supplierAmount: number;
  vendorAmount: number;
  platformFee: number;
  stripeFee: number;
  totalAmount: number;
}

export function calculatePaymentDistribution(
  totalAmount: number,
  supplierCost: number,
  platformFeePercentage: number = 5
): PaymentDistribution {
  const stripeFee = calculateStripeFee(totalAmount);
  const platformFee = calculatePlatformFee(totalAmount, platformFeePercentage);
  const vendorAmount = totalAmount - supplierCost - platformFee - stripeFee;
  
  return {
    supplierAmount: supplierCost,
    vendorAmount: Math.max(0, vendorAmount), // Ensure non-negative
    platformFee,
    stripeFee,
    totalAmount
  };
}

// Create Stripe Connect account for vendors/suppliers
export async function createConnectAccount(
  email: string,
  country: string,
  type: 'express' | 'standard' = 'express'
): Promise<Stripe.Account> {
  return await stripe.accounts.create({
    type,
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

// Create account link for onboarding
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

// Transfer funds to connected account
export async function transferToAccount(
  amount: number,
  destinationAccountId: string,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<Stripe.Transfer> {
  return await stripe.transfers.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    destination: destinationAccountId,
    metadata,
  });
}

// Create payment intent with multi-currency support
export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata: Record<string, string>,
  applicationFeeAmount?: number,
  transferData?: {
    destination: string;
  }
): Promise<Stripe.PaymentIntent> {
  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  };

  // Add application fee for platform
  if (applicationFeeAmount) {
    paymentIntentData.application_fee_amount = Math.round(applicationFeeAmount * 100);
  }

  // Add transfer data for connected accounts
  if (transferData) {
    paymentIntentData.transfer_data = transferData;
  }

  return await stripe.paymentIntents.create(paymentIntentData);
}

// Get customer location from IP (for currency detection)
export async function getCustomerLocation(ip: string): Promise<{
  country: string;
  currency: string;
}> {
  try {
    // Using ipapi.co for geolocation
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    return {
      country: data.country_code || 'US',
      currency: data.currency || 'USD'
    };
  } catch (error) {
    console.error('Error getting customer location:', error);
    return {
      country: 'US',
      currency: 'USD'
    };
  }
}

// Currency mapping for common countries
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'US': 'USD',
  'CA': 'CAD',
  'GB': 'GBP',
  'DE': 'EUR',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'AU': 'AUD',
  'JP': 'JPY',
  'CN': 'CNY',
  'IN': 'INR',
  'PK': 'PKR',
  'MY': 'MYR',
  'AE': 'AED',
  'SA': 'SAR',
};

export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
}
