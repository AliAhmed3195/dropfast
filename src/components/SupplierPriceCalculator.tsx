'use client';

import { useState, useEffect } from 'react';

interface SupplierPriceCalculatorProps {
  onUSDCalculated: (usdAmount: number) => void;
  onSuggestedAmountCalculated?: (usdAmount: number) => void;
  defaultCurrency?: string;
  className?: string;
}

export default function SupplierPriceCalculator({ 
  onUSDCalculated, 
  onSuggestedAmountCalculated,
  defaultCurrency = 'EUR',
  className = '' 
}: SupplierPriceCalculatorProps) {
  const [localAmount, setLocalAmount] = useState<number>(0);
  const [localCurrency, setLocalCurrency] = useState<string>(defaultCurrency);
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Suggested Amount states
  const [suggestedLocalAmount, setSuggestedLocalAmount] = useState<number>(0);
  const [suggestedUsdAmount, setSuggestedUsdAmount] = useState<number>(0);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedError, setSuggestedError] = useState<string>('');

  const currencies = [
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
    { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
    { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
    { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин' },
    { code: 'BAM', name: 'Bosnia-Herzegovina Mark', symbol: 'KM' },
    { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден' },
    { code: 'ALL', name: 'Albanian Lek', symbol: 'L' },
    { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮' },
    { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
    { code: 'UZS', name: 'Uzbekistani Som', symbol: 'сўм' },
    { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'сом' },
    { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM' },
    { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'T' },
    { code: 'AFN', name: 'Afghan Afghani', symbol: '؋' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
    { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
    { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.' },
    { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: '.ރ' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'BND', name: 'Brunei Dollar', symbol: 'B$' },
    { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
    { code: 'LAK', name: 'Lao Kip', symbol: '₭' },
    { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
    { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
    { code: 'COP', name: 'Colombian Peso', symbol: '$' },
    { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
    { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
    { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.S' },
    { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs' },
    { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
    { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
    { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج' },
    { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
    { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
    { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا' },
    { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.' },
    { code: 'YER', name: 'Yemeni Rial', symbol: '﷼' },
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼' },
    { code: 'IQD', name: 'Iraqi Dinar', symbol: 'د.ع' },
    { code: 'SYP', name: 'Syrian Pound', symbol: '£' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
    { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
    { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.' },
    { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: '.ރ' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'BND', name: 'Brunei Dollar', symbol: 'B$' },
    { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
    { code: 'LAK', name: 'Lao Kip', symbol: '₭' },
    { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
    { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
    { code: 'COP', name: 'Colombian Peso', symbol: '$' },
    { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
    { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
    { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.S' },
    { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs' },
    { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
    { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
    { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج' },
    { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
    { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
    { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا' },
    { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.' },
    { code: 'YER', name: 'Yemeni Rial', symbol: '﷼' },
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼' },
    { code: 'IQD', name: 'Iraqi Dinar', symbol: 'د.ع' },
    { code: 'SYP', name: 'Syrian Pound', symbol: '£' },
  ];

  useEffect(() => {
    if (localAmount > 0 && localCurrency !== 'USD') {
      convertToUSD();
    } else if (localCurrency === 'USD') {
      setUsdAmount(localAmount);
      setExchangeRate(1);
      onUSDCalculated(localAmount);
    }
  }, [localAmount, localCurrency]);

  useEffect(() => {
    if (suggestedLocalAmount > 0 && localCurrency !== 'USD') {
      convertSuggestedToUSD();
    } else if (localCurrency === 'USD') {
      setSuggestedUsdAmount(suggestedLocalAmount);
      if (onSuggestedAmountCalculated) {
        onSuggestedAmountCalculated(suggestedLocalAmount);
      }
    }
  }, [suggestedLocalAmount, localCurrency]);

  const convertToUSD = async () => {
    if (localCurrency === 'USD') {
      setUsdAmount(localAmount);
      setExchangeRate(1);
      onUSDCalculated(localAmount);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/currency/convert?from=${localCurrency}&to=USD&amount=${localAmount}`);
      
      if (response.ok) {
        const data = await response.json();
        const convertedAmount = data.convertedAmount;
        const rate = data.exchangeRate;
        
        setUsdAmount(convertedAmount);
        setExchangeRate(rate);
        onUSDCalculated(convertedAmount);
      } else {
        // Use fallback rates
        const fallbackRates: { [key: string]: number } = {
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
        };
        
        const fallbackRate = fallbackRates[localCurrency] || 1;
        const convertedAmount = localAmount / fallbackRate;
        
        setUsdAmount(convertedAmount);
        setExchangeRate(fallbackRate);
        onUSDCalculated(convertedAmount);
        setError('Using fallback exchange rate');
      }
    } catch (error) {
      console.error('Currency conversion error:', error);
      setError('Failed to convert currency');
    } finally {
      setLoading(false);
    }
  };

  const convertSuggestedToUSD = async () => {
    if (localCurrency === 'USD') {
      setSuggestedUsdAmount(suggestedLocalAmount);
      if (onSuggestedAmountCalculated) {
        onSuggestedAmountCalculated(suggestedLocalAmount);
      }
      return;
    }

    setSuggestedLoading(true);
    setSuggestedError('');

    try {
      const response = await fetch(`/api/currency/convert?from=${localCurrency}&to=USD&amount=${suggestedLocalAmount}`);
      
      if (response.ok) {
        const data = await response.json();
        const convertedAmount = data.convertedAmount;
        
        setSuggestedUsdAmount(convertedAmount);
        if (onSuggestedAmountCalculated) {
          onSuggestedAmountCalculated(convertedAmount);
        }
      } else {
        // Use fallback rates
        const fallbackRates: { [key: string]: number } = {
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
        };
        
        const fallbackRate = fallbackRates[localCurrency] || 1;
        const convertedAmount = suggestedLocalAmount / fallbackRate;
        
        setSuggestedUsdAmount(convertedAmount);
        if (onSuggestedAmountCalculated) {
          onSuggestedAmountCalculated(convertedAmount);
        }
        setSuggestedError('Using fallback exchange rate');
      }
    } catch (error) {
      console.error('Currency conversion error:', error);
      setSuggestedError('Failed to convert currency');
    } finally {
      setSuggestedLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const currencyObj = currencies.find(c => c.code === currency);
    return currencyObj?.symbol || currency;
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-blue-800">
            USD Price Calculator
          </h3>
          <p className="text-sm text-blue-600">
            Enter your local price to see the USD equivalent
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Local Currency
            </label>
            <select
              value={localCurrency}
              onChange={(e) => setLocalCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Local Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">
                  {getCurrencySymbol(localCurrency)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={localAmount || ''}
                onChange={(e) => setLocalAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              USD Price (Will be stored)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={usdAmount.toFixed(2)}
                readOnly
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-semibold"
              />
            </div>
          </div>

          {/* Suggested Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Amount (Your Currency)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">
                  {getCurrencySymbol(localCurrency)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={suggestedLocalAmount || ''}
                onChange={(e) => setSuggestedLocalAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Suggested selling price for vendors</p>
          </div>

          {/* Suggested Amount USD Output */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Amount USD (Will be stored)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={suggestedUsdAmount.toFixed(2)}
                readOnly
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-semibold"
              />
            </div>
          </div>

          {exchangeRate !== 1 && (
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span className="font-medium">
                    1 {localCurrency} = ${(1/exchangeRate).toFixed(4)} USD
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Your Price:</span>
                  <span className="font-medium">
                    {getCurrencySymbol(localCurrency)}{localAmount.toFixed(2)} {localCurrency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center text-blue-600">
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Converting...
            </div>
          )}

          {error && (
            <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
              ⚠️ {error}
            </div>
          )}

          {suggestedLoading && (
            <div className="flex items-center text-blue-600">
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Converting suggested amount...
            </div>
          )}

          {suggestedError && (
            <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
              ⚠️ {suggestedError}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="space-y-2">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-800">
              <strong>${usdAmount.toFixed(2)} USD</strong> will be stored as your product price
            </span>
          </div>
          {suggestedUsdAmount > 0 && (
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-800">
                <strong>${suggestedUsdAmount.toFixed(2)} USD</strong> will be stored as suggested amount
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
