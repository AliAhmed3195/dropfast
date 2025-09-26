import { NextRequest, NextResponse } from 'next/server';
import { currencyService } from '@/lib/currency-conversion';

export async function POST(request: NextRequest) {
  try {
    const { amount, fromCurrency, toCurrency } = await request.json();

    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, fromCurrency, toCurrency' },
        { status: 400 }
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const convertedAmount = await currencyService.convert(
      parseFloat(amount),
      fromCurrency,
      toCurrency
    );

    const rate = await currencyService.getRate(fromCurrency, toCurrency);

    return NextResponse.json({
      success: true,
      originalAmount: parseFloat(amount),
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
      convertedCurrency: toCurrency,
      exchangeRate: Math.round(rate * 100000) / 100000, // Round to 5 decimal places
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Currency conversion failed' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromCurrency = searchParams.get('from');
    const toCurrency = searchParams.get('to');

    if (!fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to' },
        { status: 400 }
      );
    }

    const rate = await currencyService.getRate(fromCurrency, toCurrency);

    return NextResponse.json({
      success: true,
      fromCurrency,
      toCurrency,
      exchangeRate: Math.round(rate * 100000) / 100000,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 400 }
    );
  }
}
