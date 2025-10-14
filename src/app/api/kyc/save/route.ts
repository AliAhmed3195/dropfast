import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { validateKycData } from '@/lib/kyc-country-requirements';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'VENDOR_USER' && session.role !== 'SUPPLIER_USER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      countryCode,
      accountType,
      firstName,
      lastName,
      email,
      phone,
      dobDay,
      dobMonth,
      dobYear,
      nationalId,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      businessName,
      businessTaxId,
      extraRequirements
    } = await request.json();

    // Validate required fields
    if (!countryCode || !accountType || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate KYC data
    const validation = validateKycData(countryCode, {
      dobDay,
      dobMonth,
      dobYear,
      nationalId,
      postalCode,
      addressLine1,
      city,
      state
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Check if KYC details already exist
    const existingKyc = await prisma.stripeKycDetails.findUnique({
      where: { userId: session.id }
    });

    if (existingKyc) {
      // Update existing KYC details
      const updatedKyc = await prisma.stripeKycDetails.update({
        where: { userId: session.id },
        data: {
          countryCode,
          accountType,
          firstName,
          lastName,
          email,
          phone,
          dobDay,
          dobMonth,
          dobYear,
          nationalId,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          businessName: accountType === 'company' ? businessName : null,
          businessTaxId: accountType === 'company' ? businessTaxId : null,
          extraRequirements: extraRequirements || null,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'KYC details updated successfully',
        kycDetails: updatedKyc
      });
    } else {
      // Create new KYC details
      const newKyc = await prisma.stripeKycDetails.create({
        data: {
          userId: session.id,
          countryCode,
          accountType,
          firstName,
          lastName,
          email,
          phone,
          dobDay,
          dobMonth,
          dobYear,
          nationalId,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          businessName: accountType === 'company' ? businessName : null,
          businessTaxId: accountType === 'company' ? businessTaxId : null,
          extraRequirements: extraRequirements || null
        }
      });

      return NextResponse.json({
        success: true,
        message: 'KYC details saved successfully',
        kycDetails: newKyc
      });
    }
  } catch (error) {
    console.error('Error saving KYC details:', error);
    return NextResponse.json(
      { error: 'Failed to save KYC details' },
      { status: 500 }
    );
  }
}
