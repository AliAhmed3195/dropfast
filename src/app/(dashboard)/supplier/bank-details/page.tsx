'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BankDetailsForm from '@/components/forms/BankDetailsForm';

interface BankDetails {
  id: string;
  countryCode: string;
  fields: Record<string, any>;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

interface Business {
  id: string;
  country: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  stripeAccountId: string | null;
}

export default function SupplierBankDetailsPage() {
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const authResponse = await fetch('/api/auth/me');
      if (!authResponse.ok) {
        router.push('/login');
        return;
      }

      // Get user's business
      const response = await fetch('/api/supplier/business');
      if (response.ok) {
        const data = await response.json();
        setBusiness(data.business);
      }

      // Get existing bank details
      const bankResponse = await fetch('/api/supplier/bank-details');
      if (bankResponse.ok) {
        const bankData = await bankResponse.json();
        setBankDetails(bankData.bankDetails);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/stripe/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankDetails: formData,
          countryCode: business?.country,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Bank details submitted:', result);
        
        // Reload data to get updated status
        await loadData();
        
        // Show success message
        alert('Bank details submitted successfully! Your account is being verified.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit bank details');
      }
    } catch (error) {
      console.error('Error submitting bank details:', error);
      setError('Failed to submit bank details');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Your bank account is verified and ready for payouts!';
      case 'PENDING':
        return 'Your bank account is being verified. This usually takes a few minutes.';
      case 'REJECTED':
        return 'Your bank account verification failed. Please update your details and try again.';
      default:
        return 'Please add your bank details to receive payouts.';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Bank Details</h1>
          <p className="text-gray-600 mt-2">Manage your bank account for payouts</p>
        </div>

        {/* Status Card */}
        {business && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account Status</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getStatusMessage(business.kycStatus)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(business.kycStatus)}`}>
                  {business.kycStatus}
                </span>
                {business.stripeAccountId && (
                  <span className="text-xs text-gray-500">
                    ID: {business.stripeAccountId.slice(-8)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Bank Details Form */}
        {business && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {bankDetails ? 'Update Bank Details' : 'Add Bank Details'}
            </h2>
            
            <BankDetailsForm
              countryCode={business.country}
              onSubmit={handleSubmit}
              loading={submitting}
              initialData={bankDetails?.fields || {}}
            />
          </div>
        )}

        {/* Existing Bank Details */}
        {bankDetails && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Bank Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(bankDetails.fields).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <span className="text-sm font-medium text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="ml-2 text-sm text-gray-900">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Added: {new Date(bankDetails.createdAt).toLocaleDateString()}</p>
              {bankDetails.verifiedAt && (
                <p>Verified: {new Date(bankDetails.verifiedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

