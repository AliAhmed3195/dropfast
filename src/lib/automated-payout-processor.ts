import { prisma } from '@/lib/prisma';
import { paymentService } from '@/lib/payment-service';
import StripeFeeCalculator from '@/lib/stripe-fee-calculator';

export interface ProcessingResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  results: Array<{
    payoutId: string;
    orderId: string;
    success: boolean;
    error?: string;
  }>;
}

export interface RetryResult {
  success: boolean;
  retried: number;
  failed: number;
  errors: string[];
  results: Array<{
    payoutId: string;
    success: boolean;
    error?: string;
  }>;
}

export class AutomatedPayoutProcessor {
  private static instance: AutomatedPayoutProcessor;
  private isProcessing = false;
  private isRetrying = false;

  public static getInstance(): AutomatedPayoutProcessor {
    if (!AutomatedPayoutProcessor.instance) {
      AutomatedPayoutProcessor.instance = new AutomatedPayoutProcessor();
    }
    return AutomatedPayoutProcessor.instance;
  }

  /**
   * Process all approved payouts automatically
   */
  async processApprovedPayouts(
    batchSize: number = 10,
    maxConcurrent: number = 5
  ): Promise<ProcessingResult> {
    if (this.isProcessing) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: ['Another processing operation is already running'],
        results: []
      };
    }

    this.isProcessing = true;

    try {
      console.log('Starting automated payout processing...');

      // Get all approved payouts
      const approvedPayouts = await this.getApprovedPayouts(batchSize);

      if (approvedPayouts.length === 0) {
        console.log('No approved payouts to process');
        return {
          success: true,
          processed: 0,
          failed: 0,
          errors: [],
          results: []
        };
      }

      console.log(`Found ${approvedPayouts.length} approved payouts to process`);

      // Process payouts in batches
      const results = [];
      const errors = [];

      for (let i = 0; i < approvedPayouts.length; i += maxConcurrent) {
        const batch = approvedPayouts.slice(i, i + maxConcurrent);
        
        const batchPromises = batch.map(async (payout) => {
          try {
            // Validate payout before processing
            const validation = await this.validatePayout(payout);
            if (!validation.isValid) {
              throw new Error(validation.error);
            }

            const result = await paymentService.processOrderPayout(payout.orderId);
            
            return {
              payoutId: payout.id,
              orderId: payout.orderId,
              success: result.success,
              error: result.error
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Payout ${payout.id}: ${errorMessage}`);
            
            return {
              payoutId: payout.id,
              orderId: payout.orderId,
              success: false,
              error: errorMessage
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid rate limiting
        if (i + maxConcurrent < approvedPayouts.length) {
          await this.delay(1000); // 1 second delay
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      console.log(`Processing completed: ${successful.length} successful, ${failed.length} failed`);

      return {
        success: true,
        processed: successful.length,
        failed: failed.length,
        errors,
        results
      };

    } catch (error) {
      console.error('Error in automated payout processing:', error);
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        results: []
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retry failed payouts
   */
  async retryFailedPayouts(
    batchSize: number = 10,
    maxConcurrent: number = 5
  ): Promise<RetryResult> {
    if (this.isRetrying) {
      return {
        success: false,
        retried: 0,
        failed: 0,
        errors: ['Another retry operation is already running'],
        results: []
      };
    }

    this.isRetrying = true;

    try {
      console.log('Starting automated payout retry...');

      // Get failed payouts
      const failedPayouts = await this.getFailedPayouts(batchSize);

      if (failedPayouts.length === 0) {
        console.log('No failed payouts to retry');
        return {
          success: true,
          retried: 0,
          failed: 0,
          errors: [],
          results: []
        };
      }

      console.log(`Found ${failedPayouts.length} failed payouts to retry`);

      // Retry payouts in batches
      const results = [];
      const errors = [];

      for (let i = 0; i < failedPayouts.length; i += maxConcurrent) {
        const batch = failedPayouts.slice(i, i + maxConcurrent);
        
        const batchPromises = batch.map(async (payout) => {
          try {
            const result = await paymentService.retryFailedPayout(payout.id);
            
            return {
              payoutId: payout.id,
              success: result.success,
              error: result.error
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Payout ${payout.id}: ${errorMessage}`);
            
            return {
              payoutId: payout.id,
              success: false,
              error: errorMessage
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches
        if (i + maxConcurrent < failedPayouts.length) {
          await this.delay(1000);
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      console.log(`Retry completed: ${successful.length} successful, ${failed.length} failed`);

      return {
        success: true,
        retried: successful.length,
        failed: failed.length,
        errors,
        results
      };

    } catch (error) {
      console.error('Error in automated payout retry:', error);
      return {
        success: false,
        retried: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        results: []
      };
    } finally {
      this.isRetrying = false;
    }
  }

  /**
   * Get approved payouts ready for processing
   */
  private async getApprovedPayouts(limit: number) {
    return await prisma.payout.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVAL_REQUIRED'] },
        isLocked: false
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
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: limit
    });
  }

  /**
   * Get failed payouts for retry
   */
  private async getFailedPayouts(limit: number) {
    return await prisma.payout.findMany({
      where: {
        status: 'FAILED',
        isLocked: false
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
      },
      orderBy: {
        updatedAt: 'asc'
      },
      take: limit
    });
  }

  /**
   * Validate payout before processing
   */
  private async validatePayout(payout: any): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Check if payout is locked
      if (payout.isLocked) {
        return { isValid: false, error: 'Payout is locked' };
      }

      // Check if payout is already processed
      if (payout.status === 'COMPLETED') {
        return { isValid: false, error: 'Payout already completed' };
      }

      // Check if payout is processing
      if (payout.status === 'PROCESSING') {
        return { isValid: false, error: 'Payout already processing' };
      }

      // Check Stripe accounts
      if (!payout.order.product.supplier.business?.stripeAccount?.stripeAccountId) {
        return { isValid: false, error: 'Supplier does not have a Stripe Connect account' };
      }

      if (!payout.order.store.owner.business?.stripeAccount?.stripeAccountStatus || 
          payout.order.store.owner.business.stripeAccount.stripeAccountStatus !== 'verified') {
        return { isValid: false, error: 'Vendor Stripe account is not verified' };
      }

      if (!payout.order.product.supplier.business?.stripeAccount?.stripeAccountStatus || 
          payout.order.product.supplier.business.stripeAccount.stripeAccountStatus !== 'verified') {
        return { isValid: false, error: 'Supplier Stripe account is not verified' };
      }

      // Check payout capabilities
      if (!payout.order.store.owner.business?.stripeAccount?.stripePayoutsEnabled) {
        return { isValid: false, error: 'Vendor payouts are not enabled' };
      }

      if (!payout.order.product.supplier.business?.stripeAccount?.stripePayoutsEnabled) {
        return { isValid: false, error: 'Supplier payouts are not enabled' };
      }

      // Validate fee calculation
      const supplierBaseCost = payout.order.productPrice * payout.order.quantity;
      const feeBreakdown = StripeFeeCalculator.calculatePayoutBreakdown(
        payout.order.totalAmount,
        supplierBaseCost,
        payout.order.customer?.country || 'US',
        payout.order.product.supplier.business?.country || 'US',
        payout.order.store.owner.business?.country || 'US'
      );

      if (!StripeFeeCalculator.validateCalculation(feeBreakdown)) {
        return { isValid: false, error: 'Invalid fee calculation' };
      }

      // Check minimum amounts
      if (feeBreakdown.fees.supplierAmount < 0.50) {
        return { isValid: false, error: 'Supplier amount too small (minimum $0.50)' };
      }

      if (feeBreakdown.fees.netVendorAmount < 0.50) {
        return { isValid: false, error: 'Vendor amount too small (minimum $0.50)' };
      }

      return { isValid: true };

    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Validation error' 
      };
    }
  }

  /**
   * Get processing status
   */
  getProcessingStatus(): { isProcessing: boolean; isRetrying: boolean } {
    return {
      isProcessing: this.isProcessing,
      isRetrying: this.isRetrying
    };
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const [pending, processing, completed, failed, total] = await Promise.all([
      prisma.payout.count({ where: { status: { in: ['PENDING', 'APPROVAL_REQUIRED'] } } }),
      prisma.payout.count({ where: { status: 'PROCESSING' } }),
      prisma.payout.count({ where: { status: 'COMPLETED' } }),
      prisma.payout.count({ where: { status: 'FAILED' } }),
      prisma.payout.count()
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      total
    };
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const automatedPayoutProcessor = AutomatedPayoutProcessor.getInstance();
