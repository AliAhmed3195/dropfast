import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
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
}

export interface AddExternalAccountParams {
  stripeAccountId: string;
  bankDetails: Record<string, any>;
  countryCode: string;
}

export class StripeConnectService {
  private static instance: StripeConnectService;

  private constructor() {}

  public static getInstance(): StripeConnectService {
    if (!StripeConnectService.instance) {
      StripeConnectService.instance = new StripeConnectService();
    }
    return StripeConnectService.instance;
  }

  /**
   * Create a Stripe Connected Account
   */
  async createConnectedAccount(params: CreateConnectedAccountParams): Promise<{
    stripeAccountId: string;
    accountLink: string;
  }> {
    try {
      // Create the connected account
      const account = await stripe.accounts.create({
        type: 'custom',
        country: params.countryCode,
        email: params.email,
        business_type: params.businessType,
        business_profile: {
          name: params.businessName,
          url: process.env.NEXT_PUBLIC_APP_URL || 'https://fastdrop.com',
          support_email: params.email,
          support_phone: params.phone,
        },
        company: params.businessType === 'company' ? {
          name: params.businessName,
          address: params.address,
        } : undefined,
        individual: params.businessType === 'individual' ? {
          first_name: params.businessName.split(' ')[0] || '',
          last_name: params.businessName.split(' ').slice(1).join(' ') || '',
          email: params.email,
          phone: params.phone,
          address: params.address,
        } : undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
            },
          },
        },
      });

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/bank-details?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/bank-details?success=true`,
        type: 'account_onboarding',
      });

      // Update business with Stripe account ID
      await prisma.business.update({
        where: { id: params.businessId },
        data: { stripeAccountId: account.id }
      });

      return {
        stripeAccountId: account.id,
        accountLink: accountLink.url,
      };
    } catch (error) {
      console.error('Error creating Stripe connected account:', error);
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
          tokenData = {
            country: 'PK',
            currency: 'pkr',
            iban: params.bankDetails.iban,
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

      return {
        externalAccountId: externalAccount.id,
      };
    } catch (error) {
      console.error('Error adding external account:', error);
      throw new Error('Failed to add bank account to Stripe');
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
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/bank-details?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/bank-details?success=true`,
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

