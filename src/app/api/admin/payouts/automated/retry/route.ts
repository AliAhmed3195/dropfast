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

    // Check if retry is already running
    const status = automatedPayoutProcessor.getProcessingStatus();
    if (status.isRetrying) {
      return NextResponse.json({
        error: 'Automated retry is already running'
      }, { status: 409 });
    }

    // Start automated retry
    const result = await automatedPayoutProcessor.retryFailedPayouts(
      batchSize,
      maxConcurrent
    );

    return NextResponse.json({
      success: result.success,
      message: `Retried ${result.retried} payouts successfully, ${result.failed} failed`,
      data: {
        retried: result.retried,
        failed: result.failed,
        total: result.retried + result.failed,
        errors: result.errors,
        results: result.results
      }
    });

  } catch (error) {
    console.error('Error in automated payout retry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
