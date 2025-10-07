import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { stripeConnectService } from '@/lib/stripe-connect';
import { stripeCountrySpecsService } from '@/lib/stripe-country-specs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'VENDOR_USER' && session.role !== 'SUPPLIER_USER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bankDetails, countryCode } = await request.json();

    if (!bankDetails || !countryCode) {
      return NextResponse.json(
        { error: 'Bank details and country code are required' },
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

    // Validate bank details (basic validation for now)
    if (!bankDetails.account_holder_name || !bankDetails.bank_name) {
      return NextResponse.json(
        { error: 'Account holder name and bank name are required' },
        { status: 400 }
      );
    }

    let stripeAccountId = user.business.stripeAccountId;

    // TODO: Implement Stripe integration when API keys are configured
    // For now, we'll just save the bank details without Stripe integration
    console.log('Bank details received:', { bankDetails, countryCode });
    console.log('Stripe integration temporarily disabled - saving bank details only');

    // Save bank details to database
    const existingBankDetails = await prisma.bankDetails.findFirst({
      where: {
        businessId: user.business.id,
      }
    });

    if (existingBankDetails) {
      // Update existing bank details
      await prisma.bankDetails.update({
        where: { id: existingBankDetails.id },
        data: {
          countryCode: countryCode.toUpperCase(),
          fields: bankDetails,
          stripeAccountId,
          kycStatus: 'PENDING',
          isVerified: false,
        }
      });
    } else {
      // Create new bank details
      await prisma.bankDetails.create({
        data: {
          businessId: user.business.id,
          countryCode: countryCode.toUpperCase(),
          fields: bankDetails,
          stripeAccountId,
          kycStatus: 'PENDING',
          isVerified: false,
        }
      });
    }

    // Update business KYC status
    await prisma.business.update({
      where: { id: user.business.id },
      data: { kycStatus: 'PENDING' }
    });

    return NextResponse.json({
      success: true,
      message: 'Bank details submitted successfully',
      stripeAccountId,
    });
  } catch (error) {
    console.error('Error onboarding bank details:', error);
    return NextResponse.json(
      { error: 'Failed to submit bank details' },
      { status: 500 }
    );
  }
}

