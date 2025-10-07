'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Payout {
  id: string;
  orderTotal: number;
  supplierAmount: number;
  vendorGrossAmount: number;
  platformFee: number;
  finalSupplierAmount: number;
  finalVendorAmount: number;
  platformRevenue: number;
  status: string;
  payoutMethod: string;
  createdAt: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedSupplierAmount?: number;
  lockedVendorAmount?: number;
  lockedExchangeRate?: number;
  supplierCurrency: string;
  vendorCurrency: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    preferredCurrency: string;
    bankDetails?: {
      id: string;
      isVerified: boolean;
      isActive: boolean;
    };
  };
  vendor: {
    id: string;
    name: string;
    email: string;
    preferredCurrency: string;
    bankDetails?: {
      id: string;
      isVerified: boolean;
      isActive: boolean;
    };
  };
  order: {
    id: string;
    totalAmount: number;
    status: string;
  };
}

interface PayoutSummary {
  totalPayouts: number;
  totalSupplierAmount: number;
  totalVendorAmount: number;
  totalPlatformRevenue: number;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    supplierId: '',
    vendorId: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [processingScheduled, setProcessingScheduled] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPayouts();
  }, [filters, pagination.page]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(`/api/admin/payouts?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts);
        setSummary(data.summary);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'APPROVAL_REQUIRED':
        return '🔍';
      case 'PROCESSING':
        return '⚙️';
      case 'COMPLETED':
        return '✅';
      case 'FAILED':
        return '❌';
      case 'CANCELLED':
        return '🚫';
      case 'ON_HOLD':
        return '⏸️';
      default:
        return '❓';
    }
  };

  const getBankDetailsStatus = (bankDetails: any) => {
    if (!bankDetails) {
      return { status: 'Missing', color: 'text-red-600', icon: '❌' };
    }
    
    if (!bankDetails.isActive) {
      return { status: 'Inactive', color: 'text-red-600', icon: '❌' };
    }
    
    if (bankDetails.isVerified) {
      return { status: 'Verified', color: 'text-green-600', icon: '✅' };
    }
    
    return { status: 'Pending', color: 'text-yellow-600', icon: '⏳' };
  };

  const formatLockedAmount = (payout: Payout, type: 'supplier' | 'vendor') => {
    if (!payout.isLocked) {
      return {
        usd: type === 'supplier' ? payout.finalSupplierAmount : payout.finalVendorAmount,
        local: type === 'supplier' ? payout.finalSupplierAmount : payout.finalVendorAmount,
        currency: type === 'supplier' ? payout.supplierCurrency : payout.vendorCurrency,
        isLocked: false
      };
    }

    const lockedAmount = type === 'supplier' 
      ? payout.lockedSupplierAmount 
      : payout.lockedVendorAmount;
    
    const currency = type === 'supplier' 
      ? payout.supplierCurrency 
      : payout.vendorCurrency;

    return {
      usd: type === 'supplier' ? payout.finalSupplierAmount : payout.finalVendorAmount,
      local: lockedAmount || (type === 'supplier' ? payout.finalSupplierAmount : payout.finalVendorAmount),
      currency,
      isLocked: true,
      lockedAt: payout.lockedAt
    };
  };

  const handlePayoutAction = async (payoutId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        fetchPayouts();
      }
    } catch (error) {
      console.error('Error updating payout:', error);
    }
  };

  const handleBulkAction = async () => {
    if (selectedPayouts.length === 0 || !bulkAction) return;

    try {
      const response = await fetch('/api/admin/payouts/bulk-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutIds: selectedPayouts,
          action: bulkAction,
          notes: `Bulk ${bulkAction.toLowerCase()} by admin`
        })
      });

      if (response.ok) {
        setSelectedPayouts([]);
        setBulkAction('');
        setShowBulkModal(false);
        fetchPayouts();
      }
    } catch (error) {
      console.error('Error processing bulk action:', error);
    }
  };

  const handleScheduledProcessing = async () => {
    try {
      setProcessingScheduled(true);
      const response = await fetch('/api/admin/payouts/process-scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Scheduled processing completed:', data);
        fetchPayouts(); // Refresh the list
        alert(`Processed ${data.results.length} payouts successfully!`);
      } else {
        alert('Error processing scheduled payouts');
      }
    } catch (error) {
      console.error('Error in scheduled processing:', error);
      alert('Error processing scheduled payouts');
    } finally {
      setProcessingScheduled(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedPayouts.length === payouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(payouts.map(p => p.id));
    }
  };

  const handleSelectPayout = (payoutId: string) => {
    setSelectedPayouts(prev => 
      prev.includes(payoutId) 
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
            <p className="text-gray-600">Manage supplier and vendor payouts</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleScheduledProcessing}
              disabled={processingScheduled}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingScheduled ? 'Processing...' : 'Process Scheduled'}
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              disabled={selectedPayouts.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bulk Actions ({selectedPayouts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Payouts</h3>
            <p className="text-2xl font-bold text-gray-900">{summary.totalPayouts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Supplier Amount</h3>
            <p className="text-2xl font-bold text-green-600">${summary.totalSupplierAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Vendor Amount</h3>
            <p className="text-2xl font-bold text-blue-600">${summary.totalVendorAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Platform Revenue</h3>
            <p className="text-2xl font-bold text-purple-600">${summary.totalPlatformRevenue.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVAL_REQUIRED">Approval Required</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search payouts..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                status: 'all',
                supplierId: '',
                vendorId: '',
                dateFrom: '',
                dateTo: '',
                search: ''
              })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setShowBulkModal(true)}
              disabled={selectedPayouts.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Bulk Actions ({selectedPayouts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPayouts.length === payouts.length && payouts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payout ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPayouts.includes(payout.id)}
                      onChange={() => handleSelectPayout(payout.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="font-mono text-xs">{payout.id.slice(-8)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">Order #{payout.order.id.slice(-8)}</div>
                      <div className="text-gray-500">${payout.order.totalAmount.toFixed(2)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{payout.supplier.name}</div>
                      <div className="text-gray-500">{payout.supplier.email}</div>
                      <div className="text-xs text-gray-400">{payout.supplier.preferredCurrency}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{payout.vendor.name}</div>
                      <div className="text-gray-500">{payout.vendor.email}</div>
                      <div className="text-xs text-gray-400">{payout.vendor.preferredCurrency}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-xs">Supplier:</span>
                        {(() => {
                          const supplierBankStatus = getBankDetailsStatus(payout.supplier.bankDetails);
                          return (
                            <span className={`text-xs ${supplierBankStatus.color}`}>
                              {supplierBankStatus.icon} {supplierBankStatus.status}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-xs">Vendor:</span>
                        {(() => {
                          const vendorBankStatus = getBankDetailsStatus(payout.vendor.bankDetails);
                          return (
                            <span className={`text-xs ${vendorBankStatus.color}`}>
                              {vendorBankStatus.icon} {vendorBankStatus.status}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      {(() => {
                        const supplierAmount = formatLockedAmount(payout, 'supplier');
                        const vendorAmount = formatLockedAmount(payout, 'vendor');
                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Supplier:</span>
                              <div className="text-right">
                                <div className="font-medium text-green-600">
                                  {supplierAmount.local.toFixed(2)} {supplierAmount.currency}
                                </div>
                                {supplierAmount.isLocked && (
                                  <div className="text-xs text-gray-400">
                                    (${supplierAmount.usd.toFixed(2)} USD)
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Vendor:</span>
                              <div className="text-right">
                                <div className="font-medium text-blue-600">
                                  {vendorAmount.local.toFixed(2)} {vendorAmount.currency}
                                </div>
                                {vendorAmount.isLocked && (
                                  <div className="text-xs text-gray-400">
                                    (${vendorAmount.usd.toFixed(2)} USD)
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Platform:</span>
                              <span className="font-medium text-purple-600">${payout.platformRevenue.toFixed(2)}</span>
                            </div>
                            {payout.isLocked && (
                              <div className="text-xs text-gray-400 mt-1">
                                🔒 Locked at delivery
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                      {getStatusIcon(payout.status)} {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payout.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => router.push(`/admin/payouts/${payout.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {payout.status === 'PENDING' && (
                      <button
                        onClick={() => handlePayoutAction(payout.id, 'PROCESSING')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Process
                      </button>
                    )}
                    {payout.status === 'PROCESSING' && (
                      <button
                        onClick={() => handlePayoutAction(payout.id, 'COMPLETED')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100"
            >
              Previous
            </button>
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPagination({ ...pagination, page: i + 1 })}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  pagination.page === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Bulk Action</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Action</option>
                  <option value="PROCESSING">Mark as Processing</option>
                  <option value="COMPLETED">Mark as Completed</option>
                  <option value="ON_HOLD">Put on Hold</option>
                  <option value="CANCELLED">Cancel</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                This will affect {selectedPayouts.length} payout(s).
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
