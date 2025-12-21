import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const { 
      name, 
      email, 
      role, 
      isActive,
      // Business update fields
      addBusiness,
      businessName,
      businessType,
      registrationNumber,
      vatGstNumber,
      country,
      preferredCurrency,
      addressStreet,
      addressCity,
      addressState,
      addressCountry
    } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
      },
      include: {
        business: true
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already taken by another user' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Handle business update/create for VENDOR_USER and SUPPLIER_USER
    let businessId = currentUser.businessId;
    if ((role === 'VENDOR_USER' || role === 'SUPPLIER_USER') && addBusiness && businessName) {
      if (currentUser.business) {
        // Update existing business
        const updatedBusiness = await prisma.business.update({
          where: { id: currentUser.business.id },
          data: {
            businessName,
            businessType: businessType || 'INDIVIDUAL',
            registrationNumber: registrationNumber || null,
            vatGstNumber: vatGstNumber || null,
            country: country || 'US',
            addressStreet: addressStreet || 'TBD',
            addressCity: addressCity || 'TBD',
            addressState: addressState || 'TBD',
            addressCountry: addressCountry || country || 'US',
            preferredCurrency: preferredCurrency || 'USD'
          }
        });
        businessId = updatedBusiness.id;
      } else {
        // Create new business
        const newBusiness = await prisma.business.create({
          data: {
            type: role === 'VENDOR_USER' ? 'VENDOR' : 'SUPPLIER',
            businessName,
            businessType: businessType || 'INDIVIDUAL',
            registrationNumber: registrationNumber || null,
            vatGstNumber: vatGstNumber || null,
            country: country || 'US',
            addressStreet: addressStreet || 'TBD',
            addressCity: addressCity || 'TBD',
            addressState: addressState || 'TBD',
            postalCode: 'TBD',
            addressCountry: addressCountry || country || 'US',
            kycStatus: 'PENDING',
            preferredCurrency: preferredCurrency || 'USD'
          }
        });
        businessId = newBusiness.id;
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        status: isActive !== undefined ? (isActive ? 'ACTIVE' : 'SUSPENDED') : undefined,
        businessId: businessId,
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
            businessName: true
          }
        },
        createdAt: true,
      },
    });

    return NextResponse.json({ 
      message: 'User updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error updating user:', error);
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
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Prevent admin from deleting themselves
    if (userId === session.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
