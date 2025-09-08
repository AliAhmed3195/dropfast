import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all invoices for vendor's stores
    const invoices = await prisma.invoice.findMany({
      where: {
        store: {
          ownerId: session.id
        }
      },
      include: {
        order: {
          include: {
            product: {
              include: {
                supplier: {
                  select: {
                    name: true,
                  }
                }
              }
            },
            customer: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        store: {
          select: {
            name: true,
            logo: true,
            address: true,
            phone: true,
            email: true,
            taxNumber: true,
            template: true,
          }
        },
        customer: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
