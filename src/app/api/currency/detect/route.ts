import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';
    
    // For testing purposes, let's use a more diverse currency detection
    // In production, you would use a proper IP geolocation service like ipapi.co or ipgeolocation.io
    
    // Check Accept-Language header
    const acceptLanguage = request.headers.get('accept-language') || '';
    let detectedCurrency = 'USD'; // Default fallback
    
    // For local development, let's simulate different currencies
    // You can change this for testing different currencies
    const testCurrency = request.headers.get('x-test-currency');
    if (testCurrency) {
      detectedCurrency = testCurrency;
    }
    // For local development, default to PKR for Pakistan testing
    else if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.0.')) {
      detectedCurrency = 'PKR'; // Pakistan Rupee for local testing
    }
    // For production, use language-based detection with priority for regional languages
    else {
      // Priority 1: Regional languages (more reliable for location)
      if (acceptLanguage.includes('ur') || acceptLanguage.includes('urdu')) {
        detectedCurrency = 'PKR';
        console.log('Detected Urdu in Accept-Language, setting PKR');
      } else if (acceptLanguage.includes('hi') || acceptLanguage.includes('hindi')) {
        detectedCurrency = 'INR';
      } else if (acceptLanguage.includes('ar') || acceptLanguage.includes('arabic')) {
        detectedCurrency = 'AED';
      } else if (acceptLanguage.includes('ms') || acceptLanguage.includes('malay')) {
        detectedCurrency = 'MYR';
      }
      // Special case: If Accept-Language contains both 'ur' and 'en-GB', prioritize 'ur' (Pakistan)
      else if (acceptLanguage.includes('ur') && acceptLanguage.includes('en-GB')) {
        detectedCurrency = 'PKR';
        console.log('Detected both Urdu and en-GB, prioritizing PKR');
      }
      // Priority 2: European languages
      else if (acceptLanguage.includes('de') || acceptLanguage.includes('german')) {
        detectedCurrency = 'EUR';
      } else if (acceptLanguage.includes('fr') || acceptLanguage.includes('french')) {
        detectedCurrency = 'EUR';
      } else if (acceptLanguage.includes('es') || acceptLanguage.includes('spanish')) {
        detectedCurrency = 'EUR';
      }
      // Priority 3: English variants (less reliable for location)
      else if (acceptLanguage.includes('en-AU') || acceptLanguage.includes('au')) {
        detectedCurrency = 'AUD';
      } else if (acceptLanguage.includes('en-CA') || acceptLanguage.includes('ca')) {
        detectedCurrency = 'CAD';
      } else if (acceptLanguage.includes('en-GB') || acceptLanguage.includes('gb')) {
        detectedCurrency = 'GBP';
      }
      // Priority 4: Asian languages
      else if (acceptLanguage.includes('ja') || acceptLanguage.includes('japanese')) {
        detectedCurrency = 'JPY';
      } else if (acceptLanguage.includes('zh') || acceptLanguage.includes('chinese')) {
        detectedCurrency = 'CNY';
      }
      // Default to USD
      else {
        detectedCurrency = 'USD';
      }
    }
    
    console.log('Currency Detection Debug:', {
      ip,
      acceptLanguage,
      detectedCurrency,
      isLocal: ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.0.'),
      testCurrency: request.headers.get('x-test-currency'),
      userAgent: request.headers.get('user-agent')
    });

    return NextResponse.json({
      success: true,
      currency: detectedCurrency,
      ip: ip,
      method: 'ip-based-detection',
      acceptLanguage: acceptLanguage,
      isLocal: ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.0.'),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Currency detection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Currency detection failed',
        currency: 'USD' // Fallback to USD
      },
      { status: 500 }
    );
  }
}
