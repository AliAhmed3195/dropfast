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
      where: { id: payoutId },
      include: {
        order: {
          include: {
            product: {
              include: {
                supplier: {
                  include: { 
                    business: {
                      include: {
                        stripeAccount: true
                      }
                    }
                  }
                }
              }
            },
            store: {
              include: {
                owner: {
                  include: { 
                    business: {
                      include: {
                        stripeAccount: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    if (payout.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Payout already completed' }, { status: 400 });
    }

    if (payout.status === 'PROCESSING') {
      return NextResponse.json({ error: 'Payout already processing' }, { status: 400 });
    }

    // Check if required Stripe accounts exist
    if (!payout.order.product.supplier.business?.stripeAccount?.stripeAccountId) {
      return NextResponse.json({ 
        error: 'Supplier does not have a Stripe Connect account' 
      }, { status: 400 });
    }

    if (!payout.order.store.owner.business?.stripeAccount?.stripeAccountId) {
      return NextResponse.json({ 
        error: 'Vendor does not have a Stripe Connect account' 
      }, { status: 400 });
    }

    // Process the payout
    const result = await paymentService.processOrderPayout(payout.orderId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Payout processed successfully',
        data: {
          payoutId: result.payoutId,
          supplierTransferId: result.supplierTransferId,
          vendorTransferId: result.vendorTransferId,
          supplierTransferStatus: result.supplierTransferStatus,
          vendorTransferStatus: result.vendorTransferStatus,
          feeBreakdown: result.feeBreakdown
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Payout processing failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
