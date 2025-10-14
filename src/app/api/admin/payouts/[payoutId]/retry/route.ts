import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { paymentService } from '@/lib/payment-service';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payoutId } = params;

    // Get payout details
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    if (payout.status !== 'FAILED') {
      return NextResponse.json({ 
        error: 'Only failed payouts can be retried' 
      }, { status: 400 });
    }

    // Retry the payout
    const result = await paymentService.retryFailedPayout(payoutId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Payout retry initiated successfully',
        data: {
          payoutId: result.payoutId,
          supplierTransferId: result.supplierTransferId,
          vendorTransferId: result.vendorTransferId,
          supplierTransferStatus: result.supplierTransferStatus,
          vendorTransferStatus: result.vendorTransferStatus
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Payout retry failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error retrying payout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
