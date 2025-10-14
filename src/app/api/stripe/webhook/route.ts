import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No signature provided');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    console.log(`Received webhook: ${event.type}`);
    
    // Handle different event types
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      case 'account.capabilities.updated':
        await handleCapabilitiesUpdated(event.data.object);
        break;
      case 'account.external_account.updated':
        await handleExternalAccountUpdated(event.data.object);
        break;
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      case 'transfer.updated':
        await handleTransferUpdated(event.data.object);
        break;
      case 'payout.paid':
        await handlePayoutPaid(event.data.object);
        break;
      case 'payout.failed':
        await handlePayoutFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}

/**
 * Handle account.updated webhook event
 */
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    // Find user by stripeAccountId
    const user = await prisma.user.findFirst({
      where: { business: { stripeAccountId: account.id } },
      include: { business: true }
    });
    
    if (!user) {
      console.log(`No user found for account: ${account.id}`);
      return;
    }
    
    // Determine account status
    const accountStatus = determineAccountStatus(account);
    const verificationLevel = determineVerificationLevel(account);
    
    // Update database
    await prisma.business.update({
      where: { id: user.business.id },
      data: {
        stripeAccountStatus: accountStatus,
        stripeVerificationLevel: verificationLevel,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeChargesEnabled: account.charges_enabled,
        stripeCapabilities: account.capabilities,
        stripeRequirements: account.requirements,
        stripeLastUpdated: new Date()
      }
    });
    
    console.log(`Updated account status for user ${user.id}: ${accountStatus}`);
  } catch (error) {
    console.error('Error handling account update:', error);
  }
}

/**
 * Handle account.capabilities.updated webhook event
 */
async function handleCapabilitiesUpdated(capability: Stripe.Capability) {
  try {
    const accountId = capability.account;
    
    // Find user by account ID
    const user = await prisma.user.findFirst({
      where: { business: { stripeAccountId: accountId } },
      include: { business: true }
    });
    
    if (!user) return;
    
    // Update payout status based on transfers capability
    const payoutEnabled = capability.status === 'active' && capability.id === 'transfers';
    
    await prisma.business.update({
      where: { id: user.business.id },
      data: {
        stripePayoutsEnabled: payoutEnabled,
        stripeLastUpdated: new Date()
      }
    });
    
    console.log(`Updated payout status for user ${user.id}: ${payoutEnabled}`);
  } catch (error) {
    console.error('Error handling capabilities update:', error);
  }
}

/**
 * Handle account.external_account.updated webhook event
 */
async function handleExternalAccountUpdated(externalAccount: Stripe.ExternalAccount) {
  try {
    const accountId = externalAccount.account;
    
    // Find user by account ID
    const user = await prisma.user.findFirst({
      where: { business: { stripeAccountId: accountId } },
      include: { business: true }
    });
    
    if (!user) return;
    
    // Determine bank status
    const bankStatus = determineBankStatus(externalAccount);
    
    await prisma.business.update({
      where: { id: user.business.id },
      data: {
        bankStatus: bankStatus,
        stripeLastUpdated: new Date()
      }
    });
    
    console.log(`Updated bank status for user ${user.id}: ${bankStatus}`);
  } catch (error) {
    console.error('Error handling external account update:', error);
  }
}

/**
 * Determine account status based on Stripe account data
 */
function determineAccountStatus(account: Stripe.Account): string {
  // Check if account is restricted
  if (account.requirements?.currently_due?.length > 0) {
    return 'restricted';
  }
  
  // Check if account is rejected
  if (account.requirements?.past_due?.length > 0) {
    return 'rejected';
  }
  
  // Check if account is fully verified
  if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
    return 'verified';
  }
  
  // Check if account is pending verification
  if (account.details_submitted && !account.charges_enabled) {
    return 'pending';
  }
  
  return 'pending';
}

/**
 * Determine verification level based on Stripe account data
 */
function determineVerificationLevel(account: Stripe.Account): string {
  if (account.requirements?.currently_due?.length > 0) {
    return 'pending';
  }
  
  if (account.details_submitted && account.charges_enabled) {
    return 'verified';
  }
  
  return 'unverified';
}

/**
 * Determine bank status based on external account data
 */
function determineBankStatus(externalAccount: Stripe.ExternalAccount): string {
  if (externalAccount.status === 'verified') {
    return 'verified';
  } else if (externalAccount.status === 'pending') {
    return 'pending';
  } else {
    return 'rejected';
  }
}

/**
 * Handle transfer.created webhook event
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    console.log(`Transfer created: ${transfer.id}`);
    
    // Find payout by transfer ID
    const payout = await prisma.payout.findFirst({
      where: {
        OR: [
          { supplierTransferId: transfer.id },
          { vendorTransferId: transfer.id }
        ]
      }
    });
    
    if (!payout) {
      console.log(`No payout found for transfer: ${transfer.id}`);
      return;
    }
    
    // Update transfer status
    const updateData: any = {};
    
    if (payout.supplierTransferId === transfer.id) {
      updateData.supplierTransferStatus = transfer.status;
    }
    
    if (payout.vendorTransferId === transfer.id) {
      updateData.vendorTransferStatus = transfer.status;
    }
    
    await prisma.payout.update({
      where: { id: payout.id },
      data: updateData
    });
    
    // Create status history
    await prisma.payoutStatusHistory.create({
      data: {
        payoutId: payout.id,
        status: 'PROCESSING',
        reason: `Transfer ${transfer.id} created`,
        changedBy: 'system',
        notes: `Transfer status: ${transfer.status}`
      }
    });
    
    console.log(`Updated payout ${payout.id} with transfer status`);
  } catch (error) {
    console.error('Error handling transfer created:', error);
  }
}

/**
 * Handle transfer.updated webhook event
 */
async function handleTransferUpdated(transfer: Stripe.Transfer) {
  try {
    console.log(`Transfer updated: ${transfer.id}`);
    
    // Find payout by transfer ID
    const payout = await prisma.payout.findFirst({
      where: {
        OR: [
          { supplierTransferId: transfer.id },
          { vendorTransferId: transfer.id }
        ]
      }
    });
    
    if (!payout) {
      console.log(`No payout found for transfer: ${transfer.id}`);
      return;
    }
    
    // Update transfer status
    const updateData: any = {};
    
    if (payout.supplierTransferId === transfer.id) {
      updateData.supplierTransferStatus = transfer.status;
    }
    
    if (payout.vendorTransferId === transfer.id) {
      updateData.vendorTransferStatus = transfer.status;
    }
    
    await prisma.payout.update({
      where: { id: payout.id },
      data: updateData
    });
    
    // Check if all transfers are completed
    const updatedPayout = await prisma.payout.findUnique({
      where: { id: payout.id }
    });
    
    if (updatedPayout) {
      const allTransfersCompleted = 
        updatedPayout.supplierTransferStatus === 'paid' && 
        updatedPayout.vendorTransferStatus === 'paid';
      
      if (allTransfersCompleted && updatedPayout.status !== 'COMPLETED') {
        await prisma.payout.update({
          where: { id: payout.id },
          data: { 
            status: 'COMPLETED',
            processedAt: new Date()
          }
        });
        
        await prisma.payoutStatusHistory.create({
          data: {
            payoutId: payout.id,
            status: 'COMPLETED',
            reason: 'All transfers completed',
            changedBy: 'system',
            notes: 'Both supplier and vendor transfers completed successfully'
          }
        });
        
        console.log(`Payout ${payout.id} completed successfully`);
      }
    }
    
    console.log(`Updated payout ${payout.id} with transfer status: ${transfer.status}`);
  } catch (error) {
    console.error('Error handling transfer updated:', error);
  }
}

/**
 * Handle payout.paid webhook event
 */
async function handlePayoutPaid(payout: Stripe.Payout) {
  try {
    console.log(`Payout paid: ${payout.id}`);
    
    // Find payouts that might be related to this Stripe payout
    // Note: This is a simplified approach. In a real implementation,
    // you might want to track the relationship more explicitly
    
    // Update any pending payouts that might be related
    const relatedPayouts = await prisma.payout.findMany({
      where: {
        status: 'PROCESSING',
        OR: [
          { supplierTransferStatus: 'paid' },
          { vendorTransferStatus: 'paid' }
        ]
      }
    });
    
    for (const relatedPayout of relatedPayouts) {
      // Check if this payout is related to the Stripe payout
      // This is a simplified check - you might want to implement more sophisticated matching
      
      await prisma.payoutStatusHistory.create({
        data: {
          payoutId: relatedPayout.id,
          status: 'COMPLETED',
          reason: 'Stripe payout confirmed',
          changedBy: 'system',
          notes: `Stripe payout ${payout.id} confirmed payment`
        }
      });
    }
    
    console.log(`Processed payout.paid webhook for ${payout.id}`);
  } catch (error) {
    console.error('Error handling payout paid:', error);
  }
}

/**
 * Handle payout.failed webhook event
 */
async function handlePayoutFailed(payout: Stripe.Payout) {
  try {
    console.log(`Payout failed: ${payout.id}`);
    
    // Find related payouts and mark them as failed
    const relatedPayouts = await prisma.payout.findMany({
      where: {
        status: 'PROCESSING'
      }
    });
    
    for (const relatedPayout of relatedPayouts) {
      await prisma.payout.update({
        where: { id: relatedPayout.id },
        data: { status: 'FAILED' }
      });
      
      await prisma.payoutStatusHistory.create({
        data: {
          payoutId: relatedPayout.id,
          status: 'FAILED',
          reason: 'Stripe payout failed',
          changedBy: 'system',
          notes: `Stripe payout ${payout.id} failed: ${payout.failure_code || 'Unknown error'}`
        }
      });
    }
    
    console.log(`Processed payout.failed webhook for ${payout.id}`);
  } catch (error) {
    console.error('Error handling payout failed:', error);
  }
}