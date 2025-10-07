import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id
      },
      include: {
        storeProducts: {
          include: {
            product: true
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ store });

  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { autoForwardOrders, name, description, currency } = body;

    // Verify store ownership
    const existingStore = await prisma.store.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id
      }
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Update store
    const updatedStore = await prisma.store.update({
      where: { id: params.id },
      data: {
        ...(autoForwardOrders !== undefined && { autoForwardOrders }),
        ...(name && { name }),
        ...(description && { description }),
        ...(currency && { currency }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Store updated successfully',
      store: updatedStore
    });

  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify store ownership
    const existingStore = await prisma.store.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id
      }
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Delete store
    await prisma.store.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Store deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
