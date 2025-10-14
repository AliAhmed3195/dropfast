import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { stripeRequirementsService } from '@/lib/stripe-requirements';
import { prisma } from '@/lib/prisma';

/**
 * GET - Check Stripe account requirements for a user
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check admin session
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Get user with business info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.business?.stripeAccountId) {
      return NextResponse.json({ 
        error: 'No Stripe account found for this user',
        requirements: null
      }, { status: 400 });
    }

    // Get requirements from Stripe
    const requirements = await stripeRequirementsService.getAccountRequirements(
      user.business.stripeAccountId
    );

    // Update database with latest requirements
    await prisma.business.update({
      where: { id: user.business.id },
      data: {
        stripeRequirements: requirements,
        stripeMissingFields: [...requirements.currentlyDue, ...requirements.pastDue],
        stripeLastRequirementsCheck: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      requirements,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      accountId: user.business.stripeAccountId
    });

  } catch (error) {
    console.error('Error checking Stripe requirements:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No such account')) {
        return NextResponse.json({ 
          error: 'Stripe account not found. Please create a new account.' 
        }, { status: 404 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to check requirements' 
    }, { status: 500 });
  }
}

/**
 * POST - Generate new onboarding link and send email
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check admin session
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const { sendEmail = true } = await request.json();

    // Check requirements and send email if needed
    const result = await stripeRequirementsService.checkAndNotifyRequirements(userId);

    return NextResponse.json({
      success: true,
      message: result.emailSent 
        ? 'Requirements checked and email sent successfully' 
        : 'Requirements checked - no missing information found',
      data: {
        requirements: result.requirements,
        emailSent: result.emailSent,
        onboardingLink: result.onboardingLink,
        userId: userId
      }
    });

  } catch (error) {
    console.error('Error processing requirements:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('User or Stripe account not found')) {
        return NextResponse.json({ 
          error: 'User or Stripe account not found' 
        }, { status: 404 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to process requirements' 
    }, { status: 500 });
  }
}
