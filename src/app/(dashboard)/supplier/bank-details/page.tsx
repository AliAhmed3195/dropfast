'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingStatus {
  accountId: string;
  status: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    onboarding_status: string;
    requirements: any;
  };
}

export default function BankDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const hasCheckedStatus = useRef(false);

  const checkAccountStatus = useCallback(async () => {
    if (hasCheckedStatus.current) return;
    hasCheckedStatus.current = true;
    
    try {
      const response = await fetch('/api/stripe/express/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else if (response.status === 404) {
        // No Express account exists yet - redirect to onboarding
        router.replace('/supplier/onboarding');
        return;
      } else {
        setError('Failed to check account status');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setError('Failed to check account status');
      hasCheckedStatus.current = false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAccountStatus();
  }, [checkAccountStatus]);

  const continueOnboarding = async () => {
    setUpdating(true);
    try {
      // Fetch fresh account link for existing account
      const response = await fetch('/api/stripe/express/link', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok && data.accountLink) {
        // Directly redirect without page refresh
        window.location.replace(data.accountLink);
      } else {
        setError(data.error || 'Failed to get onboarding link');
        setUpdating(false);
      }
    } catch (error) {
      console.error('Error getting onboarding link:', error);
      setError('Failed to get onboarding link');
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to Stripe onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Bank Details & Stripe Account
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            Account Status
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium">Account Details Submitted</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                status.status.details_submitted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {status.status.details_submitted ? 'Completed' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium">Charges Enabled</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                status.status.charges_enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {status.status.charges_enabled ? 'Enabled' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium">Payouts Enabled</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                status.status.payouts_enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {status.status.payouts_enabled ? 'Enabled' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium">Account ID</span>
              <span className="text-xs text-gray-600 font-mono">
                {status.accountId}
              </span>
            </div>
          </div>
        </div>

        {status.status.onboarding_status !== 'completed' ? (
          <div>
            <p className="text-gray-600 mb-4">
              Your Stripe Express account setup is in progress. Click below to continue or update your bank details.
            </p>
            <button
              onClick={continueOnboarding}
              disabled={updating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Loading...' : 'Continue/Update Bank Details'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Account Fully Set Up!
            </h3>
            <p className="text-gray-600 mb-4">
              Your Stripe Express account is fully configured and ready to receive payouts.
            </p>
            <button
              onClick={continueOnboarding}
              disabled={updating}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Loading...' : 'Update Bank Details'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}