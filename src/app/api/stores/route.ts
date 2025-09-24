import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        products: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

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

    console.log('Store creation request:', { name, description, slug, template, logo, banner });

    const store = await prisma.store.create({
      data: {
        name,
        description,
        slug,
        template,
        logo: logo || null,
        banner: banner || null,
        ownerId: session.id,
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