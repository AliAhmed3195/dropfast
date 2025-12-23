import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function updateStoreSettings(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if store belongs to the vendor
    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore || existingStore.ownerId !== session.id) {
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
        invoiceTemplate: body.invoiceTemplate, // Store-specific template (each store has its own)
      },
    });

    console.log(`[Store Template Updated] Store: ${store.name} (ID: ${id}), New template: ${body.invoiceTemplate}`);
    console.log(`[Store Template Info] This template will be used for all future invoices from this store only.`);

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