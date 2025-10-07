import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// POST /api/admin/payouts/bulk-process - Process multiple payouts
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payoutIds, action, payoutMethod, notes } = await request.json();

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return NextResponse.json(
        { error: 'Payout IDs are required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const validActions = ['PROCESSING', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Process each payout
    for (const payoutId of payoutIds) {
      try {
        // Get current payout
        const payout = await prisma.payout.findUnique({
          where: { id: payoutId }
        });

        if (!payout) {
          errors.push({ payoutId, error: 'Payout not found' });
          continue;
        }

        // Check if payout can be updated
        if (payout.status === 'COMPLETED' && action !== 'CANCELLED') {
          errors.push({ payoutId, error: 'Payout already completed' });
          continue;
        }

        if (payout.status === 'CANCELLED' && action !== 'PROCESSING') {
          errors.push({ payoutId, error: 'Payout is cancelled' });
          continue;
        }

        // Update payout
        const updatedPayout = await prisma.payout.update({
          where: { id: payoutId },
          data: {
            status: action as any,
            payoutMethod: payoutMethod ? payoutMethod as any : payout.payoutMethod,
            processedAt: action === 'COMPLETED' ? new Date() : undefined,
            approvedBy: action === 'COMPLETED' ? session.id : undefined,
            approvedAt: action === 'COMPLETED' ? new Date() : undefined,
            approvalNotes: notes
          }
        });

        // Create status history entry
        await prisma.payoutStatusHistory.create({
          data: {
            payoutId: payoutId,
            status: action as any,
            reason: `Bulk ${action.toLowerCase()}`,
            changedBy: session.id,
            notes: notes || `Bulk processed by admin`
          }
        });

        results.push({
          payoutId,
          status: 'success',
          payout: updatedPayout
        });

      } catch (error) {
        console.error(`Error processing payout ${payoutId}:`, error);
        errors.push({
          payoutId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Calculate summary
    const summary = {
      total: payoutIds.length,
      successful: results.length,
      failed: errors.length,
      successRate: (results.length / payoutIds.length) * 100
    };

    return NextResponse.json({
      success: true,
      summary,
      results,
      errors
    });

  } catch (error) {
    console.error('Error in bulk processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
