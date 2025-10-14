import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export class StripeExpressService {
  /**
   * Get capabilities for a specific country
   */
  private getCapabilitiesForCountry(countryCode: string): Record<string, { requested: boolean }> {
    const capabilities: Record<string, { requested: boolean }> = {
      transfers: { requested: true }
    };

    // Only request card_payments for supported countries
    const cardPaymentsSupportedCountries = [
      'US', 'CA', 'GB', 'AU', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'NO', 'JP', 'SG', 'HK', 'NZ', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'IN', 'MY', 'TH', 'VN', 'ID', 'PH', 'KR', 'TW', 'IL', 'AE', 'SA', 'EG', 'ZA', 'NG', 'KE', 'GH', 'MA', 'TN', 'DZ', 'EG'
    ];

    if (cardPaymentsSupportedCountries.includes(countryCode.toUpperCase())) {
      capabilities.card_payments = { requested: true };
    }

    return capabilities;
  }

  /**
   * Get service agreement type for a specific country
   */
  private getServiceAgreementForCountry(countryCode: string): 'full' | 'recipient' {
    // Countries that require recipient service agreement (payout-only countries)
    const recipientServiceAgreementCountries = [
      'PK', 'BD', 'LK', 'NP', 'AF', 'IR', 'IQ', 'SY', 'YE', 'SO', 'SD', 'SS', 'ET', 'ER', 'DJ', 'KM', 'MG', 'MU', 'SC', 'RE', 'YT', 'MW', 'ZM', 'ZW', 'BW', 'LS', 'SZ', 'MZ', 'AO', 'CD', 'CG', 'CF', 'TD', 'CM', 'GQ', 'GA', 'ST', 'CV', 'GW', 'GN', 'SL', 'LR', 'CI', 'BF', 'ML', 'NE', 'SN', 'GM', 'GN', 'GW', 'CV', 'ST', 'GQ', 'GA', 'CG', 'CD', 'AO', 'ZM', 'ZW', 'BW', 'LS', 'SZ', 'MZ', 'MG', 'MU', 'SC', 'RE', 'YT', 'KM', 'DJ', 'ER', 'ET', 'SS', 'SD', 'SO', 'YE', 'SY', 'IQ', 'IR', 'AF', 'NP', 'LK', 'BD'
    ];

    if (recipientServiceAgreementCountries.includes(countryCode.toUpperCase())) {
      return 'recipient';
    }

    return 'full';
  }

  /**
   * Create Express account
   */
  async createExpressAccount(userId: string, userEmail: string, countryCode: string = 'US'): Promise<{
    accountId: string;
    accountLink: string;
  }> {
    try {
      console.log(`Creating Express account for user: ${userId}, country: ${countryCode}`);

      // Get country-specific capabilities and service agreement
      const capabilities = this.getCapabilitiesForCountry(countryCode);
      const serviceAgreement = this.getServiceAgreementForCountry(countryCode);
      console.log(`Capabilities for ${countryCode}:`, capabilities);
      console.log(`Service agreement for ${countryCode}:`, serviceAgreement);

      // Create Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country: countryCode,
        email: userEmail,
        capabilities: capabilities,
        business_type: 'individual', // Default to individual, can be updated later
        tos_acceptance: {
          service_agreement: serviceAgreement
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'manual'
            }
          }
        }
      });

      console.log(`Express account created: ${account.id}`);

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${this.getBaseUrl()}/dashboard/onboarding?refresh=true`,
        return_url: `${this.getBaseUrl()}/dashboard/onboarding?success=true`,
        type: 'account_onboarding'
      });

      console.log(`Account link created: ${accountLink.url}`);
      console.log(`Account ID: ${account.id}`);

      return {
        accountId: account.id,
        accountLink: accountLink.url
      };
    } catch (error) {
      console.error('Error creating Express account:', error);
      throw new Error(`Failed to create Express account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get account status
   */
  async getAccountStatus(accountId: string): Promise<{
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    requirements: any;
  }> {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      
      return {
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
        requirements: account.requirements
      };
    } catch (error) {
      console.error('Error getting account status:', error);
      throw new Error(`Failed to get account status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create account link for updates
   */
  async createAccountLink(accountId: string, type: 'account_onboarding' | 'account_update' = 'account_onboarding'): Promise<string> {
    try {
      // First verify the account exists and is valid
      const account = await stripe.accounts.retrieve(accountId);
      console.log(`Account status: ${account.id} - ${account.details_submitted ? 'submitted' : 'pending'}`);

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${this.getBaseUrl()}/dashboard/onboarding?refresh=true`,
        return_url: `${this.getBaseUrl()}/dashboard/onboarding?success=true`,
        type: type
      });

      console.log(`New account link created: ${accountLink.url}`);
      console.log(`Expires at: ${accountLink.expires_at}`);

      return accountLink.url;
    } catch (error) {
      console.error('Error creating account link:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('No such account')) {
          throw new Error('Stripe account not found. Please create a new Express account.');
        } else if (error.message.includes('Invalid account')) {
          throw new Error('Invalid Stripe account. Please create a new Express account.');
        } else {
          throw new Error(`Failed to create account link: ${error.message}`);
        }
      }
      
      throw new Error('Failed to create account link: Unknown error');
    }
  }

  /**
   * Get base URL for redirects
   */
  private getBaseUrl(): string {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
    
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    return 'https://fastdrop.com';
  }
}

export const stripeExpressService = new StripeExpressService();
