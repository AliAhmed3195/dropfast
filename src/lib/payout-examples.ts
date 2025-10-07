// Payout Calculation Examples - Fixed Implementation

export const payoutExamples = {
  // Example 1: Basic Order
  basicOrder: {
    orderTotal: 150, // Customer paid $150
    productPrice: 100, // Supplier cost $100
    quantity: 1,
    supplierCurrency: 'USD',
    vendorCurrency: 'USD'
  },

  // Example 2: Multi-currency Order
  multiCurrencyOrder: {
    orderTotal: 150, // Customer paid $150
    productPrice: 100, // Supplier cost $100
    quantity: 1,
    supplierCurrency: 'PKR', // Supplier wants PKR
    vendorCurrency: 'EUR' // Vendor wants EUR
  },

  // Example 3: High Value Order
  highValueOrder: {
    orderTotal: 1000, // Customer paid $1000
    productPrice: 600, // Supplier cost $600
    quantity: 1,
    supplierCurrency: 'USD',
    vendorCurrency: 'USD'
  }
};

export const calculatePayoutExample = (order: any) => {
  // Step 1: Stripe Fee Calculation
  const stripeFee = (order.orderTotal * 0.029) + 0.30; // 2.9% + $0.30
  const netSettlement = order.orderTotal - stripeFee;

  // Step 2: Supplier Amount (no platform fee)
  const supplierAmount = order.productPrice * order.quantity;

  // Step 3: Vendor Gross Amount (dynamic markup)
  const vendorGrossAmount = netSettlement - supplierAmount;

  // Step 4: Platform Fee (5% of vendor markup only)
  const platformFee = vendorGrossAmount * 0.05;

  // Step 5: Final Amounts
  const finalSupplierAmount = supplierAmount; // No deductions
  const finalVendorAmount = vendorGrossAmount - platformFee; // Platform fee deducted

  return {
    customerPaid: order.orderTotal,
    stripeFee,
    netSettlement,
    supplierAmount,
    vendorGrossAmount,
    platformFee,
    finalSupplierAmount,
    finalVendorAmount,
    platformRevenue: platformFee,
    breakdown: {
      customer: {
        paid: order.orderTotal,
        stripeFee: stripeFee,
        netReceived: netSettlement
      },
      supplier: {
        gross: supplierAmount,
        net: finalSupplierAmount,
        fees: 0
      },
      vendor: {
        gross: vendorGrossAmount,
        platformFee: platformFee,
        net: finalVendorAmount,
        fees: platformFee
      },
      platform: {
        revenue: platformFee,
        stripeFee: stripeFee,
        netRevenue: platformFee - stripeFee
      }
    }
  };
};

// Example calculations
export const examples = {
  basic: calculatePayoutExample(payoutExamples.basicOrder),
  highValue: calculatePayoutExample(payoutExamples.highValueOrder)
};

console.log('Basic Order Example:', examples.basic);
console.log('High Value Order Example:', examples.highValue);
