'use client';

import React from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  business?: {
    stripeAccountStatus?: string;
    stripeVerificationLevel?: string;
    stripePayoutsEnabled?: boolean;
    stripeChargesEnabled?: boolean;
    bankStatus?: string;
    stripeCapabilities?: any;
    stripeRequirements?: any;
    stripeLastUpdated?: string;
  };
}

interface StripeStatusCardProps {
  user: User;
  showDetails?: boolean;
  compact?: boolean;
}

export const StripeStatusCard: React.FC<StripeStatusCardProps> = ({ 
  user, 
  showDetails = false, 
  compact = false 
}) => {
  const stripeAccountStatus = user.business?.stripeAccountStatus;
  const stripePayoutsEnabled = user.business?.stripePayoutsEnabled;
  const bankStatus = user.business?.bankStatus;
  const stripeChargesEnabled = user.business?.stripeChargesEnabled;
  
  // Determine overall status
  const getOverallStatus = () => {
    if (stripeAccountStatus === 'verified' && stripePayoutsEnabled && bankStatus === 'verified') {
      return { status: 'active', label: 'Fully Active', color: 'success' };
    } else if (stripeAccountStatus === 'pending' || bankStatus === 'pending') {
      return { status: 'pending', label: 'Pending', color: 'warning' };
    } else if (stripeAccountStatus === 'restricted') {
      return { status: 'restricted', label: 'Restricted', color: 'warning' };
    } else if (stripeAccountStatus === 'rejected' || bankStatus === 'rejected') {
      return { status: 'rejected', label: 'Rejected', color: 'danger' };
    } else {
      return { status: 'not-started', label: 'Not Started', color: 'secondary' };
    }
  };

  const overallStatus = getOverallStatus();

  const getBadgeClass = (color: string) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (color) {
      case 'success':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'warning':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'danger':
        return `${baseClass} bg-red-100 text-red-800`;
      case 'secondary':
        return `${baseClass} bg-gray-100 text-gray-800`;
      default:
        return `${baseClass} bg-blue-100 text-blue-800`;
    }
  };

  if (compact) {
    return (
      <span className={getBadgeClass(overallStatus.color)}>
        {overallStatus.status === 'active' && '✅ '}
        {overallStatus.status === 'pending' && '⏳ '}
        {overallStatus.status === 'restricted' && '⚠️ '}
        {overallStatus.status === 'rejected' && '❌ '}
        {overallStatus.status === 'not-started' && '❌ '}
        {overallStatus.label}
      </span>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Stripe Connect Status</h4>
        <span className={getBadgeClass(overallStatus.color)}>
          {overallStatus.status === 'active' && '✅ '}
          {overallStatus.status === 'pending' && '⏳ '}
          {overallStatus.status === 'restricted' && '⚠️ '}
          {overallStatus.status === 'rejected' && '❌ '}
          {overallStatus.status === 'not-started' && '❌ '}
          {overallStatus.label}
        </span>
      </div>
      
      {showDetails && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Account Status:</span>
            <span className={getBadgeClass(
              stripeAccountStatus === 'verified' ? 'success' :
              stripeAccountStatus === 'pending' ? 'warning' :
              stripeAccountStatus === 'restricted' ? 'warning' :
              stripeAccountStatus === 'rejected' ? 'danger' : 'secondary'
            )}>
              {stripeAccountStatus || 'Not Started'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Payouts:</span>
            <span className={getBadgeClass(stripePayoutsEnabled ? 'success' : 'warning')}>
              {stripePayoutsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Charges:</span>
            <span className={getBadgeClass(stripeChargesEnabled ? 'success' : 'warning')}>
              {stripeChargesEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Bank Account:</span>
            <span className={getBadgeClass(
              bankStatus === 'verified' ? 'success' :
              bankStatus === 'pending' ? 'warning' :
              bankStatus === 'rejected' ? 'danger' : 'secondary'
            )}>
              {bankStatus || 'Not Added'}
            </span>
          </div>
          
          {user.business?.stripeLastUpdated && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-500">
                {new Date(user.business.stripeLastUpdated).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StripeStatusCard;
