import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { stripeRequirementsService } from '@/lib/stripe-requirements';
import { prisma } from '@/lib/prisma';

/**
 * GET - Check Stripe account requirements for a user
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('Stripe requirements API called with params:', params);
    
    // Check admin session
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    console.log('User ID:', userId);

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
      console.log('User not found for ID:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', { id: user.id, name: user.name, businessId: user.business?.id });

    // Check if user has any Stripe account (Express or Connect)
    const accountId = user.business?.stripeAccount?.expressAccountId || user.business?.stripeAccount?.stripeAccountId;
    console.log('Account ID:', accountId);
    
    if (!accountId) {
      console.log('No Stripe account found for user');
      return NextResponse.json({ 
        error: 'No Stripe account found for this user',
        requirements: null
      }, { status: 400 });
    }

    console.log('Getting requirements from Stripe for account:', accountId);
    // Get requirements from Stripe
    const requirements = await stripeRequirementsService.getAccountRequirements(accountId);
    console.log('Requirements retrieved successfully');

    console.log('Updating database with requirements...');
    // Update StripeAccount with latest requirements
    if (user.business.stripeAccount) {
      await prisma.stripeAccount.update({
        where: { id: user.business.stripeAccount.id },
        data: {
          stripeRequirements: requirements as any,
          stripeMissingFields: [...requirements.currentlyDue, ...requirements.pastDue] as any,
          stripeLastRequirementsCheck: new Date()
        }
      });
    } else {
      // Create StripeAccount if it doesn't exist
      await prisma.stripeAccount.create({
        data: {
          businessId: user.business.id,
          stripeRequirements: requirements as any,
          stripeMissingFields: [...requirements.currentlyDue, ...requirements.pastDue] as any,
          stripeLastRequirementsCheck: new Date()
        }
      });
    }
    console.log('Database updated successfully');

    return NextResponse.json({
      success: true,
      requirements,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      accountId: accountId
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
