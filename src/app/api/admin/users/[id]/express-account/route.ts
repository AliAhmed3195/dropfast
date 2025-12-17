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

    // Get user with business details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.business) {
      return NextResponse.json(
        { error: 'User does not have a business profile' },
        { status: 400 }
      );
    }

    // Check if Express account already exists
    if (user.business.expressAccountId) {
      // Instead of error, generate new onboarding link for existing account
      const onboardingLink = await stripeExpressService.createAccountLink(
        user.business.expressAccountId,
        'account_onboarding'
      );

      return NextResponse.json({
        success: true,
        message: 'Express account already exists. New onboarding link generated.',
        data: {
          userId: userId,
          userEmail: user.email,
          userName: user.name,
          businessCountry: user.business.country,
          accountId: user.business.expressAccountId,
          onboardingLink: onboardingLink,
          nextSteps: [
            'Share the new onboarding link with the user',
            'User will complete Stripe onboarding process',
            'Monitor onboarding status in admin panel'
          ]
        }
      });
    }

    // Validate required fields
    if (!user.business.country) {
      return NextResponse.json(
        { error: 'User business country is required' },
        { status: 400 }
      );
    }

    // Create Express account
    const result = await stripeExpressService.createExpressAccount(
      userId,
      user.email,
      user.business.country
    );

    // Update business with Express account ID
    await prisma.business.update({
      where: { id: user.business.id },
      data: { 
        expressAccountId: result.accountId,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Express account created successfully',
      data: {
        userId: userId,
        userEmail: user.email,
        userName: user.name,
        businessCountry: user.business.country,
        accountId: result.accountId,
        onboardingLink: result.accountLink,
        nextSteps: [
          'Share the onboarding link with the user',
          'User will complete Stripe onboarding process',
          'Monitor onboarding status in admin panel'
        ]
      }
    });

  } catch (error: any) {
    console.error('Error creating Express account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Express account' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Get user with business details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.business?.expressAccountId) {
      return NextResponse.json(
        { error: 'No Express account found for this user' },
        { status: 404 }
      );
    }

    // Get account status
    const status = await stripeExpressService.getAccountStatus(user.business.expressAccountId);

    return NextResponse.json({
      success: true,
      data: {
        userId: userId,
        userEmail: user.email,
        userName: user.name,
        businessCountry: user.business.country,
        accountId: user.business.expressAccountId,
        onboardingStatus: user.business.stripeAccountStatus,
        stripeStatus: status,
        isOnboardingComplete: status.details_submitted && status.payouts_enabled
      }
    });

  } catch (error: any) {
    console.error('Error getting Express account status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get Express account status' },
      { status: 500 }
    );
  }
}
