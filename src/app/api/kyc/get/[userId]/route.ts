import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is accessing their own data or is admin
    if (session.id !== params.userId && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const kycDetails = await prisma.stripeKycDetails.findUnique({
      where: { userId: params.userId },
      select: {
        id: true,
        countryCode: true,
        accountType: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dobDay: true,
        dobMonth: true,
        dobYear: true,
        nationalId: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        businessName: true,
        businessTaxId: true,
        extraRequirements: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!kycDetails) {
      return NextResponse.json(
        { error: 'KYC details not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      kycDetails
    });
  } catch (error) {
    console.error('Error fetching KYC details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KYC details' },
      { status: 500 }
    );
  }
}
