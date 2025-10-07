import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/user/bank-details - Get user's bank details
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bankDetails = await prisma.bankDetails.findUnique({
      where: { userId: session.id }
    });

    if (!bankDetails) {
      return NextResponse.json({ 
        bankDetails: null,
        hasBankDetails: false 
      });
    }

    // Don't return sensitive information like account number
    const safeBankDetails = {
      id: bankDetails.id,
      bankName: bankDetails.bankName,
      accountHolderName: bankDetails.accountHolderName,
      // Mask account number
      accountNumber: bankDetails.accountNumber ? 
        `****${bankDetails.accountNumber.slice(-4)}` : null,
      routingNumber: bankDetails.routingNumber,
      swiftCode: bankDetails.swiftCode,
      iban: bankDetails.iban,
      bankAddress: bankDetails.bankAddress,
      bankCity: bankDetails.bankCity,
      bankCountry: bankDetails.bankCountry,
      bankPostalCode: bankDetails.bankPostalCode,
      taxId: bankDetails.taxId,
      taxIdType: bankDetails.taxIdType,
      isVerified: bankDetails.isVerified,
      verifiedAt: bankDetails.verifiedAt,
      isActive: bankDetails.isActive,
      createdAt: bankDetails.createdAt,
      updatedAt: bankDetails.updatedAt
    };

    return NextResponse.json({ 
      bankDetails: safeBankDetails,
      hasBankDetails: true 
    });

  } catch (error) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user/bank-details - Create or update user's bank details
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bankName,
      accountHolderName,
      accountNumber,
      routingNumber,
      swiftCode,
      iban,
      bankAddress,
      bankCity,
      bankCountry,
      bankPostalCode,
      taxId,
      taxIdType
    } = body;

    // Validate required fields
    if (!bankName || !accountHolderName || !accountNumber || !bankAddress || !bankCity || !bankCountry) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if bank details already exist
    const existingBankDetails = await prisma.bankDetails.findUnique({
      where: { userId: session.id }
    });

    let bankDetails;

    if (existingBankDetails) {
      // Update existing bank details
      bankDetails = await prisma.bankDetails.update({
        where: { userId: session.id },
        data: {
          bankName,
          accountHolderName,
          accountNumber,
          routingNumber,
          swiftCode,
          iban,
          bankAddress,
          bankCity,
          bankCountry,
          bankPostalCode,
          taxId,
          taxIdType,
          isVerified: false, // Reset verification status
          verifiedAt: null,
          verifiedBy: null,
          notes: null,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new bank details
      bankDetails = await prisma.bankDetails.create({
        data: {
          userId: session.id,
          bankName,
          accountHolderName,
          accountNumber,
          routingNumber,
          swiftCode,
          iban,
          bankAddress,
          bankCity,
          bankCountry,
          bankPostalCode,
          taxId,
          taxIdType
        }
      });
    }

    // Check for ON_HOLD payouts and update them
    await checkAndUpdateOnHoldPayouts(session.id);

    return NextResponse.json({
      success: true,
      message: 'Bank details saved successfully',
      bankDetails: {
        id: bankDetails.id,
        bankName: bankDetails.bankName,
        accountHolderName: bankDetails.accountHolderName,
        isVerified: bankDetails.isVerified
      }
    });

  } catch (error) {
    console.error('Error saving bank details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check and update ON_HOLD payouts
async function checkAndUpdateOnHoldPayouts(userId: string) {
  try {
    // Find all ON_HOLD payouts for this user
    const onHoldPayouts = await prisma.payout.findMany({
      where: {
        OR: [
          { supplierId: userId, status: 'ON_HOLD' },
          { vendorId: userId, status: 'ON_HOLD' }
        ]
      },
      include: {
        supplier: {
          include: { bankDetails: true }
        },
        vendor: {
          include: { bankDetails: true }
        }
      }
    });

    // Check each payout
    for (const payout of onHoldPayouts) {
      const supplierHasBankDetails = payout.supplier.bankDetails?.isActive || false;
      const vendorHasBankDetails = payout.vendor.bankDetails?.isActive || false;

      if (supplierHasBankDetails && vendorHasBankDetails) {
        // Update payout status to APPROVAL_REQUIRED
        await prisma.payout.update({
          where: { id: payout.id },
          data: { status: 'APPROVAL_REQUIRED' }
        });

        // Create status history
        await prisma.payoutStatusHistory.create({
          data: {
            payoutId: payout.id,
            status: 'APPROVAL_REQUIRED',
            reason: 'Bank details provided - ready for review',
            changedBy: 'system',
            notes: 'Payout moved from ON_HOLD to APPROVAL_REQUIRED after bank details were provided'
          }
        });

        console.log(`Payout ${payout.id} moved from ON_HOLD to APPROVAL_REQUIRED`);
      }
    }
  } catch (error) {
    console.error('Error checking ON_HOLD payouts:', error);
  }
}
