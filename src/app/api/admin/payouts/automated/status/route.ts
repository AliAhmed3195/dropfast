import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { automatedPayoutProcessor } from '@/lib/automated-payout-processor';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get processing status
    const processingStatus = automatedPayoutProcessor.getProcessingStatus();
    
    // Get processing statistics
    const stats = await automatedPayoutProcessor.getProcessingStats();

    return NextResponse.json({
      success: true,
      data: {
        processing: processingStatus,
        statistics: stats,
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting automated processing status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
