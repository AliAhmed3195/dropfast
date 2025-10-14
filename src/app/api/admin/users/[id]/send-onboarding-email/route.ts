import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const { onboardingLink } = await request.json();

    if (!onboardingLink) {
      return NextResponse.json(
        { error: 'Onboarding link is required' },
        { status: 400 }
      );
    }

    // Get user with business details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.business) {
      return NextResponse.json(
        { error: 'User does not have a business profile' },
        { status: 400 }
      );
    }

    if (user.role !== 'VENDOR_USER' && user.role !== 'SUPPLIER_USER') {
      return NextResponse.json(
        { error: 'Email can only be sent to vendor or supplier users' },
        { status: 400 }
      );
    }

    // Send onboarding email
    const emailSent = await emailService.sendOnboardingEmail(
      user.email,
      user.name,
      user.role as 'VENDOR_USER' | 'SUPPLIER_USER',
      onboardingLink,
      user.business.country || 'US'
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email. Please check email configuration.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding email sent successfully',
      data: {
        userId: userId,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        businessCountry: user.business.country,
        emailSent: true,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error sending onboarding email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send onboarding email' },
      { status: 500 }
    );
  }
}
