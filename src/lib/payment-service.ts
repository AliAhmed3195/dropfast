import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import StripeFeeCalculator, { PayoutBreakdown } from '@/lib/stripe-fee-calculator';
import { payoutErrorHandler, PayoutError, ErrorContext } from '@/lib/error-handler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export interface PayoutResult {
  success: boolean;
  payoutId: string;
  supplierTransferId?: string;
  vendorTransferId?: string;
  supplierTransferStatus?: string;
  vendorTransferStatus?: string;
  error?: string;
  feeBreakdown?: PayoutBreakdown;
}

export interface TransferResult {
  success: boolean;
  transferId?: string;
  status?: string;
  error?: string;
  amount?: number;
  currency?: string;
}

export interface OrderData {
  id: string;
  totalAmount: number;
  quantity: number;
  productPrice: number;
  markupAmount: number;
  supplier: {
    id: string;
    preferredCurrency: string;
    country: string;
    stripeAccountId?: string;
  };
  vendor: {
    id: string;
    preferredCurrency: string;
    country: string;
    stripeAccountId?: string;
  };
  customer: {
    country: string;
  };
}

export class PaymentService {
  private static instance: PaymentService;

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Process complete payout cycle for an order
   */
  async processOrderPayout(orderId: string): Promise<PayoutResult> {
    try {
      console.log(`Processing payout for order: ${orderId}`);

      // Get order with all related data
      const order = await this.getOrderWithRelations(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if payout already exists
      const existingPayout = await prisma.payout.findUnique({
        where: { orderId }
      });

      if (existingPayout && existingPayout.status === 'COMPLETED') {
        throw new Error('Payout already completed');
      }

      // Calculate fee breakdown
      const feeBreakdown = await this.calculatePayoutBreakdown(order);

      // Validate calculation
      if (!StripeFeeCalculator.validateCalculation(feeBreakdown)) {
        throw new Error('Invalid fee calculation');
      }

      // Check Stripe accounts
      if (!order.supplier.stripeAccountId || !order.vendor.stripeAccountId) {
        throw new Error('Missing Stripe Connect accounts');
      }

      // Create or update payout record
      const payout = await this.createOrUpdatePayoutRecord(orderId, feeBreakdown, existingPayout);

      // Update status to PROCESSING
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'PROCESSING' }
      });

      // Create status history
      await this.createStatusHistory(payout.id, 'PROCESSING', 'Payment processing started');

      // Execute transfers
      const transferResults = await this.executeTransfers(payout, feeBreakdown);

      // Update payout with transfer results
      await this.updatePayoutWithTransfers(payout.id, transferResults);

      // Check if all transfers succeeded
      const allTransfersSuccessful = transferResults.supplier.success && transferResults.vendor.success;

      if (allTransfersSuccessful) {
        // Mark as completed
        await prisma.payout.update({
          where: { id: payout.id },
          data: { 
            status: 'COMPLETED',
            processedAt: new Date()
          }
        });

        await this.createStatusHistory(payout.id, 'COMPLETED', 'All transfers completed successfully');

        console.log(`Payout ${payout.id} completed successfully`);
      } else {
        // Mark as failed
        await prisma.payout.update({
          where: { id: payout.id },
          data: { status: 'FAILED' }
        });

        await this.createStatusHistory(payout.id, 'FAILED', 'One or more transfers failed');

        console.log(`Payout ${payout.id} failed`);
      }

      return {
        success: allTransfersSuccessful,
        payoutId: payout.id,
        supplierTransferId: transferResults.supplier.transferId,
        vendorTransferId: transferResults.vendor.transferId,
        supplierTransferStatus: transferResults.supplier.status,
        vendorTransferStatus: transferResults.vendor.status,
        feeBreakdown,
        error: allTransfersSuccessful ? undefined : 'One or more transfers failed'
      };

    } catch (error) {
      console.error('Error processing payout:', error);
      return {
        success: false,
        payoutId: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute Stripe transfers to supplier and vendor
   */
  private async executeTransfers(payout: any, feeBreakdown: PayoutBreakdown): Promise<{
    supplier: TransferResult;
    vendor: TransferResult;
  }> {
    const { fees } = feeBreakdown;

    // Execute supplier transfer
    const supplierTransfer = await this.transferToSupplier(
      payout.supplierId,
      payout.supplier.stripeAccountId,
      fees.supplierAmount,
      'USD'
    );

    // Execute vendor transfer
    const vendorTransfer = await this.transferToVendor(
      payout.vendorId,
      payout.vendor.stripeAccountId,
      fees.netVendorAmount,
      'USD'
    );

    return {
      supplier: supplierTransfer,
      vendor: vendorTransfer
    };
  }

  /**
   * Execute Stripe transfer to supplier
   */
  async transferToSupplier(
    supplierId: string,
    accountId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<TransferResult> {
    const context: ErrorContext = {
      supplierId,
      operation: 'supplier_transfer',
      timestamp: new Date()
    };

    try {
      console.log(`Transferring ${amount} ${currency} to supplier ${supplierId}`);

      const transfer = await payoutErrorHandler.executeWithRetry(
        async () => {
          return await stripe.transfers.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            destination: accountId,
            transfer_group: `supplier_${supplierId}_${Date.now()}`,
            metadata: {
              type: 'supplier_payout',
              supplier_id: supplierId,
              source: 'fastdrop_platform'
            }
          });
        },
        context
      );

      console.log(`Supplier transfer created: ${transfer.id}`);

      return {
        success: true,
        transferId: transfer.id,
        status: transfer.status,
        amount,
        currency
      };

    } catch (error) {
      const payoutError = payoutErrorHandler.categorizeError(error, context);
      payoutErrorHandler.logError(payoutError);
      
      return {
        success: false,
        error: payoutError.message
      };
    }
  }

  /**
   * Execute Stripe transfer to vendor
   */
  async transferToVendor(
    vendorId: string,
    accountId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<TransferResult> {
    const context: ErrorContext = {
      vendorId,
      operation: 'vendor_transfer',
      timestamp: new Date()
    };

    try {
      console.log(`Transferring ${amount} ${currency} to vendor ${vendorId}`);

      const transfer = await payoutErrorHandler.executeWithRetry(
        async () => {
          return await stripe.transfers.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            destination: accountId,
            transfer_group: `vendor_${vendorId}_${Date.now()}`,
            metadata: {
              type: 'vendor_payout',
              vendor_id: vendorId,
              source: 'fastdrop_platform'
            }
          });
        },
        context
      );

      console.log(`Vendor transfer created: ${transfer.id}`);

      return {
        success: true,
        transferId: transfer.id,
        status: transfer.status,
        amount,
        currency
      };

    } catch (error) {
      const payoutError = payoutErrorHandler.categorizeError(error, context);
      payoutErrorHandler.logError(payoutError);
      
      return {
        success: false,
        error: payoutError.message
      };
    }
  }

  /**
   * Calculate payout breakdown for an order
   */
  private async calculatePayoutBreakdown(order: any): Promise<PayoutBreakdown> {
    const supplierBaseCost = order.productPrice * order.quantity;
    
    return StripeFeeCalculator.calculatePayoutBreakdown(
      order.totalAmount,
      supplierBaseCost,
      order.customer?.country || 'US',
      order.supplier.country || 'US',
      order.vendor.country || 'US',
      1 // Exchange rate - implement currency conversion if needed
    );
  }

  /**
   * Get order with all related data
   */
  private async getOrderWithRelations(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
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
    });
  }

  /**
   * Create or update payout record
   */
  private async createOrUpdatePayoutRecord(orderId: string, feeBreakdown: PayoutBreakdown, existingPayout: any) {
    const { fees } = feeBreakdown;
    const order = await this.getOrderWithRelations(orderId);

    if (existingPayout) {
      // Update existing payout
      return await prisma.payout.update({
        where: { id: existingPayout.id },
        data: {
          grossAmount: fees.grossAmount,
          stripeProcessingFee: fees.stripeProcessingFee,
          platformFee: fees.platformFee,
          supplierAmount: fees.supplierAmount,
          grossVendorAmount: fees.grossVendorAmount,
          stripePayoutFee: fees.stripePayoutFee,
          netVendorAmount: fees.netVendorAmount,
          platformRevenue: fees.platformRevenue,
          feeBreakdown: fees,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new payout
      return await prisma.payout.create({
        data: {
          orderId: orderId,
          supplierId: order.product.supplier.id,
          vendorId: order.store.owner.id,
          grossAmount: fees.grossAmount,
          stripeProcessingFee: fees.stripeProcessingFee,
          platformFee: fees.platformFee,
          supplierAmount: fees.supplierAmount,
          grossVendorAmount: fees.grossVendorAmount,
          stripePayoutFee: fees.stripePayoutFee,
          netVendorAmount: fees.netVendorAmount,
          platformRevenue: fees.platformRevenue,
          feeBreakdown: fees,
          status: 'PENDING',
          payoutMethod: 'STRIPE_CONNECT',
          baseCurrency: 'USD',
          supplierCurrency: order.product.supplier.business?.preferredCurrency || 'USD',
          vendorCurrency: order.store.owner.business?.preferredCurrency || 'USD'
        }
      });
    }
  }

  /**
   * Update payout with transfer results
   */
  private async updatePayoutWithTransfers(payoutId: string, transferResults: any) {
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        supplierTransferId: transferResults.supplier.transferId,
        vendorTransferId: transferResults.vendor.transferId,
        supplierTransferStatus: transferResults.supplier.status,
        vendorTransferStatus: transferResults.vendor.status
      }
    });
  }

  /**
   * Create status history record
   */
  private async createStatusHistory(payoutId: string, status: string, reason: string, notes?: string) {
    await prisma.payoutStatusHistory.create({
      data: {
        payoutId,
        status: status as any,
        reason,
        changedBy: 'system',
        notes
      }
    });
  }

  /**
   * Retry failed payout
   */
  async retryFailedPayout(payoutId: string): Promise<PayoutResult> {
    try {
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
              }
            }
          }
        }
      });

      if (!payout) {
        throw new Error('Payout not found');
      }

      if (payout.status !== 'FAILED') {
        throw new Error('Payout is not in failed status');
      }

      // Reset status and retry
      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'PENDING' }
      });

      return await this.processOrderPayout(payout.orderId);

    } catch (error) {
      console.error('Error retrying payout:', error);
      return {
        success: false,
        payoutId,
        error: error instanceof Error ? error.message : 'Retry failed'
      };
    }
  }

  /**
   * Get payout status from Stripe
   */
  async getStripeTransferStatus(transferId: string): Promise<any> {
    try {
      const transfer = await stripe.transfers.retrieve(transferId);
      return {
        id: transfer.id,
        status: transfer.status,
        amount: transfer.amount / 100, // Convert from cents
        currency: transfer.currency,
        destination: transfer.destination,
        created: transfer.created
      };
    } catch (error) {
      console.error('Error retrieving transfer status:', error);
      return null;
    }
  }
}

export const paymentService = PaymentService.getInstance();
