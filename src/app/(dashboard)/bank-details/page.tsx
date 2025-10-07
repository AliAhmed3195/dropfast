'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BankDetails {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  bankAddress: string;
  bankCity: string;
  bankCountry: string;
  bankPostalCode?: string;
  taxId?: string;
  taxIdType?: string;
  isVerified: boolean;
  verifiedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BankDetailsPage() {
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    iban: '',
    bankAddress: '',
    bankCity: '',
    bankCountry: '',
    bankPostalCode: '',
    taxId: '',
    taxIdType: 'SSN'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await fetch('/api/user/bank-details');
      const data = await response.json();
      
      if (data.bankDetails) {
        setBankDetails(data.bankDetails);
        // Pre-fill form with existing data
        setFormData({
          bankName: data.bankDetails.bankName || '',
          accountHolderName: data.bankDetails.accountHolderName || '',
          accountNumber: data.bankDetails.accountNumber || '',
          routingNumber: data.bankDetails.routingNumber || '',
          swiftCode: data.bankDetails.swiftCode || '',
          iban: data.bankDetails.iban || '',
          bankAddress: data.bankDetails.bankAddress || '',
          bankCity: data.bankDetails.bankCity || '',
          bankCountry: data.bankDetails.bankCountry || '',
          bankPostalCode: data.bankDetails.bankPostalCode || '',
          taxId: data.bankDetails.taxId || '',
          taxIdType: data.bankDetails.taxIdType || 'SSN'
        });
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }
    if (!formData.bankAddress.trim()) {
      newErrors.bankAddress = 'Bank address is required';
    }
    if (!formData.bankCity.trim()) {
      newErrors.bankCity = 'Bank city is required';
    }
    if (!formData.bankCountry.trim()) {
      newErrors.bankCountry = 'Bank country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/bank-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Bank details saved successfully!');
        fetchBankDetails(); // Refresh data
        router.push('/dashboard'); // Redirect to dashboard
      } else {
        alert(data.error || 'Error saving bank details');
      }
    } catch (error) {
      console.error('Error saving bank details:', error);
      alert('Error saving bank details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Bank Details</h1>
            <p className="text-gray-600 mt-1">
              {bankDetails ? 'Update your bank details' : 'Add your bank details to receive payouts'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Bank Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.bankName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter bank name"
                  />
                  {errors.bankName && (
                    <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter account holder name"
                  />
                  {errors.accountHolderName && (
                    <p className="text-red-500 text-xs mt-1">{errors.accountHolderName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter account number"
                  />
                  {errors.accountNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    name="routingNumber"
                    value={formData.routingNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter routing number (US banks)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SWIFT Code
                  </label>
                  <input
                    type="text"
                    name="swiftCode"
                    value={formData.swiftCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter SWIFT code (international)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter IBAN (European banks)"
                  />
                </div>
              </div>
            </div>

            {/* Bank Address */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="bankAddress"
                    value={formData.bankAddress}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.bankAddress ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter bank address"
                  />
                  {errors.bankAddress && (
                    <p className="text-red-500 text-xs mt-1">{errors.bankAddress}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="bankCity"
                      value={formData.bankCity}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bankCity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter city"
                    />
                    {errors.bankCity && (
                      <p className="text-red-500 text-xs mt-1">{errors.bankCity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      name="bankCountry"
                      value={formData.bankCountry}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bankCountry ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter country"
                    />
                    {errors.bankCountry && (
                      <p className="text-red-500 text-xs mt-1">{errors.bankCountry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="bankPostalCode"
                      value={formData.bankPostalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID Type
                  </label>
                  <select
                    name="taxIdType"
                    value={formData.taxIdType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SSN">SSN (US)</option>
                    <option value="EIN">EIN (US)</option>
                    <option value="VAT">VAT (EU)</option>
                    <option value="GST">GST (India)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tax ID"
                  />
                </div>
              </div>
            </div>

            {/* Status Display */}
            {bankDetails && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Current Status</h4>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bankDetails.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bankDetails.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bankDetails.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {bankDetails.isActive ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                {bankDetails.verifiedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Verified on: {new Date(bankDetails.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (bankDetails ? 'Update Bank Details' : 'Save Bank Details')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
