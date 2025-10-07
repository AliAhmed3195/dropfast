import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { scheduledPayoutProcessor } from '@/lib/scheduled-payout-processor';

// POST /api/admin/payouts/process-scheduled - Process all APPROVAL_REQUIRED payouts
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting scheduled payout processing...');

    // Process all APPROVAL_REQUIRED payouts
    const results = await scheduledPayoutProcessor.processApprovalRequiredPayouts();

    // Get processing statistics
    const stats = await scheduledPayoutProcessor.getProcessingStats();

    console.log(`Scheduled processing completed. Results:`, results);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} payouts`,
      results,
      statistics: stats
    });

  } catch (error) {
    console.error('Error in scheduled payout processing:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/payouts/process-scheduled - Get processing statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get processing statistics
    const stats = await scheduledPayoutProcessor.getProcessingStats();

    return NextResponse.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Error getting processing statistics:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
