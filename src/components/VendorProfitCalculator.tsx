'use client';

import { useState } from 'react';

interface VendorProfitCalculatorProps {
  supplierPrice: number; // USD price from supplier
  suggestedAmount?: number; // Suggested amount from supplier
  onMarkupCalculated: (markup: number, markupType: 'percentage' | 'fixed', finalPrice: number) => void;
  className?: string;
}

export default function VendorProfitCalculator({ 
  supplierPrice, 
  suggestedAmount,
  onMarkupCalculated, 
  className = '' 
}: VendorProfitCalculatorProps) {
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage');
  const [markupValue, setMarkupValue] = useState<number>(10);
  const [finalPrice, setFinalPrice] = useState<number>(0);

  const calculateMarkup = () => {
    let calculatedMarkupAmount = 0;
    let calculatedFinalPrice = 0;

    if (markupType === 'percentage') {
      calculatedMarkupAmount = (supplierPrice * markupValue) / 100;
      calculatedFinalPrice = supplierPrice + calculatedMarkupAmount;
    } else {
      calculatedMarkupAmount = markupValue;
      calculatedFinalPrice = supplierPrice + calculatedMarkupAmount;
    }

    setFinalPrice(calculatedFinalPrice);
    onMarkupCalculated(calculatedMarkupAmount, markupType, calculatedFinalPrice);
  };

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-medium text-green-800 mb-4">Profit Calculator</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supplier Price: ${supplierPrice.toFixed(2)} USD
          </label>
        </div>

        {suggestedAmount && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Amount: ${suggestedAmount.toFixed(2)} USD
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Markup Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="percentage"
                checked={markupType === 'percentage'}
                onChange={(e) => setMarkupType(e.target.value as 'percentage' | 'fixed')}
                className="mr-2"
              />
              Percentage
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="fixed"
                checked={markupType === 'fixed'}
                onChange={(e) => setMarkupType(e.target.value as 'percentage' | 'fixed')}
                className="mr-2"
              />
              Fixed Amount
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {markupType === 'percentage' ? 'Markup Percentage' : 'Markup Amount (USD)'}
          </label>
          <input
            type="number"
            value={markupValue}
            onChange={(e) => setMarkupValue(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            step={markupType === 'percentage' ? '0.1' : '0.01'}
          />
        </div>

        <button
          onClick={calculateMarkup}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Calculate
        </button>

        {finalPrice > 0 && (
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Final Price</h4>
            <div className="text-2xl font-bold text-green-600">
              ${finalPrice.toFixed(2)} USD
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
