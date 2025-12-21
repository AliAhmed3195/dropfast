import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { paymentService } from '@/lib/payment-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payoutIds, maxConcurrent = 5 } = await request.json();

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return NextResponse.json({ 
        error: 'payoutIds array is required' 
      }, { status: 400 });
    }

    // Get all payouts
    const payouts = await prisma.payout.findMany({
      where: {
        id: { in: payoutIds },
        status: { in: ['PENDING', 'APPROVAL_REQUIRED'] }
      },
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

    if (payouts.length === 0) {
      return NextResponse.json({ 
        error: 'No eligible payouts found' 
      }, { status: 404 });
    }

    // Process payouts in batches
    const results = [];
    const errors = [];

    for (let i = 0; i < payouts.length; i += maxConcurrent) {
      const batch = payouts.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (payout) => {
        try {
          // Check if required Stripe accounts exist
          if (!payout.order.product.supplier.business?.stripeAccount?.stripeAccountId) {
            throw new Error('Supplier does not have a Stripe Connect account');
          }

          if (!payout.order.store.owner.business?.stripeAccount?.stripeAccountId) {
            throw new Error('Vendor does not have a Stripe Connect account');
          }

          const result = await paymentService.processOrderPayout(payout.orderId);
          
          return {
            payoutId: payout.id,
            orderId: payout.orderId,
            success: result.success,
            error: result.error,
            supplierTransferId: result.supplierTransferId,
            vendorTransferId: result.vendorTransferId
          };
        } catch (error) {
          return {
            payoutId: payout.id,
            orderId: payout.orderId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Separate successful and failed results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} payouts`,
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results: results,
        summary: {
          successful: successful.map(r => ({
            payoutId: r.payoutId,
            orderId: r.orderId,
            supplierTransferId: r.supplierTransferId,
            vendorTransferId: r.vendorTransferId
          })),
          failed: failed.map(r => ({
            payoutId: r.payoutId,
            orderId: r.orderId,
            error: r.error
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error in bulk payout processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}