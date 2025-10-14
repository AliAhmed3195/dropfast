import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { stripeConnectService } from '@/lib/stripe-connect';
import { isStripeSupportedCountry, getFallbackCountryData } from '@/lib/kyc-country-requirements';


export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'VENDOR_USER' && session.role !== 'SUPPLIER_USER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's KYC details
    const kycDetails = await prisma.stripeKycDetails.findUnique({
      where: { userId: session.id }
    });

    if (!kycDetails) {
      return NextResponse.json(
        { error: 'KYC details not found. Please complete KYC first.' },
        { status: 400 }
      );
    }

    // Check if Stripe account already exists
    if (kycDetails.stripeAccountId) {
      return NextResponse.json(
        { error: 'Stripe account already exists' },
        { status: 400 }
      );
    }


    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { business: true }
    });

    if (!user?.business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Use Stripe Connect Service to create account with KYC details
    const accountResult = await stripeConnectService.createConnectedAccount({
      businessId: user.business.id,
      countryCode: kycDetails.countryCode,
      businessName: kycDetails.businessName || `${kycDetails.firstName} ${kycDetails.lastName}`,
      businessType: kycDetails.accountType as 'individual' | 'company',
      email: kycDetails.email,
      phone: kycDetails.phone,
      address: {
        line1: kycDetails.addressLine1,
        line2: kycDetails.addressLine2,
        city: kycDetails.city,
        state: kycDetails.state,
        postal_code: kycDetails.postalCode,
        country: kycDetails.countryCode,
      },
      kycDetails: {
        countryCode: kycDetails.countryCode,
        accountType: kycDetails.accountType,
        firstName: kycDetails.firstName,
        lastName: kycDetails.lastName,
        email: kycDetails.email,
        phone: kycDetails.phone,
        dobDay: kycDetails.dobDay,
        dobMonth: kycDetails.dobMonth,
        dobYear: kycDetails.dobYear,
        nationalId: kycDetails.nationalId,
        addressLine1: kycDetails.addressLine1,
        addressLine2: kycDetails.addressLine2,
        city: kycDetails.city,
        state: kycDetails.state,
        postalCode: kycDetails.postalCode,
        businessName: kycDetails.businessName,
        businessTaxId: kycDetails.businessTaxId
      }
    });

    const account = { id: accountResult.stripeAccountId };

    // Update KYC details with Stripe account ID
    await prisma.stripeKycDetails.update({
      where: { userId: session.id },
      data: {
        stripeAccountId: account.id,
        stripeAccountStatus: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Stripe connected account created successfully',
      stripeAccountId: account.id,
      accountLink: accountResult.accountLink,
      accountStatus: 'pending',
      countryUsed: kycDetails.countryCode,
      originalCountry: kycDetails.countryCode,
      fallbackUsed: !isStripeSupportedCountry(kycDetails.countryCode)
    });

  } catch (error: any) {
    console.error('Error creating Stripe connected account:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { 
          error: 'Invalid request to Stripe', 
          details: error.message,
          code: error.code 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create Stripe connected account' },
      { status: 500 }
    );
  }
}
