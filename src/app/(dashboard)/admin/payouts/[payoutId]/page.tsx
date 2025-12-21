'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/Loading';

interface PayoutDetails {
  id: string;
  orderTotal?: number;
  supplierAmount?: number;
  vendorGrossAmount?: number;
  platformFee?: number;
  transactionFee?: number;
  currencyConversionFee?: number;
  finalSupplierAmount?: number;
  finalVendorAmount?: number;
  platformRevenue?: number;
  baseCurrency: string;
  supplierCurrency: string;
  vendorCurrency: string;
  exchangeRateAtPayout?: number;
  status: string;
  payoutMethod: string;
  payoutDate?: string;
  processedAt?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    business?: {
      preferredCurrency: string;
    };
  };
  vendor: {
    id: string;
    name: string;
    email: string;
    business?: {
      preferredCurrency: string;
    };
  };
  order: {
    id: string;
    totalAmount?: number;
    status: string;
    product: {
      id: string;
      name: string;
      image: string;
    };
  };
  statusHistory: Array<{
    id: string;
    status: string;
    reason?: string;
    changedBy: string;
    changedAt: string;
    notes?: string;
  }>;
}

export default function PayoutDetailsPage({ params }: { params: { payoutId: string } }) {
  const [payout, setPayout] = useState<PayoutDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const router = useRouter();

  const hasFetchedPayout = useRef<string>('');

  const fetchPayoutDetails = useCallback(async () => {
    if (hasFetchedPayout.current === params.payoutId) return;
    hasFetchedPayout.current = params.payoutId;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/payouts/${params.payoutId}`);
      if (response.ok) {
        const data = await response.json();
        setPayout(data.payout);
      } else {
        setError('Payout not found');
        hasFetchedPayout.current = ''; // Reset on error
      }
    } catch (error) {
      console.error('Error fetching payout details:', error);
      setError('Failed to load payout details');
      hasFetchedPayout.current = ''; // Reset on error
    } finally {
      setLoading(false);
    }
  }, [params.payoutId]);

  useEffect(() => {
    fetchPayoutDetails();
  }, [fetchPayoutDetails]);

  const handleStatusUpdate = async () => {
    if (!newStatus || !payout) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: actionNotes
        })
      });

      if (response.ok) {
        await fetchPayoutDetails();
        setNewStatus('');
        setActionNotes('');
      }
    } catch (error) {
      console.error('Error updating payout status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVAL_REQUIRED':
        return 'bg-orange-100 text-orange-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'ON_HOLD':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loading message="Loading payout details..." />;
  }

  if (error || !payout) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payout Not Found</h3>
          <p className="text-gray-500 mb-4">{error || 'The payout you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payout Details</h1>
            <p className="text-gray-600">Payout ID: {payout.id}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payout.status)}`}>
              {payout.status}
            </span>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              ← Back to Payouts
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Order Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {payout.order.product.image && (
                  <img
                    src={payout.order.product.image}
                    alt={payout.order.product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{payout.order.product.name}</h3>
                  <p className="text-sm text-gray-600">Order #{payout.order.id.slice(-8)}</p>
                  <p className="text-sm text-gray-600">Total: ${(payout.order?.totalAmount || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-gray-500">Order Status</p>
                  <p className="text-sm text-gray-900">{payout.order.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Order Total</p>
                  <p className="text-sm text-gray-900">${(payout.orderTotal || payout.order?.totalAmount || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-sm text-gray-900">{payout.supplier.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{payout.supplier.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Preferred Currency</p>
                <p className="text-sm text-gray-900">{payout.supplier.business?.preferredCurrency || 'USD'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount (USD)</p>
                <p className="text-lg font-bold text-green-600">${(payout.finalSupplierAmount || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendor Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-sm text-gray-900">{payout.vendor.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{payout.vendor.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Preferred Currency</p>
                <p className="text-sm text-gray-900">{payout.vendor.business?.preferredCurrency || 'USD'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount (USD)</p>
                <p className="text-lg font-bold text-blue-600">${(payout.finalVendorAmount || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Financial Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Order Total</span>
                <span className="text-sm font-medium text-gray-900">${(payout.orderTotal || payout.order?.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Supplier Amount</span>
                <span className="text-sm font-medium text-green-600">${(payout.supplierAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vendor Gross Amount</span>
                <span className="text-sm font-medium text-blue-600">${(payout.vendorGrossAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Platform Fee (5%)</span>
                <span className="text-sm font-medium text-purple-600">-${(payout.platformFee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transaction Fee</span>
                <span className="text-sm font-medium text-gray-600">-${(payout.transactionFee || 0).toFixed(2)}</span>
              </div>
              {payout.currencyConversionFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Currency Conversion Fee</span>
                  <span className="text-sm font-medium text-gray-600">-${(payout.currencyConversionFee || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Final Supplier Amount</span>
                  <span className="text-base font-bold text-green-600">${(payout.finalSupplierAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Final Vendor Amount</span>
                  <span className="text-base font-bold text-blue-600">${(payout.finalVendorAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Platform Revenue</span>
                  <span className="text-base font-bold text-purple-600">${(payout.platformRevenue || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payout Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payout Method</span>
                <span className="text-sm text-gray-900">{payout.payoutMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Base Currency</span>
                <span className="text-sm text-gray-900">{payout.baseCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Supplier Currency</span>
                <span className="text-sm text-gray-900">{payout.supplierCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vendor Currency</span>
                <span className="text-sm text-gray-900">{payout.vendorCurrency}</span>
              </div>
              {payout.exchangeRateAtPayout && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Exchange Rate</span>
                  <span className="text-sm text-gray-900">{(payout.exchangeRateAtPayout || 1).toFixed(4)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Requires Approval</span>
                <span className="text-sm text-gray-900">{payout.requiresApproval ? 'Yes' : 'No'}</span>
              </div>
              {payout.payoutDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payout Date</span>
                  <span className="text-sm text-gray-900">{formatDate(payout.payoutDate)}</span>
                </div>
              )}
              {payout.processedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Processed At</span>
                  <span className="text-sm text-gray-900">{formatDate(payout.processedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes for this status change..."
                />
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={!newStatus || actionLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status History */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
        <div className="space-y-3">
          {payout.statusHistory.map((history, index) => (
            <div key={history.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(history.status).split(' ')[0]}`}></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
                    {history.status}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(history.changedAt)}</span>
                </div>
                {history.reason && (
                  <p className="text-sm text-gray-600 mt-1">Reason: {history.reason}</p>
                )}
                {history.notes && (
                  <p className="text-sm text-gray-500 mt-1">Notes: {history.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
