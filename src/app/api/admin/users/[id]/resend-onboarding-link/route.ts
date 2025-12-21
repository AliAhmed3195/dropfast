import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { stripeRequirementsService } from '@/lib/stripe-requirements';
import { stripeExpressService } from '@/lib/stripe-express';
import { prisma } from '@/lib/prisma';

/**
 * POST - Resend onboarding link to user
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check admin session
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const { linkType = 'express' } = await request.json(); // 'express' or 'connect'

    // Get user with business and stripeAccount info
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

    if (!user.business) {
      return NextResponse.json({ 
        error: 'User does not have a business profile' 
      }, { status: 400 });
    }

    let onboardingLink: string;
    let accountId: string;

    if (linkType === 'express' && user.business.stripeAccount?.expressAccountId) {
      // Generate new Express onboarding link
      onboardingLink = await stripeExpressService.createAccountLink(
        user.business.stripeAccount.expressAccountId,
        'account_onboarding'
      );
      accountId = user.business.stripeAccount.expressAccountId;
    } else if (linkType === 'connect' && user.business.stripeAccount?.stripeAccountId) {
      // Generate new Connect onboarding link
      onboardingLink = await stripeRequirementsService.generateOnboardingLink(
        user.business.stripeAccount.stripeAccountId
      );
      accountId = user.business.stripeAccount.stripeAccountId;
    } else {
      return NextResponse.json({ 
        error: `No ${linkType} account found for this user` 
      }, { status: 400 });
    }

    // Send email to user
    await stripeRequirementsService.sendRequirementsEmail(
      user,
      ['Complete your account setup'], // Generic message for resend
      onboardingLink,
      'pending'
    );

    // Update StripeAccount with link sent timestamp
    if (user.business.stripeAccount) {
      await prisma.stripeAccount.update({
        where: { id: user.business.stripeAccount.id },
        data: {
          stripeLastUpdated: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding link sent successfully',
      data: {
        userId: userId,
        userEmail: user.email,
        userName: user.name,
        accountId: accountId,
        linkType: linkType,
        onboardingLink: onboardingLink,
        emailSent: true
      }
    });

  } catch (error) {
    console.error('Error resending onboarding link:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No such account')) {
        return NextResponse.json({ 
          error: 'Stripe account not found. Please create a new account.' 
        }, { status: 404 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to resend onboarding link' 
    }, { status: 500 });
  }
}
