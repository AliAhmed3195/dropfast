import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        business: {
          select: {
            id: true,
            businessName: true,
            preferredCurrency: true,
            type: true
          }
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      email, 
      password, 
      role, 
      phone,
      dob,
      // Business fields
      businessName,
      businessType,
      registrationNumber,
      vatGstNumber,
      country,
      preferredCurrency,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      // KYC fields
      kycDetails
    } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with business if needed
    let user;
    
    if (role === 'VENDOR_USER' || role === 'SUPPLIER_USER') {
      // Create business first
      const business = await prisma.business.create({
        data: {
          type: role === 'VENDOR_USER' ? 'VENDOR' : 'SUPPLIER',
          businessName: businessName || name,
          businessType: businessType || 'INDIVIDUAL',
          registrationNumber: registrationNumber || null,
          vatGstNumber: vatGstNumber || null,
          country: country || 'US',
          preferredCurrency: preferredCurrency || 'USD',
          addressStreet: addressStreet || 'TBD',
          addressCity: addressCity || 'TBD',
          addressState: addressState || 'TBD',
          addressZip: addressZip || 'TBD',
          addressCountry: addressCountry || 'US',
          kycStatus: 'PENDING'
        }
      });

      // Create user with business reference
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          businessId: business.id,
          phone: phone || null,
          dob: dob ? new Date(dob) : null,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          business: {
            select: {
              id: true,
              businessName: true,
              preferredCurrency: true
            }
          },
          createdAt: true,
        },
      });
    } else {
      // Create user without business (ADMIN, CUSTOMER)
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          phone: phone || null,
          dob: dob ? new Date(dob) : null,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    }

    // Create KYC details if provided (for VENDOR_USER and SUPPLIER_USER)
    if (kycDetails && (role === 'VENDOR_USER' || role === 'SUPPLIER_USER')) {
      await prisma.stripeKycDetails.create({
        data: {
          userId: user.id,
          countryCode: kycDetails.countryCode,
          accountType: kycDetails.accountType,
          firstName: kycDetails.firstName,
          lastName: kycDetails.lastName,
          email: kycDetails.email,
          phone: kycDetails.phone,
          dobDay: kycDetails.dobDay,
          dobMonth: kycDetails.dobMonth,
          dobYear: kycDetails.dobYear,
          nationalId: kycDetails.nationalId,
          addressLine1: kycDetails.addressLine1,
          addressLine2: kycDetails.addressLine2,
          city: kycDetails.city,
          state: kycDetails.state,
          postalCode: kycDetails.postalCode,
          businessName: kycDetails.businessName,
          businessTaxId: kycDetails.businessTaxId
        }
      });
    }

    return NextResponse.json({ 
      message: 'User created successfully',
      user 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
