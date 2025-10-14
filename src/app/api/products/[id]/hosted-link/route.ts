import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ 
        error: 'Only vendors can create hosted links. Suppliers cannot create hosted links directly.' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'This endpoint is deprecated. Vendors should use the import products feature to create hosted links.' 
    }, { status: 400 });
  } catch (error) {
    console.error('Error generating hosted link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
