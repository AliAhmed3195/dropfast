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

    // Get user's business with stripeAccount
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { 
        business: {
          include: {
            stripeAccount: true
          }
        }
      }
    });

    if (!user?.business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (!user.business.stripeAccount?.expressAccountId) {
      return NextResponse.json(
        { error: 'Express account not found. Please create an account first.' },
        { status: 400 }
      );
    }

    // Generate new onboarding link for existing account
    const accountLink = await stripeExpressService.createAccountLink(
      user.business.stripeAccount.expressAccountId,
      'account_onboarding'
    );

    return NextResponse.json({
      success: true,
      accountLink: accountLink
    });

  } catch (error: any) {
    console.error('Error generating onboarding link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate onboarding link' },
      { status: 500 }
    );
  }
}
