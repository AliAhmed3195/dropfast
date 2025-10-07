import { prisma } from './prisma';
import { payoutCalculator } from './payout-calculator';

export interface PayoutProcessingResult {
  success: boolean;
  payoutId: string;
  status: string;
  message: string;
  error?: string;
}

export class ScheduledPayoutProcessor {
  /**
   * Process all APPROVAL_REQUIRED payouts
   */
  async processApprovalRequiredPayouts(): Promise<PayoutProcessingResult[]> {
    console.log('Starting scheduled payout processing...');

    try {
      // Get all APPROVAL_REQUIRED payouts
      const payouts = await prisma.payout.findMany({
        where: {
          status: 'APPROVAL_REQUIRED'
        },
        include: {
          supplier: true,
          vendor: true,
          order: true
        },
        orderBy: {
          createdAt: 'asc' // Process oldest first
        }
      });

      console.log(`Found ${payouts.length} payouts ready for processing`);

      const results: PayoutProcessingResult[] = [];

      // Process each payout
      for (const payout of payouts) {
        try {
          const result = await this.processPayout(payout);
          results.push(result);
        } catch (error) {
          console.error(`Error processing payout ${payout.id}:`, error);
          results.push({
            success: false,
            payoutId: payout.id,
            status: 'FAILED',
            message: 'Processing failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`Processed ${payouts.length} payouts`);
      return results;

    } catch (error) {
      console.error('Error in scheduled payout processing:', error);
      throw error;
    }
  }

  /**
   * Process a single payout
   */
  async processPayout(payout: any): Promise<PayoutProcessingResult> {
    console.log(`Processing payout: ${payout.id}`);

    try {
      // Update status to PROCESSING
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'PROCESSING' }
      });

      // Create status history
      await prisma.payoutStatusHistory.create({
        data: {
          payoutId: payout.id,
          status: 'PROCESSING',
          reason: 'Scheduled processing started',
          changedBy: 'system',
          notes: 'Automated payout processing initiated'
        }
      });

      // Simulate payment processing (replace with actual payment logic)
      const paymentResult = await this.executePayment(payout);

      if (paymentResult.success) {
        // Update status to COMPLETED
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            payoutDate: new Date()
          }
        });

        // Create status history
        await prisma.payoutStatusHistory.create({
          data: {
            payoutId: payout.id,
            status: 'COMPLETED',
            reason: 'Payment processed successfully',
            changedBy: 'system',
            notes: `Payment processed via ${payout.payoutMethod}`
          }
        });

        console.log(`Payout ${payout.id} completed successfully`);
        return {
          success: true,
          payoutId: payout.id,
          status: 'COMPLETED',
          message: 'Payment processed successfully'
        };

      } else {
        // Update status to FAILED
        await prisma.payout.update({
          where: { id: payout.id },
          data: { status: 'FAILED' }
        });

        // Create status history
        await prisma.payoutStatusHistory.create({
          data: {
            payoutId: payout.id,
            status: 'FAILED',
            reason: 'Payment processing failed',
            changedBy: 'system',
            notes: paymentResult.error || 'Payment processing failed'
          }
        });

        console.log(`Payout ${payout.id} failed: ${paymentResult.error}`);
        return {
          success: false,
          payoutId: payout.id,
          status: 'FAILED',
          message: 'Payment processing failed',
          error: paymentResult.error
        };
      }

    } catch (error) {
      console.error(`Error processing payout ${payout.id}:`, error);

      // Update status to FAILED
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'FAILED' }
      });

      // Create status history
      await prisma.payoutStatusHistory.create({
        data: {
          payoutId: payout.id,
          status: 'FAILED',
          reason: 'Processing error',
          changedBy: 'system',
          notes: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        success: false,
        payoutId: payout.id,
        status: 'FAILED',
        message: 'Processing error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute payment (simulate for now)
   */
  private async executePayment(payout: any): Promise<{ success: boolean; error?: string }> {
    console.log(`Executing payment for payout ${payout.id}`);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate payment success/failure (90% success rate for demo)
    const success = Math.random() > 0.1;

    if (success) {
      console.log(`Payment successful for payout ${payout.id}`);
      return { success: true };
    } else {
      console.log(`Payment failed for payout ${payout.id}`);
      return { 
        success: false, 
        error: 'Simulated payment failure' 
      };
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<{
    totalPayouts: number;
    approvalRequired: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [totalPayouts, approvalRequired, processing, completed, failed] = await Promise.all([
      prisma.payout.count(),
      prisma.payout.count({ where: { status: 'APPROVAL_REQUIRED' } }),
      prisma.payout.count({ where: { status: 'PROCESSING' } }),
      prisma.payout.count({ where: { status: 'COMPLETED' } }),
      prisma.payout.count({ where: { status: 'FAILED' } })
    ]);

    return {
      totalPayouts,
      approvalRequired,
      processing,
      completed,
      failed
    };
  }

  /**
   * Retry failed payouts
   */
  async retryFailedPayouts(): Promise<PayoutProcessingResult[]> {
    console.log('Retrying failed payouts...');

    const failedPayouts = await prisma.payout.findMany({
      where: { status: 'FAILED' },
      include: {
        supplier: true,
        vendor: true,
        order: true
      }
    });

    console.log(`Found ${failedPayouts.length} failed payouts to retry`);

    const results: PayoutProcessingResult[] = [];

    for (const payout of failedPayouts) {
      try {
        const result = await this.processPayout(payout);
        results.push(result);
      } catch (error) {
        console.error(`Error retrying payout ${payout.id}:`, error);
        results.push({
          success: false,
          payoutId: payout.id,
          status: 'FAILED',
          message: 'Retry failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const scheduledPayoutProcessor = new ScheduledPayoutProcessor();
