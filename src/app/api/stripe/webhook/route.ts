import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object as Stripe.Account);
        break;

      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object as Stripe.Capability);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    console.log('Processing account.updated for account:', account.id);

    // Find business by Stripe account ID
    const business = await prisma.business.findFirst({
      where: { stripeAccountId: account.id }
    });

    if (!business) {
      console.log('Business not found for account:', account.id);
      return;
    }

    // Check if account is fully verified
    const isVerified = account.charges_enabled && account.payouts_enabled && account.details_submitted;
    const kycStatus = isVerified ? 'VERIFIED' : 'PENDING';

    // Update business KYC status
    await prisma.business.update({
      where: { id: business.id },
      data: { kycStatus }
    });

    // Update bank details if exists
    const bankDetails = await prisma.bankDetails.findFirst({
      where: { businessId: business.id }
    });

    if (bankDetails) {
      await prisma.bankDetails.update({
        where: { id: bankDetails.id },
        data: {
          kycStatus,
          isVerified,
          verifiedAt: isVerified ? new Date() : null,
        }
      });
    }

    // Update all users in this business
    await prisma.user.updateMany({
      where: { businessId: business.id },
      data: { status: isVerified ? 'ACTIVE' : 'PENDING_VERIFICATION' }
    });

    console.log(`Updated KYC status for business ${business.id}: ${kycStatus}`);
  } catch (error) {
    console.error('Error handling account.updated:', error);
  }
}

async function handleAccountDeauthorized(account: Stripe.Account) {
  try {
    console.log('Processing account.application.deauthorized for account:', account.id);

    // Find business by Stripe account ID
    const business = await prisma.business.findFirst({
      where: { stripeAccountId: account.id }
    });

    if (!business) {
      console.log('Business not found for account:', account.id);
      return;
    }

    // Update business KYC status to failed
    await prisma.business.update({
      where: { id: business.id },
      data: { kycStatus: 'REJECTED' }
    });

    // Update bank details
    const bankDetails = await prisma.bankDetails.findFirst({
      where: { businessId: business.id }
    });

    if (bankDetails) {
      await prisma.bankDetails.update({
        where: { id: bankDetails.id },
        data: {
          kycStatus: 'REJECTED',
          isVerified: false,
        }
      });
    }

    console.log(`Account deauthorized for business ${business.id}`);
  } catch (error) {
    console.error('Error handling account.application.deauthorized:', error);
  }
}

async function handleCapabilityUpdated(capability: Stripe.Capability) {
  try {
    console.log('Processing capability.updated for account:', capability.account);

    // Find business by Stripe account ID
    const business = await prisma.business.findFirst({
      where: { stripeAccountId: capability.account }
    });

    if (!business) {
      console.log('Business not found for account:', capability.account);
      return;
    }

    // Check if all required capabilities are enabled
    const account = await stripe.accounts.retrieve(capability.account as string);
    const isVerified = account.charges_enabled && account.payouts_enabled && account.details_submitted;
    const kycStatus = isVerified ? 'VERIFIED' : 'PENDING';

    // Update business KYC status
    await prisma.business.update({
      where: { id: business.id },
      data: { kycStatus }
    });

    console.log(`Updated capability status for business ${business.id}: ${kycStatus}`);
  } catch (error) {
    console.error('Error handling capability.updated:', error);
  }
}

