import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amount = parseFloat(searchParams.get('amount') || '0');

    if (!from || !to || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to, amount' },
        { status: 400 }
      );
    }

    if (from === to) {
      return NextResponse.json({
        success: true,
        convertedAmount: amount,
        exchangeRate: 1,
        from,
        to,
        originalAmount: amount
      });
    }

    // Try to get live exchange rate
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`,
        { 
          headers: { 'User-Agent': 'FastDrop/1.0' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rate = data.rates[to];
        
        if (rate) {
          const convertedAmount = amount * rate;
          return NextResponse.json({
            success: true,
            convertedAmount: convertedAmount,
            exchangeRate: rate,
            from,
            to,
            originalAmount: amount
          });
        }
      }
    } catch (error) {
      console.log('Live API failed, using fallback rates');
    }

    // Fallback exchange rates (approximate)
    const fallbackRates: { [key: string]: { [key: string]: number } } = {
      'USD': {
        'EUR': 0.85,
        'GBP': 0.73,
        'PKR': 280.0,
        'CAD': 1.35,
        'AUD': 1.50,
        'JPY': 150.0,
        'INR': 83.0,
        'AED': 3.67,
        'SAR': 3.75,
        'MYR': 4.20,
        'CHF': 0.88,
        'SEK': 10.5,
        'NOK': 10.8,
        'DKK': 6.8,
        'PLN': 4.0,
        'CZK': 22.5,
        'HUF': 360.0,
        'RON': 4.6,
        'BGN': 1.7,
        'HRK': 6.8,
        'RSD': 100.0,
        'BAM': 1.7,
        'MKD': 55.0,
        'ALL': 95.0,
        'MNT': 3400.0,
        'KZT': 450.0,
        'UZS': 12000.0,
        'KGS': 89.0,
        'TJS': 10.8,
        'TMT': 3.5,
        'AFN': 70.0,
        'BDT': 110.0,
        'LKR': 325.0,
        'NPR': 133.0,
        'BTN': 83.0,
        'MVR': 15.4,
        'IDR': 15500.0,
        'THB': 35.0,
        'VND': 24000.0,
        'PHP': 56.0,
        'SGD': 1.35,
        'BND': 1.35,
        'MMK': 2100.0,
        'LAK': 20000.0,
        'KHR': 4100.0,
        'KRW': 1300.0,
        'TWD': 31.0,
        'HKD': 7.8,
        'MOP': 8.0,
        'CNY': 7.2,
        'MXN': 17.0,
        'BRL': 5.0,
        'ARS': 850.0,
        'CLP': 900.0,
        'COP': 4100.0,
        'PEN': 3.7,
        'UYU': 39.0,
        'VES': 36.0,
        'BOB': 6.9,
        'PYG': 7300.0,
        'ZAR': 18.5,
        'EGP': 31.0,
        'MAD': 10.0,
        'TND': 3.1,
        'DZD': 135.0,
        'LYD': 4.8,
        'ETB': 55.0,
        'KES': 130.0,
        'UGX': 3700.0,
        'TZS': 2500.0,
        'RWF': 1200.0,
        'GHS': 12.0,
        'NGN': 750.0,
        'XOF': 600.0,
        'XAF': 600.0,
        'TRY': 30.0,
        'ILS': 3.7,
        'JOD': 0.71,
        'LBP': 15000.0,
        'KWD': 0.31,
        'BHD': 0.38,
        'QAR': 3.64,
        'OMR': 0.38,
        'YER': 250.0,
        'IRR': 42000.0,
        'IQD': 1310.0,
        'SYP': 13000.0,
      },
      'EUR': {
        'USD': 1.18,
        'GBP': 0.86,
        'PKR': 330.0,
        'CAD': 1.59,
        'AUD': 1.76,
        'JPY': 176.0,
        'INR': 98.0,
        'AED': 4.32,
        'SAR': 4.41,
        'MYR': 4.94,
      },
      'GBP': {
        'USD': 1.37,
        'EUR': 1.16,
        'PKR': 384.0,
        'CAD': 1.85,
        'AUD': 2.05,
        'JPY': 205.0,
        'INR': 114.0,
        'AED': 5.03,
        'SAR': 5.14,
        'MYR': 5.75,
      },
      'PKR': {
        'USD': 0.0036,
        'EUR': 0.0030,
        'GBP': 0.0026,
        'CAD': 0.0048,
        'AUD': 0.0054,
        'JPY': 0.54,
        'INR': 0.30,
        'AED': 0.013,
        'SAR': 0.013,
        'MYR': 0.015,
      },
      'CAD': {
        'USD': 0.74,
        'EUR': 0.63,
        'GBP': 0.54,
        'PKR': 207.0,
        'AUD': 1.11,
        'JPY': 111.0,
        'INR': 61.0,
        'AED': 2.72,
        'SAR': 2.78,
        'MYR': 3.11,
      },
      'AUD': {
        'USD': 0.67,
        'EUR': 0.57,
        'GBP': 0.49,
        'PKR': 187.0,
        'CAD': 0.90,
        'JPY': 100.0,
        'INR': 55.0,
        'AED': 2.45,
        'SAR': 2.50,
        'MYR': 2.80,
      },
      'JPY': {
        'USD': 0.0067,
        'EUR': 0.0057,
        'GBP': 0.0049,
        'PKR': 1.87,
        'CAD': 0.0090,
        'AUD': 0.010,
        'INR': 0.55,
        'AED': 0.024,
        'SAR': 0.025,
        'MYR': 0.028,
      },
      'INR': {
        'USD': 0.012,
        'EUR': 0.010,
        'GBP': 0.0088,
        'PKR': 3.37,
        'CAD': 0.016,
        'AUD': 0.018,
        'JPY': 1.81,
        'AED': 0.044,
        'SAR': 0.045,
        'MYR': 0.051,
      },
      'AED': {
        'USD': 0.27,
        'EUR': 0.23,
        'GBP': 0.20,
        'PKR': 77.0,
        'CAD': 0.37,
        'AUD': 0.41,
        'JPY': 41.0,
        'INR': 23.0,
        'SAR': 1.02,
        'MYR': 1.14,
      },
      'SAR': {
        'USD': 0.27,
        'EUR': 0.23,
        'GBP': 0.19,
        'PKR': 75.0,
        'CAD': 0.36,
        'AUD': 0.40,
        'JPY': 40.0,
        'INR': 22.0,
        'AED': 0.98,
        'MYR': 1.12,
      },
      'MYR': {
        'USD': 0.24,
        'EUR': 0.20,
        'GBP': 0.17,
        'PKR': 67.0,
        'CAD': 0.32,
        'AUD': 0.36,
        'JPY': 36.0,
        'INR': 20.0,
        'AED': 0.88,
        'SAR': 0.89,
      },
    };

    const rate = fallbackRates[from]?.[to];
    
    if (!rate) {
      return NextResponse.json(
        { error: `Exchange rate not available for ${from} to ${to}` },
        { status: 400 }
      );
    }

    const convertedAmount = amount * rate;
    
    return NextResponse.json({
      success: true,
      convertedAmount: convertedAmount,
      exchangeRate: rate,
      from,
      to,
      originalAmount: amount,
      fallback: true
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}