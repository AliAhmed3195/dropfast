import { prisma } from '@/lib/prisma';
import { stripe, calculatePaymentDistribution } from '@/lib/stripe';
import { currencyService } from '@/lib/currency-conversion';

export interface PayoutData {
  orderId: string;
  supplierId: string;
  vendorId: string;
  supplierAmount: number; // In USD
  vendorAmount: number; // In USD
  platformFee: number; // In USD
  totalAmount: number; // In USD
  displayCurrency: string; // Customer's currency
  displayAmount: number; // Amount customer paid
}

export class PayoutService {
  private static instance: PayoutService;

  private constructor() {}

  public static getInstance(): PayoutService {
    if (!PayoutService.instance) {
      PayoutService.instance = new PayoutService();
    }
    return PayoutService.instance;
  }

  // Process payouts for a completed order
  public async processOrderPayouts(payoutData: PayoutData): Promise<void> {
    try {
      console.log('Processing payouts for order:', payoutData.orderId);

      // Create payout record in database
      const payout = await prisma.payout.create({
        data: {
          orderId: payoutData.orderId,
          supplierId: payoutData.supplierId,
          vendorId: payoutData.vendorId,
          supplierAmount: payoutData.supplierAmount,
          netVendorAmount: payoutData.vendorAmount || 0,
          platformFee: payoutData.platformFee,
          status: 'PENDING',
        },
      });

      // Get supplier and vendor Stripe Connect accounts
      const supplier = await prisma.user.findUnique({
        where: { id: payoutData.supplierId },
        include: { 
          business: {
            include: {
              stripeAccount: true
            }
          }
        },
      });

      const vendor = await prisma.user.findUnique({
        where: { id: payoutData.vendorId },
        include: { 
          business: {
            include: {
              stripeAccount: true
            }
          }
        },
      });

      const supplierStripeAccountId = supplier?.business?.stripeAccount?.stripeAccountId;
      const vendorStripeAccountId = vendor?.business?.stripeAccount?.stripeAccountId;
      if (!supplierStripeAccountId || !vendorStripeAccountId) {
        throw new Error('Missing Stripe Connect accounts for supplier or vendor');
      }

      // Update payout status to processing
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'PROCESSING' },
      });

      // Process supplier payout
      if (payoutData.supplierAmount > 0) {
        await this.processSupplierPayout(payout.id, supplierStripeAccountId, payoutData.supplierAmount);
      }

      // Process vendor payout
      if (payoutData.vendorAmount > 0) {
        await this.processVendorPayout(payout.id, vendorStripeAccountId, payoutData.vendorAmount);
      }

      // Mark payout as completed
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'COMPLETED' },
      });

      console.log('Payouts processed successfully for order:', payoutData.orderId);
    } catch (error) {
      console.error('Error processing payouts:', error);
      
      // Mark payout as failed
      await prisma.payout.updateMany({
        where: { orderId: payoutData.orderId },
        data: { status: 'FAILED' },
      });
      
      throw error;
    }
  }

  // Process supplier payout
  private async processSupplierPayout(
    payoutId: string,
    supplierAccountId: string,
    amount: number
  ): Promise<void> {
    try {
      console.log(`Processing supplier payout: $${amount} to account ${supplierAccountId}`);

      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination: supplierAccountId,
        metadata: {
          payoutId,
          type: 'supplier',
        },
      });

      // Update payout with Stripe transfer ID
      await prisma.payout.update({
        where: { id: payoutId },
        data: { stripeTransferId: transfer.id },
      });

      console.log('Supplier payout completed:', transfer.id);
    } catch (error) {
      console.error('Error processing supplier payout:', error);
      throw error;
    }
  }

  // Process vendor payout
  private async processVendorPayout(
    payoutId: string,
    vendorAccountId: string,
    amount: number
  ): Promise<void> {
    try {
      console.log(`Processing vendor payout: $${amount} to account ${vendorAccountId}`);

      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination: vendorAccountId,
        metadata: {
          payoutId,
          type: 'vendor',
        },
      });

      console.log('Vendor payout completed:', transfer.id);
    } catch (error) {
      console.error('Error processing vendor payout:', error);
      throw error;
    }
  }

  // Get payout history for a user
  public async getPayoutHistory(userId: string, userRole: 'SUPPLIER' | 'VENDOR'): Promise<any[]> {
    const payouts = await prisma.payout.findMany({
      where: userRole === 'SUPPLIER' 
        ? { supplierId: userId }
        : { vendorId: userId },
      include: {
        order: {
          include: {
            product: true,
            store: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payouts;
  }

  // Calculate payout amounts for an order
  public async calculatePayoutAmounts(
    orderId: string,
    totalAmount: number,
    displayCurrency: string
  ): Promise<PayoutData | null> {
    try {
      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          product: {
            include: {
              supplier: true,
            },
          },
          store: {
            include: {
              owner: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Convert display amount to USD for calculations
      const totalAmountUSD = await currencyService.convertToUSD(totalAmount, displayCurrency);

      // Calculate payment distribution
      const distribution = calculatePaymentDistribution(
        totalAmountUSD,
        order.lockedUSDPrice || order.productPrice,
        5 // 5% platform fee
      );

      return {
        orderId,
        supplierId: order.product.supplierId,
        vendorId: order.store.ownerId,
        supplierAmount: distribution.supplierAmount,
        vendorAmount: distribution.vendorAmount,
        platformFee: distribution.platformFee,
        totalAmount: totalAmountUSD,
        displayCurrency,
        displayAmount: totalAmount,
      };
    } catch (error) {
      console.error('Error calculating payout amounts:', error);
      return null;
    }
  }

  // Get payout statistics
  public async getPayoutStats(userId: string, userRole: 'SUPPLIER' | 'VENDOR'): Promise<{
    totalPayouts: number;
    totalAmount: number;
    pendingAmount: number;
    completedAmount: number;
  }> {
    const payouts = await prisma.payout.findMany({
      where: userRole === 'SUPPLIER' 
        ? { supplierId: userId }
        : { vendorId: userId },
    });

    const totalPayouts = payouts.length;
    const totalAmount = payouts.reduce((sum, payout) => {
      return sum + (userRole === 'SUPPLIER' ? payout.supplierAmount : payout.netVendorAmount || 0);
    }, 0);

    const pendingAmount = payouts
      .filter(p => p.status === 'PENDING')
      .reduce((sum, payout) => {
        return sum + (userRole === 'SUPPLIER' ? payout.supplierAmount : payout.netVendorAmount || 0);
      }, 0);

    const completedAmount = payouts
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, payout) => {
        return sum + (userRole === 'SUPPLIER' ? payout.supplierAmount : payout.netVendorAmount || 0);
      }, 0);

    return {
      totalPayouts,
      totalAmount,
      pendingAmount,
      completedAmount,
    };
  }
}

export const payoutService = PayoutService.getInstance();
export default payoutService;