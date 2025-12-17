import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { stripeExpressService } from '@/lib/stripe-express';

export async function GET(request: NextRequest) {
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

    if (!user?.business?.expressAccountId) {
      return NextResponse.json(
        { error: 'Express account not found' },
        { status: 404 }
      );
    }

    // Get account status from Stripe
    const status = await stripeExpressService.getAccountStatus(user.business.expressAccountId);

    // Update local status
    let onboardingStatus = 'pending';
    if (status.details_submitted && status.charges_enabled && status.payouts_enabled) {
      onboardingStatus = 'completed';
    } else if (status.details_submitted) {
      onboardingStatus = 'submitted';
    }

    // Update business status
    await prisma.business.update({
      where: { id: user.business.id },
      data: { stripeAccountStatus: onboardingStatus }
    });

    return NextResponse.json({
      success: true,
      accountId: user.business.expressAccountId,
      status: {
        charges_enabled: status.charges_enabled,
        payouts_enabled: status.payouts_enabled,
        details_submitted: status.details_submitted,
        onboarding_status: onboardingStatus,
        requirements: status.requirements
      }
    });

  } catch (error: any) {
    console.error('Error getting Express account status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get account status' },
      { status: 500 }
    );
  }
}
