import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        products: {
          where: {
            isActive: true,
          },
          include: {
            supplier: {
              select: {
                name: true,
              },
            },
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error('Error fetching store by slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}