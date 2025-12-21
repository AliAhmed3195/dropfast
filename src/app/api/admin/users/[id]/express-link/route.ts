import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { stripeExpressService } from '@/lib/stripe-express';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Get user with business and stripeAccount details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        business: {
          include: {
            stripeAccount: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.business?.stripeAccount?.expressAccountId) {
      return NextResponse.json(
        { error: 'No Express account found for this user. Create account first.' },
        { status: 400 }
      );
    }

    // Generate new onboarding link
    const onboardingLink = await stripeExpressService.createAccountLink(
      user.business.stripeAccount.expressAccountId,
      'account_onboarding'
    );

    return NextResponse.json({
      success: true,
      message: 'New onboarding link generated successfully',
      data: {
        userId: userId,
        userEmail: user.email,
        userName: user.name,
        accountId: user.business.stripeAccount.expressAccountId,
        onboardingLink: onboardingLink,
        instructions: [
          'Share this new link with the user',
          'Link expires after 24 hours',
          'User can complete onboarding using this link'
        ]
      }
    });

  } catch (error: any) {
    console.error('Error generating onboarding link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate onboarding link' },
      { status: 500 }
    );
  }
}
