'use client';

import { useState, useEffect } from 'react';
import { clientCountrySpecsService, BankFieldSpec } from '@/lib/client-country-specs';

interface BankDetailsFormProps {
  countryCode: string;
  onSubmit: (bankDetails: Record<string, any>) => void;
  loading?: boolean;
  initialData?: Record<string, any>;
}

export default function BankDetailsForm({ 
  countryCode, 
  onSubmit, 
  loading = false,
  initialData = {}
}: BankDetailsFormProps) {
  const [fields, setFields] = useState<BankFieldSpec[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingFields, setLoadingFields] = useState(true);

  useEffect(() => {
    loadBankFields();
  }, [countryCode]);

  const loadBankFields = async () => {
    try {
      setLoadingFields(true);
      const bankFields = await clientCountrySpecsService.generateBankFields(countryCode);
      setFields(bankFields);
    } catch (error) {
      console.error('Error loading bank fields:', error);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    try {
      const validation = await clientCountrySpecsService.validateBankDetails(countryCode, formData);
      setErrors(validation.errors);
      return validation.isValid;
    } catch (error) {
      console.error('Validation error:', error);
      setErrors({ general: 'Validation failed' });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (isValid) {
      onSubmit(formData);
    }
  };

  const renderField = (field: BankFieldSpec) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    return (
      <div key={field.name} className="mb-4">
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'select' ? (
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            required={field.required}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
          />
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  if (loadingFields) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading bank details form...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Bank Details for {countryCode.toUpperCase()}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Please provide your bank account details for payouts. All information is securely processed by Stripe.</p>
            </div>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(renderField)}
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Bank Details'}
        </button>
      </div>
    </form>
  );
}

