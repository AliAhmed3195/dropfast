import { NextRequest, NextResponse } from 'next/server';
import { stripeCountrySpecsService } from '@/lib/stripe-country-specs';

export async function GET(
  request: NextRequest,
  { params }: { params: { countryCode: string } }
) {
  try {
    const { countryCode } = params;

    if (!countryCode) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }

    // Get country specifications
    const specs = await stripeCountrySpecsService.getCountrySpecs(countryCode);
    
    // Generate bank fields for the country
    const bankFields = await stripeCountrySpecsService.generateBankFields(countryCode);

    return NextResponse.json({
      countryCode: countryCode.toUpperCase(),
      specs: {
        supportedPayoutCurrencies: specs.supported_payout_currencies,
        supportedBankAccountCurrencies: specs.supported_bank_account_currencies,
        verificationFields: specs.verification_fields,
        bankAccountSpecifications: specs.bank_account_specifications,
      },
      bankFields,
    });
  } catch (error) {
    console.error('Error fetching country specs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch country specifications' },
      { status: 500 }
    );
  }
}

