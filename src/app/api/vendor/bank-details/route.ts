import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { business: true }
    });

    if (!user?.business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const bankDetails = await prisma.bankDetails.findFirst({
      where: { businessId: user.business.id }
    });

    return NextResponse.json({ bankDetails });
  } catch (error) {
    console.error('Error fetching vendor bank details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

