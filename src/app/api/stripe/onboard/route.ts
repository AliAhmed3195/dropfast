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

    const { bankDetails, countryCode, ntn, postalCode } = await request.json();

    if (!bankDetails || !countryCode) {
      return NextResponse.json(
        { error: 'Bank details and country code are required' },
        { status: 400 }
      );
    }

    // Get user's business and KYC details
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { 
        business: true,
        stripeKycDetails: true
      }
    });

    if (!user?.business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Validate bank details using Stripe country specs
    const validation = await stripeCountrySpecsService.validateBankDetails(countryCode, bankDetails);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid bank details', details: validation.errors },
        { status: 400 }
      );
    }

    let stripeAccountId = user.business.stripeAccountId;

    // Create Stripe connected account if it doesn't exist
    if (!stripeAccountId) {
      console.log('Creating new Stripe connected account...');
      // Use KYC details if available, otherwise fall back to business data
      const accountResult = await stripeConnectService.createConnectedAccount({
        businessId: user.business.id,
        countryCode: countryCode,
        businessName: user.business.businessName,
        businessType: user.business.businessType.toLowerCase() as 'individual' | 'company',
        email: user.email,
        address: {
          line1: user.business.addressStreet,
          city: user.business.addressCity,
          state: user.business.addressState,
          postal_code: user.business.postalCode,
          country: user.business.addressCountry,
        },
        ntn: ntn || user.business.ntn, // Use provided NTN or existing business NTN
        postalCode: postalCode || user.business.postalCode, // Use provided postal code or existing business postal code
        bankDetails: bankDetails, // Pass bank details for direct account creation
        // Use KYC details if available
        kycDetails: user.stripeKycDetails ? {
          countryCode: user.stripeKycDetails.countryCode,
          accountType: user.stripeKycDetails.accountType,
          firstName: user.stripeKycDetails.firstName,
          lastName: user.stripeKycDetails.lastName,
          email: user.stripeKycDetails.email,
          phone: user.stripeKycDetails.phone,
          dobDay: user.stripeKycDetails.dobDay,
          dobMonth: user.stripeKycDetails.dobMonth,
          dobYear: user.stripeKycDetails.dobYear,
          nationalId: user.stripeKycDetails.nationalId,
          addressLine1: user.stripeKycDetails.addressLine1,
          addressLine2: user.stripeKycDetails.addressLine2,
          city: user.stripeKycDetails.city,
          state: user.stripeKycDetails.state,
          postalCode: user.stripeKycDetails.postalCode,
          businessName: user.stripeKycDetails.businessName,
          businessTaxId: user.stripeKycDetails.businessTaxId
        } : undefined
      });

      stripeAccountId = accountResult.stripeAccountId;
      console.log('Stripe account created:', stripeAccountId);
      console.log('Service Agreement:', accountResult.serviceAgreement);
      console.log('Capabilities:', accountResult.capabilities);
    }

    // Add external account (bank details) to Stripe
    console.log('Adding bank account to Stripe...');
    let bankAccountResult;
    try {
      bankAccountResult = await stripeConnectService.addExternalAccount({
        stripeAccountId,
        bankDetails,
        countryCode,
      });
      console.log('Bank account added to Stripe successfully:', bankAccountResult.externalAccountId);
    } catch (bankError) {
      console.log('Direct bank account creation failed, trying alternative approach...');
      console.error('Bank account error:', bankError);
      
      // Try alternative approach using account links
      try {
        const linkResult = await stripeConnectService.addExternalAccountViaLink(stripeAccountId);
        console.log('Account link created for bank setup:', linkResult.accountLink);
        
        // Return success with account link instead of direct bank account
        return NextResponse.json({
          success: true,
          message: 'Stripe account created successfully. Please complete bank account setup via the provided link.',
          stripeAccountId,
          kycStatus: 'PENDING',
          accountLink: linkResult.accountLink,
          setupMethod: 'account_link',
          nextSteps: 'Click the account link to complete your bank account setup securely with Stripe.',
        });
      } catch (linkError) {
        console.error('Account link creation also failed:', linkError);
        throw bankError; // Throw original bank account error
      }
    }

    // Save bank details to database with Stripe integration
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

    // Update business with Stripe account ID, KYC status, NTN, and postal code
    await prisma.business.update({
      where: { id: user.business.id },
      data: { 
        kycStatus: 'PENDING',
        stripeAccountId: stripeAccountId,
        ...(ntn && { ntn: ntn }), // Update NTN if provided
        ...(postalCode && { postalCode: postalCode }) // Update postal code if provided
      }
    });

    console.log('Bank details saved to database with Stripe integration');

    // Get updated business info to return enhanced details
    const updatedBusiness = await prisma.business.findUnique({
      where: { id: user.business.id },
      select: {
        stripeAccountId: true,
        serviceAgreement: true,
        capabilities: true,
        kycStatus: true,
        stripeAccountCreatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Bank details submitted successfully and sent to Stripe for verification',
      stripeAccountId,
      kycStatus: 'PENDING',
      serviceAgreement: updatedBusiness?.serviceAgreement,
      capabilities: updatedBusiness?.capabilities,
      accountCreatedAt: updatedBusiness?.stripeAccountCreatedAt,
      nextSteps: 'Your bank account is being verified by Stripe. You will receive updates on the verification status.',
      additionalInfo: {
        country: countryCode,
        businessType: user.business.businessType,
        accountType: updatedBusiness?.serviceAgreement === 'recipient' ? 'Payout-only Account' : 'Full Service Account'
      }
    });
  } catch (error) {
    console.error('Error onboarding bank details:', error);
    
    // Enhanced error handling
    if (error instanceof Error) {
      // Check for specific Stripe errors
      if (error.message.includes('card_payments capability')) {
        return NextResponse.json(
          { 
            error: 'Card payments not supported for this country',
            details: 'This country only supports payout transfers. Your account will be created for payout purposes only.',
            code: 'CARD_PAYMENTS_NOT_SUPPORTED'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('service_agreement') || error.message.includes('SERVICE_AGREEMENT_ERROR')) {
        return NextResponse.json(
          { 
            error: 'Service agreement configuration error',
            details: 'There was an issue configuring the service agreement for your country. This has been fixed in the latest update.',
            code: 'SERVICE_AGREEMENT_ERROR'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to submit bank details',
          details: error.message,
          code: 'ONBOARDING_ERROR'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to submit bank details',
        details: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

