import { NextRequest, NextResponse } from 'next/server';
import { getCustomerLocation, getCurrencyForCountry } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    // Get client IP from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1';

    console.log('Detecting location for IP:', clientIp);

    // Get customer location
    const location = await getCustomerLocation(clientIp);
    const currency = getCurrencyForCountry(location.country);

    console.log('Customer location detected:', { ...location, currency });

    return NextResponse.json({
      success: true,
      country: location.country,
      currency,
      ip: clientIp
    });

  } catch (error) {
    console.error('Error detecting customer location:', error);
    
    // Return default location on error
    return NextResponse.json({
      success: true,
      country: 'US',
      currency: 'USD',
      ip: '127.0.0.1'
    });
  }
}
