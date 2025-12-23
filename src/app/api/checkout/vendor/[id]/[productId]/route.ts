import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, generateCustomerInvoiceEmail, generateSupplierOrderNotification, generateVendorOrderNotification } from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const { id: storeId, productId } = params;

    // Get the product with all related data
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: storeId,
        isActive: true,
      },
      include: {
        store: {
          include: {
            owner: true, // Vendor
          },
        },
        supplier: true,
        // variants: true, // Temporarily commented out
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Add variants to product if available
    const productWithVariants = {
      ...product,
      variants: product.variants || []
    };

    return NextResponse.json({ product: productWithVariants });
  } catch (error) {
    console.error('Error fetching product for checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const { id: storeId, productId } = params;
    const { customerName, customerEmail, quantity = 1, selectedVariants = {} } = await request.json();

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Customer name and email are required' },
        { status: 400 }
      );
    }

    // Get the product with all related data
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: storeId,
        isActive: true,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            invoiceTemplate: true, // Include invoiceTemplate
            owner: true, // Vendor
          },
        },
        supplier: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Calculate prices
    const basePrice = product.price / (1 + product.markup / 100); // Original supplier price
    const markupAmount = product.price - basePrice;
    const totalAmount = product.price * quantity;

    // Create or find customer
    let customer = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!customer) {
      // Create a customer user (role will be CUSTOMER, but we don't have that role yet, so use VENDOR temporarily)
      customer = await prisma.user.create({
        data: {
          email: customerEmail,
          name: customerName,
          password: 'temp-password', // Temporary password for customers
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        storeId: product.storeId!,
        customerId: customer.id,
        quantity: quantity,
        productPrice: basePrice,
        markupAmount: markupAmount,
        totalAmount: totalAmount,
        // selectedVariants: JSON.stringify(selectedVariants), // Temporarily commented out
        status: 'PENDING',
      },
      include: {
        product: {
          include: {
            supplier: true,
          },
        },
        customer: true,
        store: {
          include: {
            owner: true,
          },
        },
      },
    });

    // Create invoice with store-specific template (each store has its own invoiceTemplate)
    const selectedTemplate = product.store?.invoiceTemplate || 'default';
    console.log(`[Invoice Creation] Store: ${product.store?.name} (ID: ${product.storeId}), Using template: ${selectedTemplate}`);
    
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNumber,
        orderId: order.id,
        storeId: product.storeId!,
        customerId: customer.id,
        subtotal: totalAmount,
        tax: 0, // You can add tax calculation here
        total: totalAmount,
        status: 'PENDING',
        template: selectedTemplate, // Save store-specific template (vendor selected for this store)
      },
    });

    console.log(`[Invoice Created] Invoice: ${invoice.invoiceNumber}, Store: ${product.store?.name}, Template: ${invoice.template}`);

    // Send emails
    try {
      // Email to customer (invoice) - use template from invoice (saved when invoice was created)
      const customerEmailData = generateCustomerInvoiceEmail(
        customerName,
        order,
        invoice,
        {
          ...product.store,
          invoiceTemplate: invoice.template || product.store?.invoiceTemplate || 'default' // Prefer invoice.template
        }
      );
      await sendEmail({
        to: customerEmail,
        subject: customerEmailData.subject,
        html: customerEmailData.html,
        text: customerEmailData.text,
      });

      // Email to supplier (order notification)
      const supplierEmailData = generateSupplierOrderNotification(
        product.supplier.name,
        order
      );
      await sendEmail({
        to: product.supplier.email,
        subject: supplierEmailData.subject,
        html: supplierEmailData.html,
        text: supplierEmailData.text,
      });

      // Email to vendor (sale notification)
      const vendorEmailData = generateVendorOrderNotification(
        product.store.owner.name,
        order
      );
      await sendEmail({
        to: product.store.owner.email,
        subject: vendorEmailData.subject,
        html: vendorEmailData.html,
        text: vendorEmailData.text,
      });
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Don't fail the order if email fails
    }

    return NextResponse.json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
      },
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
