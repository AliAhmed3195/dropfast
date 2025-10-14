import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { automatedPayoutProcessor } from '@/lib/automated-payout-processor';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batchSize = 10, maxConcurrent = 5 } = await request.json();

    // Check if processing is already running
    const status = automatedPayoutProcessor.getProcessingStatus();
    if (status.isProcessing) {
      return NextResponse.json({
        error: 'Automated processing is already running'
      }, { status: 409 });
    }

    // Start automated processing
    const result = await automatedPayoutProcessor.processApprovedPayouts(
      batchSize,
      maxConcurrent
    );

    return NextResponse.json({
      success: result.success,
      message: `Processed ${result.processed} payouts successfully, ${result.failed} failed`,
      data: {
        processed: result.processed,
        failed: result.failed,
        total: result.processed + result.failed,
        errors: result.errors,
        results: result.results
      }
    });

  } catch (error) {
    console.error('Error in automated payout processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
