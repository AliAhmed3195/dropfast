import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { stripeExpressService } from '@/lib/stripe-express';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'VENDOR_USER' && session.role !== 'SUPPLIER_USER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { business: true }
    });

    if (!user?.business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Check if Express account already exists
    if (user.business.expressAccountId) {
      return NextResponse.json(
        { error: 'Express account already exists' },
        { status: 400 }
      );
    }

    // Create Express account
    const result = await stripeExpressService.createExpressAccount(
      session.id,
      user.email,
      user.business.country || 'US'
    );

    // Update business with Express account ID
    await prisma.business.update({
      where: { id: user.business.id },
      data: { 
        expressAccountId: result.accountId,
        stripeAccountStatus: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Express account created successfully',
      accountId: result.accountId,
      accountLink: result.accountLink,
      nextSteps: 'Click the account link to complete your Stripe onboarding process'
    });

  } catch (error: any) {
    console.error('Error creating Express account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Express account' },
      { status: 500 }
    );
  }
}
