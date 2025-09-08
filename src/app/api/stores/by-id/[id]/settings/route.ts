import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function updateStoreSettings(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if store belongs to the vendor
    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore || existingStore.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const store = await prisma.store.update({
      where: { id },
      data: {
        logo: body.logo,
        address: body.address,
        phone: body.phone,
        email: body.email,
        taxNumber: body.taxNumber,
        invoiceTemplate: body.invoiceTemplate,
      },
    });

    return NextResponse.json({ store });
  } catch (error) {
    console.error('Error updating store settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  return updateStoreSettings(request, { params });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return updateStoreSettings(request, { params });
}