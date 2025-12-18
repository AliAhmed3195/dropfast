import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// POST /api/admin/bank-details/verify - Verify user's bank details
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, verified, notes } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if bank details exist
    const bankDetails = await prisma.bankDetails.findUnique({
      where: { userId }
    });

    if (!bankDetails) {
      return NextResponse.json(
        { error: 'Bank details not found' },
        { status: 404 }
      );
    }

    // Update verification status
    const updatedBankDetails = await prisma.bankDetails.update({
      where: { userId },
      data: {
        isVerified: verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? session.id : null
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bank details ${verified ? 'verified' : 'unverified'} successfully`,
      bankDetails: {
        id: updatedBankDetails.id,
        isVerified: updatedBankDetails.isVerified,
        verifiedAt: updatedBankDetails.verifiedAt,
        verifiedBy: updatedBankDetails.verifiedBy
      }
    });

  } catch (error) {
    console.error('Error verifying bank details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/bank-details/verify - Get all bank details for admin review
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'verified', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: any = {};
    if (status === 'pending') {
      where.isVerified = false;
    } else if (status === 'verified') {
      where.isVerified = true;
    }

    // Get bank details with user information
    const bankDetails = await prisma.bankDetails.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count
    const total = await prisma.bankDetails.count({ where });

    return NextResponse.json({
      success: true,
      bankDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching bank details for admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
