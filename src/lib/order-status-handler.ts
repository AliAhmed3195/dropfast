import { prisma } from './prisma';
import { payoutCalculator } from './payout-calculator';

export interface OrderStatusChangeEvent {
  orderId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  reason?: string;
}

export class OrderStatusHandler {
  /**
   * Handle order status changes and trigger appropriate actions
   */
  static async handleStatusChange(orderId: string, newStatus: string) {
    console.log(`Order ${orderId} status changed to ${newStatus}`);

    try {
      switch (newStatus) {
        case 'PENDING':
          await this.handleOrderCreated(orderId);
          break;
        case 'AWAITING_SUPPLIER_CONFIRMATION':
          await this.handleOrderForwardedToSupplier(orderId);
          break;
        case 'CONFIRMED':
          await this.handleOrderConfirmed(orderId);
          break;
        case 'PACKED':
          await this.handleOrderPacked(orderId);
          break;
        case 'HANDED_TO_COURIER':
          await this.handleOrderHandedToCourier(orderId);
          break;
        case 'SHIPPED':
          await this.handleOrderShipped(orderId);
          break;
        case 'DELIVERED':
          await this.handleOrderDelivered(orderId);
          break;
        case 'CANCELLED':
          await this.handleOrderCancelled(orderId);
          break;
        case 'REFUNDED':
          await this.handleOrderRefunded(orderId);
          break;
        default:
          console.log(`No specific handler for status: ${newStatus}`);
      }
    } catch (error) {
      console.error(`Error handling order status change for ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Handle order created - payout already created at order creation
   */
  private static async handleOrderCreated(orderId: string) {
    console.log(`Order created: ${orderId} - payout should already exist`);
    
    // Payout is already created at order creation
    // No additional action needed
    return null;
  }

  /**
   * Handle order forwarded to supplier
   */
  private static async handleOrderForwardedToSupplier(orderId: string) {
    console.log(`Order forwarded to supplier: ${orderId}`);
    
    // TODO: Send notification to supplier
    // TODO: Send notification to customer
    
    return null;
  }

  /**
   * Handle order confirmed by supplier
   */
  private static async handleOrderConfirmed(orderId: string) {
    console.log(`Order confirmed by supplier: ${orderId}`);
    
    // TODO: Send notification to vendor
    // TODO: Send notification to customer
    
    return null;
  }

  /**
   * Handle order packed by supplier
   */
  private static async handleOrderPacked(orderId: string) {
    console.log(`Order packed by supplier: ${orderId}`);
    
    // TODO: Send notification to vendor
    // TODO: Send notification to customer
    
    return null;
  }

  /**
   * Handle order handed to courier
   */
  private static async handleOrderHandedToCourier(orderId: string) {
    console.log(`Order handed to courier: ${orderId}`);
    
    // TODO: Send notification to vendor
    // TODO: Send notification to customer
    
    return null;
  }

  /**
   * Handle order shipped - payout remains PENDING
   */
  private static async handleOrderShipped(orderId: string) {
    console.log(`Order shipped: ${orderId} - payout remains PENDING`);
    
    // Payout remains PENDING status
    // TODO: Send notification to vendor
    // TODO: Send notification to customer
    
    return null;
  }

  /**
   * Handle order delivered - check bank details and set appropriate status
   */
  private static async handleOrderDelivered(orderId: string) {
    console.log(`Order delivered: ${orderId} - checking bank details`);

    // Check if payout exists
    const existingPayout = await prisma.payout.findUnique({
      where: { orderId },
      include: {
        supplier: {
          include: { business: true }
        },
        vendor: {
          include: { business: true }
        }
      }
    });

    if (!existingPayout) {
      console.log(`No payout found for order ${orderId}`);
      return null;
    }

    // Check if both supplier and vendor have verified bank details
    const supplierHasBankDetails = existingPayout.supplier.business?.kycStatus === 'VERIFIED' || false;
    const vendorHasBankDetails = existingPayout.vendor.business?.kycStatus === 'VERIFIED' || false;

    let newStatus: string;
    let statusReason: string;

    if (supplierHasBankDetails && vendorHasBankDetails) {
      // Both have bank details - ready for approval
      newStatus = 'APPROVAL_REQUIRED';
      statusReason = 'Order delivered - ready for review';
    } else {
      // Missing bank details - put on hold
      newStatus = 'ON_HOLD';
      statusReason = 'Awaiting bank details';
    }

    // Update payout status
    const updatedPayout = await prisma.payout.update({
      where: { id: existingPayout.id },
      data: {
        status: newStatus,
        isLocked: true,
        lockedAt: new Date(),
        requiresApproval: newStatus === 'APPROVAL_REQUIRED'
      }
    });

    // Create status history
    await prisma.payoutStatusHistory.create({
      data: {
        payoutId: existingPayout.id,
        status: newStatus,
        reason: statusReason,
        changedBy: changedBy,
        notes: newStatus === 'ON_HOLD' 
          ? `Payout is on hold. Missing bank details for ${!supplierHasBankDetails ? 'supplier' : ''}${!supplierHasBankDetails && !vendorHasBankDetails ? ' and ' : ''}${!vendorHasBankDetails ? 'vendor' : ''}. ${reason || ''}`
          : `Payout is now ready for admin review. Order was delivered. ${reason || ''}`
      }
    });

    console.log(`Payout ${existingPayout.id} marked as ${newStatus}`);
    return updatedPayout;
  }

  /**
   * Handle order cancelled - cancel any pending payouts
   */
  private static async handleOrderCancelled(orderId: string) {
    console.log(`Handling cancelled order: ${orderId}`);

    const payout = await prisma.payout.findUnique({
      where: { orderId }
    });

    if (payout && payout.status === 'PENDING') {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'CANCELLED' }
      });

      await prisma.payoutStatusHistory.create({
        data: {
          payoutId: payout.id,
          status: 'CANCELLED',
          reason: 'Order cancelled',
          changedBy: changedBy,
          notes: `Payout cancelled because order was cancelled. ${reason || ''}`
        }
      });

      console.log(`Payout ${payout.id} cancelled due to order cancellation`);
    }
  }

  /**
   * Handle order refunded - cancel payouts and create refund record
   */
  private static async handleOrderRefunded(orderId: string) {
    console.log(`Handling refunded order: ${orderId}`);

    const payout = await prisma.payout.findUnique({
      where: { orderId }
    });

    if (payout) {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'REFUNDED' }
      });

      await prisma.payoutStatusHistory.create({
        data: {
          payoutId: payout.id,
          status: 'REFUNDED',
          reason: 'Order refunded',
          changedBy: changedBy,
          notes: `Payout refunded because order was refunded. ${reason || ''}`
        }
      });

      console.log(`Payout ${payout.id} marked as refunded`);
    }
  }

  /**
   * Get payout status for an order
   */
  static async getPayoutStatus(orderId: string) {
    const payout = await prisma.payout.findUnique({
      where: { orderId },
      include: {
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          take: 1
        }
      }
    });

    return payout;
  }

  /**
   * Check if order has locked payout
   */
  static async hasLockedPayout(orderId: string): Promise<boolean> {
    const payout = await prisma.payout.findUnique({
      where: { orderId },
      select: { isLocked: true }
    });

    return payout?.isLocked || false;
  }
}
