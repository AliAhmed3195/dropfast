import { currencyService } from './currency-conversion';

export interface PayoutCalculation {
  orderTotal: number;
  supplierAmount: number;
  vendorGrossAmount: number;
  platformFee: number;
  transactionFee: number;
  currencyConversionFee: number;
  finalSupplierAmount: number;
  finalVendorAmount: number;
  platformRevenue: number;
  breakdown: {
    supplier: {
      gross: number;
      net: number;
      fees: number;
    };
    vendor: {
      gross: number;
      platformFee: number;
      net: number;
      fees: number;
    };
    platform: {
      revenue: number;
      transactionFee: number;
      netRevenue: number;
    };
  };
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
  };
  vendor: {
    id: string;
    preferredCurrency: string;
  };
}

export class PayoutCalculator {
  private platformFeeRate = 0.05; // 5% platform fee
  private stripeFeeRate = 0.029; // 2.9% Stripe fee
  private stripeFixedFee = 0.30; // $0.30 fixed fee
  private currencyConversionRate = 0.01; // 1% conversion fee

  /**
   * Calculate payout breakdown for a single order
   */
  async calculatePayouts(order: OrderData, options: {
    enablePlatformFee?: boolean;
    enableTransactionFee?: boolean;
    enableCurrencyConversion?: boolean;
    customPlatformFeeRate?: number;
  } = {}): Promise<PayoutCalculation> {
    const {
      enablePlatformFee = true,
      enableTransactionFee = true,
      enableCurrencyConversion = false,
      customPlatformFeeRate = null
    } = options;

    const orderTotal = order.totalAmount; // Should be locked USD amount
    const quantity = order.quantity;

    console.log('Payout calculation inputs:', {
      orderId: order.id,
      orderTotal: orderTotal,
      quantity: quantity,
      productPrice: order.productPrice,
      markupAmount: order.markupAmount,
      supplierCurrency: order.supplier.preferredCurrency,
      vendorCurrency: order.vendor.preferredCurrency,
      expectedTotal: (order.productPrice * quantity) + order.markupAmount
    });
    
    // Step 1: Calculate Stripe fees (deducted from customer payment)
    const stripeFee = enableTransactionFee ? 
      (orderTotal * this.stripeFeeRate) + this.stripeFixedFee : 0;
    
    // Step 2: Net settlement after Stripe fees
    const netSettlement = orderTotal - stripeFee;
    
    // Step 3: Supplier amount (base product cost - no platform fee)
    const supplierAmount = order.productPrice * quantity;
    
    // Step 4: Vendor gross amount (markup amount from order)
    const vendorGrossAmount = order.markupAmount;
    
    // Validation: Ensure order total matches expected calculation
    const expectedOrderTotal = supplierAmount + vendorGrossAmount;
    if (Math.abs(orderTotal - expectedOrderTotal) > 0.01) {
      console.warn(`Order total mismatch: expected ${expectedOrderTotal}, got ${orderTotal}`);
    }
    
    // Step 5: Platform fee (only from vendor markup, 5%)
    const platformFeeRate = customPlatformFeeRate || this.platformFeeRate;
    const platformFee = enablePlatformFee ? 
      vendorGrossAmount * platformFeeRate : 0;
    
    // Step 6: Currency conversion fee (if applicable)
    const currencyConversionFee = enableCurrencyConversion ? 
      orderTotal * this.currencyConversionRate : 0;
    
    // Step 7: Final amounts
    const finalSupplierAmount = supplierAmount; // No deductions for supplier
    const finalVendorAmount = vendorGrossAmount - platformFee; // Platform fee deducted from vendor
    const platformRevenue = platformFee; // Platform's revenue from fees
    
    const result = {
      orderTotal,
      supplierAmount,
      vendorGrossAmount,
      platformFee,
      transactionFee: stripeFee,
      currencyConversionFee,
      finalSupplierAmount,
      finalVendorAmount,
      platformRevenue,
      breakdown: {
        supplier: {
          gross: supplierAmount,
          net: finalSupplierAmount,
          fees: 0 // No fees for supplier
        },
        vendor: {
          gross: vendorGrossAmount,
          platformFee: platformFee,
          net: finalVendorAmount,
          fees: platformFee
        },
        platform: {
          revenue: platformRevenue,
          transactionFee: stripeFee,
          netRevenue: platformRevenue - stripeFee
        }
      }
    };

    console.log('Payout calculation results:', {
      orderId: order.id,
      orderTotal: result.orderTotal,
      supplierAmount: result.supplierAmount,
      vendorGrossAmount: result.vendorGrossAmount,
      platformRevenue: result.platformRevenue,
      transactionFee: result.transactionFee,
      finalSupplierAmount: result.finalSupplierAmount,
      finalVendorAmount: result.finalVendorAmount
    });

    return result;
  }

  /**
   * Calculate payouts for multiple orders (bulk processing)
   */
  async calculateBulkPayouts(orders: OrderData[], options = {}): Promise<{
    orderId: string;
    calculation: PayoutCalculation;
  }[]> {
    const results = [];
    
    for (const order of orders) {
      const calculation = await this.calculatePayouts(order, options);
      results.push({
        orderId: order.id,
        calculation
      });
    }
    
    return results;
  }

  /**
   * Convert USD amounts to preferred currencies at payout time
   */
  async convertToPreferredCurrencies(
    supplierAmount: number,
    vendorAmount: number,
    supplierCurrency: string,
    vendorCurrency: string
  ): Promise<{
    supplierAmountConverted: number;
    vendorAmountConverted: number;
    exchangeRates: {
      supplier: number;
      vendor: number;
    };
  }> {
    // Currency is always USD now
    return {
      supplierAmountConverted: supplierAmount,
      vendorAmountConverted: vendorAmount,
      exchangeRates: {
        supplier: 1,
        vendor: 1
      }
    };
  }

  /**
   * Calculate payout with currency conversion
   */
  async calculatePayoutWithCurrency(
    order: OrderData,
    options = {}
  ): Promise<PayoutCalculation & {
    currencyConversion: {
      supplierAmountConverted: number;
      vendorAmountConverted: number;
      exchangeRates: {
        supplier: number;
        vendor: number;
      };
    };
  }> {
    // Calculate base payout in USD
    const baseCalculation = await this.calculatePayouts(order, options);
    
    // Convert to preferred currencies
    const currencyConversion = await this.convertToPreferredCurrencies(
      baseCalculation.finalSupplierAmount,
      baseCalculation.finalVendorAmount,
      order.supplier.preferredCurrency,
      order.vendor.preferredCurrency
    );
    
    return {
      ...baseCalculation,
      currencyConversion
    };
  }

  /**
   * Calculate payout for locking (used when order is delivered)
   */
  async calculatePayoutForLocking(
    order: OrderData,
    options = {}
  ): Promise<PayoutCalculation & {
    currencyConversion: {
      supplierAmountConverted: number;
      vendorAmountConverted: number;
      exchangeRates: {
        supplier: number;
        vendor: number;
      };
    };
    lockedAt: Date;
    isLocked: boolean;
  }> {
    // Calculate payout with currency conversion
    const calculation = await this.calculatePayoutWithCurrency(order, options);
    
    return {
      ...calculation,
      lockedAt: new Date(),
      isLocked: true
    };
  }

  /**
   * Get locked payout amounts (for display purposes)
   */
  async getLockedPayoutAmounts(payout: any): Promise<{
    supplierAmount: {
      usd: number;
      local: number;
      currency: string;
      exchangeRate: number;
    };
    vendorAmount: {
      usd: number;
      local: number;
      currency: string;
      exchangeRate: number;
    };
    isLocked: boolean;
    lockedAt: Date | null;
  }> {
    if (!payout.isLocked) {
      // If not locked, calculate current amounts
      const currentCalculation = await this.calculatePayoutWithCurrency({
        id: payout.orderId,
        totalAmount: payout.orderTotal,
        quantity: 1, // This should be fetched from order
        productPrice: payout.supplierAmount,
        markupAmount: payout.vendorGrossAmount,
        supplier: {
          id: payout.supplierId,
          preferredCurrency: payout.supplierCurrency
        },
        vendor: {
          id: payout.vendorId,
          preferredCurrency: payout.vendorCurrency
        }
      });

      return {
        supplierAmount: {
          usd: currentCalculation.finalSupplierAmount,
          local: currentCalculation.currencyConversion.supplierAmountConverted,
          currency: payout.supplierCurrency,
          exchangeRate: currentCalculation.currencyConversion.exchangeRates.supplier
        },
        vendorAmount: {
          usd: currentCalculation.finalVendorAmount,
          local: currentCalculation.currencyConversion.vendorAmountConverted,
          currency: payout.vendorCurrency,
          exchangeRate: currentCalculation.currencyConversion.exchangeRates.vendor
        },
        isLocked: false,
        lockedAt: null
      };
    }

    // Return locked amounts
    return {
      supplierAmount: {
        usd: payout.finalSupplierAmount,
        local: payout.lockedSupplierAmount || payout.finalSupplierAmount,
        currency: payout.supplierCurrency,
        exchangeRate: payout.lockedExchangeRate || 1
      },
      vendorAmount: {
        usd: payout.finalVendorAmount,
        local: payout.lockedVendorAmount || payout.finalVendorAmount,
        currency: payout.vendorCurrency,
        exchangeRate: payout.lockedExchangeRate || 1
      },
      isLocked: true,
      lockedAt: payout.lockedAt
    };
  }

  /**
   * Validate payout calculation
   */
  validatePayoutCalculation(calculation: PayoutCalculation): {
    isValid: boolean;
    totalFees: number;
    feePercentage: number;
    warnings: string[];
  } {
    const totalFees = calculation.platformFee + calculation.transactionFee + calculation.currencyConversionFee;
    const totalAmount = calculation.supplierAmount + calculation.vendorGrossAmount;
    const feePercentage = (totalFees / totalAmount) * 100;
    
    const warnings: string[] = [];
    
    // Check if fees are reasonable (max 10% of total)
    if (feePercentage > 10) {
      warnings.push(`Total fees (${feePercentage.toFixed(2)}%) exceed recommended 10%`);
    }
    
    // Check if platform fee is reasonable
    if (calculation.platformFee > calculation.vendorGrossAmount * 0.1) {
      warnings.push('Platform fee exceeds 10% of vendor amount');
    }
    
    // Check if transaction fee is reasonable
    if (calculation.transactionFee > calculation.orderTotal * 0.05) {
      warnings.push('Transaction fee exceeds 5% of order total');
    }
    
    return {
      isValid: warnings.length === 0,
      totalFees,
      feePercentage,
      warnings
    };
  }

  /**
   * Get fee structure recommendations
   */
  getFeeRecommendations(calculation: PayoutCalculation): string[] {
    const recommendations: string[] = [];
    
    if (calculation.breakdown.platform.netRevenue < 0) {
      recommendations.push('Platform revenue is negative - consider adjusting fees');
    }
    
    if (calculation.breakdown.vendor.fees > calculation.breakdown.vendor.gross * 0.1) {
      recommendations.push('Consider reducing platform fee for vendor');
    }
    
    if (calculation.transactionFee > calculation.orderTotal * 0.03) {
      recommendations.push('Consider using a payment processor with lower fees');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const payoutCalculator = new PayoutCalculator();
