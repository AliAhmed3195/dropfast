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
   * Handle order confirmed by supplier - create payout record
   */
  private static async handleOrderConfirmed(orderId: string) {
    console.log(`Order confirmed by supplier: ${orderId} - creating payout record`);
    
    try {
      // Check if payout already exists
      const existingPayout = await prisma.payout.findUnique({
        where: { orderId }
      });

      if (existingPayout) {
        console.log(`Payout already exists for order ${orderId}`);
        return existingPayout;
      }

      // Get order with all related data
      const order = await prisma.order.findUnique({
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
          }
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Import payout calculator
      const { payoutCalculator } = await import('@/lib/payout-calculator');

      // Prepare order data for calculation using LOCKED amounts
      // Use locked USD amounts instead of customer payment amount to ensure accurate payouts
      const lockedOrderTotal = (order.lockedUSDPrice * order.quantity) + order.markupAmount;
      
      const orderData = {
        id: order.id,
        totalAmount: lockedOrderTotal, // Use locked amount instead of customer payment
        quantity: order.quantity,
        productPrice: order.lockedUSDPrice, // Use locked USD price
        markupAmount: order.markupAmount, // Already in USD
        supplier: {
          id: order.product.supplier.id,
          preferredCurrency: 'USD'
        },
        vendor: {
          id: order.store.owner.id,
          preferredCurrency: 'USD'
        }
      };

      console.log('Payout calculation using locked amounts:', {
        orderId: order.id,
        customerPayment: order.totalAmount,
        lockedOrderTotal: lockedOrderTotal,
        lockedUSDPrice: order.lockedUSDPrice,
        markupAmount: order.markupAmount,
        quantity: order.quantity
      });

      // Calculate payout with currency conversion
      const calculation = await payoutCalculator.calculatePayoutWithCurrency(orderData);

      // Create payout record with PENDING status
      const payout = await prisma.payout.create({
        data: {
          orderId: order.id,
          supplierId: order.product.supplier.id,
          vendorId: order.store.owner.id,
          supplierBusinessId: order.product.supplier.business?.id,
          vendorBusinessId: order.store.owner.business?.id,
          // Use new field names from schema
          grossAmount: calculation.orderTotal,
          supplierAmount: calculation.supplierAmount,
          grossVendorAmount: calculation.vendorGrossAmount,
          platformFee: calculation.platformFee,
          stripeProcessingFee: calculation.transactionFee,
          currencyConversionFee: calculation.currencyConversionFee,
          finalSupplierAmount: calculation.finalSupplierAmount,
          finalVendorAmount: calculation.finalVendorAmount,
          platformRevenue: calculation.platformRevenue,
          baseCurrency: 'USD',
          supplierCurrency: 'USD',
          vendorCurrency: 'USD',
          exchangeRateAtPayout: calculation.currencyConversion?.exchangeRates?.supplier || 1,
          
          // Payout Locking (not locked yet)
          isLocked: false,
          lockedAt: null,
          lockedExchangeRate: null,
          lockedSupplierAmount: null,
          lockedVendorAmount: null,
          
          status: 'PENDING', // Created when supplier confirms
          payoutMethod: 'STRIPE_CONNECT',
          requiresApproval: false // Will be set to true when order is delivered
        }
      });

      // Create initial status history
      await prisma.payoutStatusHistory.create({
        data: {
          id: `psh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payoutId: payout.id,
          status: 'PENDING',
          reason: 'Order confirmed by supplier - payout created',
          changedBy: 'system',
          notes: 'Payout record created when supplier confirmed the order'
        }
      });

      console.log(`Payout created successfully for order ${orderId}:`, payout.id);
      return payout;

    } catch (error) {
      console.error(`Error creating payout for order ${orderId}:`, error);
      throw error;
    }
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
