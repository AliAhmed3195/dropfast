import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { validatePostalCode } from '@/lib/postal-code-utils';

// Validate Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️ STRIPE_SECRET_KEY is not set in environment variables');
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover' as any,
});

export interface CreateConnectedAccountParams {
  businessId: string;
  countryCode: string;
  businessName: string;
  businessType: 'individual' | 'company';
  email: string;
  phone?: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  serviceAgreement?: 'full' | 'recipient';
  ntn?: string;
  postalCode?: string; // Country-specific postal code
  bankDetails?: Record<string, any>; // Add bank details parameter
  // KYC Details (NEW - preferred over individual fields)
  kycDetails?: {
    countryCode: string;
    accountType: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dobDay: number;
    dobMonth: number;
    dobYear: number;
    nationalId: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    businessName?: string;
    businessTaxId?: string;
  };
}

export interface AddExternalAccountParams {
  stripeAccountId: string;
  bankDetails: Record<string, any>;
  countryCode: string;
}

export class StripeConnectService {
  private static instance: StripeConnectService;

  private constructor() {}

  /**
   * Get the base URL for the application
   */
  private getBaseUrl(): string {
       // Use environment variable if set
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      return process.env.NEXT_PUBLIC_BASE_URL;
    }
    
    // Check if we're in development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
    
 
    // Fallback for production
    return 'https://fastdrop.com';
  }

  /**
   * Validate and construct redirect URLs
   */
  private getRedirectUrls(): { refresh_url: string; return_url: string } {
    const baseUrl = this.getBaseUrl();
    
    // Ensure base URL starts with http:// or https://
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      throw new Error(`Invalid base URL: ${baseUrl}. Must start with http:// or https://`);
    }
    
    return {
      refresh_url: `${baseUrl}/bank-details?refresh=true`,
      return_url: `${baseUrl}/bank-details?success=true`,
    };
  }

  public static getInstance(): StripeConnectService {
    if (!StripeConnectService.instance) {
      StripeConnectService.instance = new StripeConnectService();
    }
    return StripeConnectService.instance;
  }

  /**
   * Get Stripe capabilities based on country
   * Some countries (like Pakistan) only support transfers (payouts), not card_payments
   */
  public getCapabilitiesForCountry(countryCode: string): Record<string, { requested: boolean }> {
    const country = countryCode.toUpperCase();
    // Countries that support both card_payments and transfers
    const fullCapabilityCountries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'LU', 'MT', 'CY', 'SI', 'SK', 'CZ', 'HU', 'PL', 'LT', 'LV', 'EE', 'RO', 'BG', 'HR', 'GR'];
    
    // Countries that only support transfers (payouts)
    const transferOnlyCountries = ['PK', 'IN', 'BD', 'LK', 'NP', 'BT', 'MV', 'AF', 'IR', 'IQ', 'SY', 'LB', 'JO', 'PS', 'IL', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'KE', 'UG', 'TZ', 'RW', 'BI', 'DJ', 'SO', 'ER', 'SS', 'CF', 'TD', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'ZM', 'ZW', 'BW', 'NA', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'YT', 'RE', 'MZ', 'MW', 'MG', 'MU', 'SC', 'KM', 'YT', 'RE'];
    
    if (fullCapabilityCountries.includes(country)) {
      // Full capabilities for supported countries
      return {
        card_payments: { requested: true },
        transfers: { requested: true },
      };
    } else if (transferOnlyCountries.includes(country)) {
      // Only transfers for payout-only countries
      return {
        transfers: { requested: true },
      };
    } else {
      // Default to transfers only for unknown countries
      console.warn(`Unknown country ${country}, defaulting to transfers only`);
      return {
        transfers: { requested: true },
      };
    }
  }

  /**
   * Generate token data for bank account based on country
   */
  private generateTokenData(countryCode: string, bankDetails: Record<string, any>): any {
    console.log(`Generating token data for country: ${countryCode}`);
    console.log('Bank details:', bankDetails);

    switch (countryCode.toUpperCase()) {
      case 'US':
        return {
          country: 'US',
          currency: 'usd',
          account_number: bankDetails.account_number,
          routing_number: bankDetails.routing_number,
          account_holder_name: bankDetails.account_holder_name,
          account_holder_type: 'individual',
        };

      case 'GB':
        return {
          country: 'GB',
          currency: 'gbp',
          account_number: bankDetails.account_number,
          sort_code: bankDetails.sort_code,
          account_holder_name: bankDetails.account_holder_name,
          account_holder_type: 'individual',
        };

      case 'DE':
      case 'FR':
      case 'IT':
      case 'ES':
      case 'NL':
      case 'BE':
      case 'AT':
        return {
          country: countryCode,
          currency: 'eur',
          iban: bankDetails.iban,
          account_holder_name: bankDetails.account_holder_name,
          account_holder_type: 'individual',
        };

      case 'PK':
        // Pakistan uses account_number and routing_number, not IBAN
        return {
          country: 'PK',
          currency: 'pkr',
          account_number: bankDetails.account_number || bankDetails.iban, // Fallback to iban if account_number not provided
          routing_number: bankDetails.routing_number || bankDetails.swift_code, // Use swift_code as routing number
          account_holder_name: bankDetails.account_holder_name,
          account_holder_type: 'individual',
        };

      case 'CA':
        return {
          country: 'CA',
          currency: 'cad',
          account_number: bankDetails.account_number,
          routing_number: bankDetails.routing_number,
          account_holder_name: bankDetails.account_holder_name,
          account_holder_type: 'individual',
        };

      case 'AU':
        return {
          country: 'AU',
          currency: 'aud',
          account_number: bankDetails.account_number,
          bsb: bankDetails.bsb,
          account_holder_name: bankDetails.account_holder_name,
          account_holder_type: 'individual',
        };

      default:
        throw new Error(`Unsupported country: ${countryCode}`);
    }
  }

  /**
   * Get service agreement type based on country
   * Some countries require 'recipient' service agreement (like Pakistan)
   */
  public getServiceAgreementForCountry(countryCode: string): 'full' | 'recipient' {
    const country = countryCode.toUpperCase();
    // Countries that require recipient service agreement
    const recipientServiceCountries = ['PK', 'IN', 'BD', 'LK', 'NP', 'BT', 'MV', 'AF', 'IR', 'IQ', 'SY', 'LB', 'JO', 'PS', 'IL', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'ET', 'KE', 'UG', 'TZ', 'RW', 'BI', 'DJ', 'SO', 'ER', 'SS', 'CF', 'TD', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'ZM', 'ZW', 'BW', 'NA', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'YT', 'RE', 'MZ', 'MW'];
    
    if (recipientServiceCountries.includes(country)) {
      return 'recipient';
    } else {
      return 'full';
    }
  }

  /**
   * Create a Stripe Connected Account
   */
  async createConnectedAccount(params: CreateConnectedAccountParams): Promise<{
    stripeAccountId: string;
    accountLink: string;
    serviceAgreement: string;
    capabilities: Record<string, { requested: boolean }>;
  }> {
    try {
      // Determine service agreement and capabilities
      const serviceAgreement = params.serviceAgreement || this.getServiceAgreementForCountry(params.countryCode);
      const capabilities = this.getCapabilitiesForCountry(params.countryCode);

      // Use KYC details if available, otherwise fall back to individual fields
      const useKycData = params.kycDetails;
      
      if (useKycData) {
        console.log('Using KYC details for Stripe account creation');
        console.log('KYC Country:', useKycData.countryCode);
        console.log('KYC Account Type:', useKycData.accountType);
        console.log('KYC Name:', `${useKycData.firstName} ${useKycData.lastName}`);
      } else {
        console.log('Using individual fields for Stripe account creation');
        console.log(`Creating Stripe account for ${params.countryCode} with service agreement: ${serviceAgreement}`);
        console.log('Requested capabilities:', capabilities);
        console.log('Address data:', params.address);
        console.log('Postal code from params.postalCode:', params.postalCode);
        console.log('Postal code from params.address.postal_code:', params.address.postal_code);
      }

      // Validate and format postal code
      const rawPostalCode = useKycData ? useKycData.postalCode : (params.postalCode || params.address.postal_code);
      const countryCode = useKycData ? useKycData.countryCode : params.countryCode;
      console.log('Raw postal code:', rawPostalCode);
      console.log('Country code:', countryCode);
      
      let validPostalCode = rawPostalCode;
      if (rawPostalCode) {
        const validation = validatePostalCode(countryCode, rawPostalCode);
        if (validation.isValid && validation.formattedCode) {
          validPostalCode = validation.formattedCode;
          console.log('Validated postal code:', validPostalCode);
        } else {
          console.error('Invalid postal code:', validation.error);
          throw new Error(`Invalid postal code for ${countryCode}: ${validation.error}`);
        }
      } else {
        throw new Error(`Postal code is required for ${countryCode}`);
      }

      // Generate tokenData for external account if bankDetails provided
      let tokenData: any = null;
      if (params.bankDetails) {
        console.log('Generating tokenData for bank account...');
        tokenData = this.generateTokenData(params.countryCode, params.bankDetails);
        console.log('Generated tokenData:', tokenData);
      }

      // Create the connected account using KYC data or fallback to individual fields
      const accountData: any = {
        type: 'custom',
        country: countryCode,
        email: useKycData ? useKycData.email : params.email,
        business_type: useKycData ? useKycData.accountType : params.businessType,
        business_profile: {
          name: useKycData ? (useKycData.businessName || `${useKycData.firstName} ${useKycData.lastName}`) : params.businessName,
          url: this.getBaseUrl(),
          support_email: useKycData ? useKycData.email : params.email,
          support_phone: useKycData ? useKycData.phone : params.phone,
          product_description: 'Supplier or Vendor payouts for Fastdrop orders',
        },
        company: (useKycData ? useKycData.accountType : params.businessType) === 'company' ? {
          name: useKycData ? useKycData.businessName : params.businessName,
          address: {
            line1: useKycData ? useKycData.addressLine1 : params.address.line1,
            ...(useKycData?.addressLine2 || (params.address as any).line2 ? { line2: useKycData?.addressLine2 || (params.address as any).line2 } : {}),
            city: useKycData ? useKycData.city : params.address.city,
            state: useKycData ? useKycData.state : params.address.state,
            postal_code: validPostalCode,
            country: countryCode,
          },
          tax_id: useKycData ? useKycData.businessTaxId : params.ntn,
        } : undefined,
        individual: (useKycData ? useKycData.accountType : params.businessType) === 'individual' ? {
          first_name: useKycData ? useKycData.firstName : (params.businessName.split(' ')[0] || ''),
          last_name: useKycData ? useKycData.lastName : (params.businessName.split(' ').slice(1).join(' ') || ''),
          email: useKycData ? useKycData.email : params.email,
          phone: useKycData ? useKycData.phone : params.phone,
          dob: useKycData ? {
            day: useKycData.dobDay,
            month: useKycData.dobMonth,
            year: useKycData.dobYear
          } : undefined,
          address: {
            line1: useKycData ? useKycData.addressLine1 : params.address.line1,
            ...(useKycData?.addressLine2 || (params.address as any).line2 ? { line2: useKycData?.addressLine2 || (params.address as any).line2 } : {}),
            city: useKycData ? useKycData.city : params.address.city,
            state: useKycData ? useKycData.state : params.address.state,
            postal_code: validPostalCode,
            country: countryCode,
          },
          id_number: useKycData ? useKycData.nationalId : params.ntn,
        } : undefined,
        capabilities: capabilities,
        settings: {
          payouts: {
            schedule: {
              interval: 'manual', // Changed to manual for better control
            },
          },
        },
        // TOS acceptance with service agreement inside
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: '127.0.0.1', // This should be the user's IP in production
          service_agreement: serviceAgreement, // 'recipient' or 'full'
        },
        // Add external account directly if tokenData is available
        ...(tokenData && {
          external_account: {
            object: 'bank_account',
            ...tokenData,
          },
        }),
      };

      console.log('Creating Stripe account with data:', JSON.stringify(accountData, null, 2));
      const account = await stripe.accounts.create(accountData);
      console.log(`Stripe account created successfully: ${account.id}`);

      // Create account link for onboarding
      const redirectUrls = this.getRedirectUrls();
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: redirectUrls.refresh_url,
        return_url: redirectUrls.return_url,
        type: 'account_onboarding',
      });

      // Update business with Stripe account details
      await prisma.business.update({
        where: { id: params.businessId },
        data: { 
          stripeAccountId: account.id,
        }
      });

      return {
        stripeAccountId: account.id,
        accountLink: accountLink.url,
        serviceAgreement: serviceAgreement,
        capabilities: capabilities,
      };
    } catch (error) {
      console.error('Error creating Stripe connected account:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create Stripe connected account: ${error.message}`);
      }
      throw new Error('Failed to create Stripe connected account');
    }
  }

  /**
   * Add external account (bank details) to Stripe account
   */
  async addExternalAccount(params: AddExternalAccountParams): Promise<{
    externalAccountId: string;
  }> {
    try {
      let tokenData: any = {};

      console.log(`Adding bank account for country: ${params.countryCode}`);
      console.log('Bank details received:', params.bankDetails);

      // Prepare token data based on country
      switch (params.countryCode.toUpperCase()) {
        case 'US':
          tokenData = {
            country: 'US',
            currency: 'usd',
            account_number: params.bankDetails.account_number,
            routing_number: params.bankDetails.routing_number,
            account_holder_name: params.bankDetails.account_holder_name,
            account_holder_type: 'individual',
          };
          break;

        case 'GB':
          tokenData = {
            country: 'GB',
            currency: 'gbp',
            account_number: params.bankDetails.account_number,
            sort_code: params.bankDetails.sort_code,
            account_holder_name: params.bankDetails.account_holder_name,
            account_holder_type: 'individual',
          };
          break;

        case 'DE':
        case 'FR':
        case 'IT':
        case 'ES':
        case 'NL':
        case 'BE':
        case 'AT':
          tokenData = {
            country: params.countryCode,
            currency: 'eur',
            iban: params.bankDetails.iban,
            account_holder_name: params.bankDetails.account_holder_name,
            account_holder_type: 'individual',
          };
          break;

        case 'PK':
          // Pakistan uses account_number and routing_number, not IBAN
          tokenData = {
            country: 'US',
            currency: 'USD',
            account_number: params.bankDetails.account_number || params.bankDetails.iban, // Fallback to iban if account_number not provided
            routing_number: params.bankDetails.routing_number || params.bankDetails.swift_code, // Use swift_code as routing number
            account_holder_name: params.bankDetails.account_holder_name,
            account_holder_type: 'individual',
          };
          break;

        case 'CA':
          tokenData = {
            country: 'CA',
            currency: 'cad',
            account_number: params.bankDetails.account_number,
            routing_number: params.bankDetails.routing_number,
            account_holder_name: params.bankDetails.account_holder_name,
            account_holder_type: 'individual',
          };
          break;

        case 'AU':
          tokenData = {
            country: 'AU',
            currency: 'aud',
            account_number: params.bankDetails.account_number,
            bsb: params.bankDetails.bsb,
            account_holder_name: params.bankDetails.account_holder_name,
            account_holder_type: 'individual',
          };
          break;

        default:
          throw new Error(`Unsupported country: ${params.countryCode}`);
      }

      // Create bank account token
      const token = await stripe.tokens.create({
        bank_account: tokenData,
      });

      // Create external account
      const externalAccount = await stripe.accounts.createExternalAccount(
        params.stripeAccountId,
        {
          external_account: token.id,
        }
      );

      console.log('Bank account added successfully:', externalAccount.id);
      return {
        externalAccountId: externalAccount.id,
      };
    } catch (error) {
      console.error('Error adding external account:', error);
      
      // Enhanced error handling for specific Stripe errors
      if (error instanceof Error) {
        if (error.message.includes('parameter_unknown')) {
          throw new Error(`Invalid bank account parameters for ${params.countryCode}. Please check the bank account format.`);
        }
        if (error.message.includes('invalid_request_error')) {
          throw new Error(`Bank account validation failed for ${params.countryCode}. Please verify your bank details.`);
        }
      }
      
      throw new Error(`Failed to add bank account to Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add external account using account links (alternative approach)
   * This is used when direct bank account creation fails
   */
  async addExternalAccountViaLink(stripeAccountId: string): Promise<{
    accountLink: string;
    message: string;
  }> {
    try {
      const redirectUrls = this.getRedirectUrls();
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: redirectUrls.refresh_url,
        return_url: redirectUrls.return_url,
        type: 'account_update',
      });

      return {
        accountLink: accountLink.url,
        message: 'Please complete bank account setup via Stripe\'s secure link',
      };
    } catch (error) {
      console.error('Error creating account link for bank setup:', error);
      throw new Error('Failed to create account link for bank setup');
    } 
  }

  /**
   * Get account status
   */
  async getAccountStatus(stripeAccountId: string): Promise<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirements: any;
  }> {
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);

      return {
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        detailsSubmitted: account.details_submitted || false,
        requirements: account.requirements,
      };
    } catch (error) {
      console.error('Error getting account status:', error);
      throw new Error('Failed to get account status');
    }
  }

  /**
   * Create account link for additional requirements
   */
  async createAccountLink(stripeAccountId: string, type: 'account_onboarding' | 'account_update' = 'account_update'): Promise<string> {
    try {
      const redirectUrls = this.getRedirectUrls();
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: redirectUrls.refresh_url,
        return_url: redirectUrls.return_url,
        type: type,
      });

      return accountLink.url;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw new Error('Failed to create account link');
    }
  }

  /**
   * Update account with additional information
   */
  async updateAccount(stripeAccountId: string, updates: any): Promise<void> {
    try {
      await stripe.accounts.update(stripeAccountId, updates);
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error('Failed to update account');
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(stripeAccountId: string): Promise<{
    available: number;
    pending: number;
    currency: string;
  }> {
    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: stripeAccountId,
      });

      const usdBalance = balance.available.find(b => b.currency === 'usd') || balance.available[0];

      return {
        available: usdBalance.amount / 100, // Convert from cents
        pending: balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100,
        currency: usdBalance.currency.toUpperCase(),
      };
    } catch (error) {
      console.error('Error getting account balance:', error);
      throw new Error('Failed to get account balance');
    }
  }
}

export const stripeConnectService = StripeConnectService.getInstance();

