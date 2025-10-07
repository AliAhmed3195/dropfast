import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Filter stores by the current user's role
    let whereClause = {};
    
    if (session.role === 'VENDOR') {
      // Vendors can only see their own stores
      whereClause = { ownerId: session.id };
    } else if (session.role === 'ADMIN') {
      // Admins can see all stores
      whereClause = {};
    } else {
      // Other roles cannot access stores
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stores = await prisma.store.findMany({
      where: whereClause,
      include: {
        products: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Stores API - User:', session.id, 'Role:', session.role, 'Where clause:', whereClause, 'Stores found:', stores.length);
    
    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, slug, template, logo, banner } = body;

    // Get user's business currency
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { business: true }
    });

    const currency = user?.business?.preferredCurrency || 'USD';

    console.log('Store creation request:', { name, description, slug, template, logo, banner, currency });

    const store = await prisma.store.create({
      data: {
        name,
        description,
        slug,
        template,
        logo: logo || null,
        banner: banner || null,
        currency,
        ownerId: session.id,
        businessId: user?.businessId || null,
        isActive: true,
      },
    });

    console.log('Store created successfully:', { 
      id: store.id, 
      name: store.name, 
      logo: store.logo, 
      banner: store.banner,
      slug: store.slug
    });

    return NextResponse.json({ store });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}