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
    
    if (session.role === 'VENDOR_USER') {
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
    if (!session || session.role !== 'VENDOR_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, slug, templateId, logo, banner, overrides } = body;

    // Fetch user to get businessId
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { businessId: true }
    });

    // Currency is always USD
    const currency = 'USD';

    // Validate templateId exists and is active
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const template = await prisma.template.findUnique({
      where: { id: templateId, isActive: true }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found or inactive' },
        { status: 400 }
      );
    }

    // Extract only vendor customizations (overrides)
    // Vendor can only customize: logo, banner, primaryColor (from baseConfig.colorScheme.primary)
    const vendorOverrides: any = {};
    if (logo) vendorOverrides.logo = logo;
    if (banner) vendorOverrides.banner = banner;
    if (overrides?.primaryColor) {
      vendorOverrides.primaryColor = overrides.primaryColor;
    }

    console.log('Store creation request:', { 
      name, 
      description, 
      slug, 
      templateId,
      logo, 
      banner, 
      currency,
      overrides: vendorOverrides,
      user: user
    });

    const store = await prisma.store.create({
      data: {
        name,
        description,
        slug,
        templateId,
        overrides: Object.keys(vendorOverrides).length > 0 ? vendorOverrides : null,
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