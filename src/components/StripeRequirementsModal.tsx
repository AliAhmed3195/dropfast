'use client';

import React, { useState } from 'react';

interface Requirements {
  currentlyDue: string[];
  pastDue: string[];
  eventuallyDue: string[];
  disabledReason?: string;
  accountStatus: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface StripeRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  requirements: Requirements | null;
  loading: boolean;
  onResendLink: (userId: string, linkType: string) => Promise<void>;
}

export const StripeRequirementsModal: React.FC<StripeRequirementsModalProps> = ({
  isOpen,
  onClose,
  user,
  requirements,
  loading,
  onResendLink
}) => {
  const [resending, setResending] = useState(false);
  const [linkType, setLinkType] = useState<'express' | 'connect'>('express');

  if (!isOpen) return null;

  const handleResendLink = async () => {
    if (!user) return;
    
    setResending(true);
    try {
      await onResendLink(user.id, linkType);
    } catch (error) {
      console.error('Error resending link:', error);
    } finally {
      setResending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'restricted':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return '✅';
      case 'pending':
        return '⏳';
      case 'restricted':
        return '⚠️';
      default:
        return '❓';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Stripe Account Requirements
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Checking requirements...</span>
            </div>
          ) : user && requirements ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Account Status</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getStatusIcon(requirements.accountStatus)}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(requirements.accountStatus)}`}>
                    {requirements.accountStatus.charAt(0).toUpperCase() + requirements.accountStatus.slice(1)}
                  </span>
                </div>
                {requirements.disabledReason && (
                  <p className="text-sm text-red-600 mt-2">
                    <strong>Disabled Reason:</strong> {requirements.disabledReason}
                  </p>
                )}
              </div>

              {/* Missing Requirements */}
              {(requirements.currentlyDue.length > 0 || requirements.pastDue.length > 0) && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-3 flex items-center">
                    <span className="mr-2">❌</span>
                    Missing Information Required
                  </h3>
                  
                  {requirements.pastDue.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Past Due (Urgent):</h4>
                      <ul className="space-y-1">
                        {requirements.pastDue.map((field, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-center">
                            <span className="mr-2">🔴</span>
                            {field}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {requirements.currentlyDue.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-2">Currently Due:</h4>
                      <ul className="space-y-1">
                        {requirements.currentlyDue.map((field, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-center">
                            <span className="mr-2">🟡</span>
                            {field}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Eventually Due */}
              {requirements.eventuallyDue.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-3 flex items-center">
                    <span className="mr-2">⏰</span>
                    Eventually Required
                  </h3>
                  <ul className="space-y-1">
                    {requirements.eventuallyDue.map((field, index) => (
                      <li key={index} className="text-sm text-yellow-700 flex items-center">
                        <span className="mr-2">🔵</span>
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* All Requirements Met */}
              {requirements.currentlyDue.length === 0 && requirements.pastDue.length === 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2 flex items-center">
                    <span className="mr-2">✅</span>
                    All Requirements Met
                  </h3>
                  <p className="text-sm text-green-700">
                    This account has completed all required information and is ready for processing payments.
                  </p>
                </div>
              )}

              {/* Resend Link Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">Resend Onboarding Link</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Type:
                    </label>
                    <select
                      value={linkType}
                      onChange={(e) => setLinkType(e.target.value as 'express' | 'connect')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="express">Express Account</option>
                      <option value="connect">Connect Account</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleResendLink}
                    disabled={resending}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {resending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Resend Onboarding Link
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-blue-600">
                    This will generate a new onboarding link and send it to the user's email address.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No requirements data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeRequirementsModal;
