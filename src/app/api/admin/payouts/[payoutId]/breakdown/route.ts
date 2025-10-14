import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import StripeFeeCalculator from '@/lib/stripe-fee-calculator';

export async function GET(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payoutId } = params;

    // Get payout with all related data
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        order: {
          include: {
            product: {
              include: {
                supplier: {
                  include: { business: true }
                }
              }
            },
            store: {
              include: {
                owner: {
                  include: { business: true }
                }
              }
            },
            customer: true
          }
        }
      }
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    // Calculate fee breakdown
    const order = payout.order;
    const supplierBaseCost = order.productPrice * order.quantity;
    
    const feeBreakdown = StripeFeeCalculator.calculatePayoutBreakdown(
      order.totalAmount,
      supplierBaseCost,
      order.customer?.country || 'US',
      order.product.supplier.business?.country || 'US',
      order.store.owner.business?.country || 'US',
      1 // Exchange rate - implement currency conversion if needed
    );

    // Get fee summary
    const feeSummary = StripeFeeCalculator.getFeeSummary(feeBreakdown);

    // Get country fee information
    const supplierCountryInfo = StripeFeeCalculator.getCountryFeeInfo(
      order.product.supplier.business?.country || 'US'
    );
    const vendorCountryInfo = StripeFeeCalculator.getCountryFeeInfo(
      order.store.owner.business?.country || 'US'
    );

    return NextResponse.json({
      success: true,
      data: {
        payout: {
          id: payout.id,
          status: payout.status,
          createdAt: payout.createdAt,
          processedAt: payout.processedAt,
          grossAmount: payout.grossAmount,
          stripeProcessingFee: payout.stripeProcessingFee,
          platformFee: payout.platformFee,
          supplierAmount: payout.supplierAmount,
          grossVendorAmount: payout.grossVendorAmount,
          stripePayoutFee: payout.stripePayoutFee,
          netVendorAmount: payout.netVendorAmount,
          platformRevenue: payout.platformRevenue,
          supplierTransferId: payout.supplierTransferId,
          vendorTransferId: payout.vendorTransferId,
          supplierTransferStatus: payout.supplierTransferStatus,
          vendorTransferStatus: payout.vendorTransferStatus
        },
        order: {
          id: order.id,
          totalAmount: order.totalAmount,
          quantity: order.quantity,
          productPrice: order.productPrice,
          markupAmount: order.markupAmount,
          supplierBaseCost: supplierBaseCost
        },
        parties: {
          supplier: {
            id: order.product.supplier.id,
            name: order.product.supplier.name,
            email: order.product.supplier.email,
            country: order.product.supplier.business?.country || 'US',
            currency: order.product.supplier.business?.preferredCurrency || 'USD',
            stripeAccountId: order.product.supplier.business?.stripeAccountId,
            stripeAccountStatus: order.product.supplier.business?.stripeAccountStatus
          },
          vendor: {
            id: order.store.owner.id,
            name: order.store.owner.name,
            email: order.store.owner.email,
            country: order.store.owner.business?.country || 'US',
            currency: order.store.owner.business?.preferredCurrency || 'USD',
            stripeAccountId: order.store.owner.business?.stripeAccountId,
            stripeAccountStatus: order.store.owner.business?.stripeAccountStatus
          },
          customer: {
            country: order.customer?.country || 'US'
          }
        },
        feeBreakdown: feeBreakdown,
        feeSummary: feeSummary,
        countryInfo: {
          supplier: supplierCountryInfo,
          vendor: vendorCountryInfo
        },
        validation: {
          isValid: StripeFeeCalculator.validateCalculation(feeBreakdown),
          totalFees: feeSummary.totalFees,
          netAmount: feeSummary.netAmount,
          feePercentage: feeSummary.feePercentage,
          netPercentage: feeSummary.netPercentage
        }
      }
    });

  } catch (error) {
    console.error('Error getting payout breakdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
