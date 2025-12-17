import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/admin/payouts/[payoutId] - Get payout details
export async function GET(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: params.payoutId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            business: {
              select: {
                preferredCurrency: true
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            business: {
              select: {
                preferredCurrency: true
              }
            }
          }
        },
        order: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' }
        }
      }
    });

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ payout });

  } catch (error) {
    console.error('Error fetching payout details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/payouts/[payoutId] - Update payout status
export async function PUT(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, reason, notes, payoutMethod, payoutDate } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Get current payout
    const currentPayout = await prisma.payout.findUnique({
      where: { id: params.payoutId }
    });

    if (!currentPayout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    // Update payout
    const updatedPayout = await prisma.payout.update({
      where: { id: params.payoutId },
      data: {
        status: status as any,
        payoutMethod: payoutMethod ? payoutMethod as any : undefined,
        payoutDate: payoutDate ? new Date(payoutDate) : undefined,
        processedAt: status === 'COMPLETED' ? new Date() : undefined,
        approvedBy: status === 'APPROVAL_REQUIRED' ? session.id : undefined,
        approvedAt: status === 'APPROVAL_REQUIRED' ? new Date() : undefined,
        approvalNotes: notes
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            business: {
              select: {
                preferredCurrency: true
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            business: {
              select: {
                preferredCurrency: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true
          }
        }
      }
    });

    // Create status history entry
    await prisma.payoutStatusHistory.create({
      data: {
        payoutId: params.payoutId,
        status: status as any,
        reason,
        changedBy: session.id,
        notes
      }
    });

    return NextResponse.json({
      success: true,
      payout: updatedPayout
    });

  } catch (error) {
    console.error('Error updating payout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payouts/[payoutId] - Cancel payout
export async function DELETE(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason } = await request.json();

    // Update payout status to CANCELLED
    const updatedPayout = await prisma.payout.update({
      where: { id: params.payoutId },
      data: {
        status: 'CANCELLED'
      }
    });

    // Create status history entry
    await prisma.payoutStatusHistory.create({
      data: {
        payoutId: params.payoutId,
        status: 'CANCELLED',
        reason,
        changedBy: session.id,
        notes: 'Payout cancelled by admin'
      }
    });

    return NextResponse.json({
      success: true,
      payout: updatedPayout
    });

  } catch (error) {
    console.error('Error cancelling payout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
