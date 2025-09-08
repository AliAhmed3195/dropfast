import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, storeId } = await request.json();

    if (!orderId || !storeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the order with related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        store: true,
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if invoice already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { orderId },
    });

    if (existingInvoice) {
      return NextResponse.json({ error: 'Invoice already exists' }, { status: 400 });
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { storeId },
    });
    const invoiceNumber = `INV-${storeId.slice(-4).toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        storeId: order.storeId,
        customerId: order.customerId,
        subtotal: order.totalAmount,
        tax: 0, // You can add tax calculation here
        total: order.totalAmount,
        template: order.store.invoiceTemplate || 'default',
      },
    });

    // Invoice is already linked to order through the orderId field in Invoice model

    return NextResponse.json({
      message: 'Invoice created successfully',
      invoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    let whereClause: any = {};
    
    if (session.role === 'VENDOR' && storeId) {
      whereClause.storeId = storeId;
    } else if (session.role === 'ADMIN') {
      // Admin can see all invoices
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            product: true,
            customer: true,
          },
        },
        store: true,
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
