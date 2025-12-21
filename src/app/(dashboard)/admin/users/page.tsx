'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import StripeStatusCard from '@/components/StripeStatusCard';
import StripeRequirementsModal from '@/components/StripeRequirementsModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER' | 'CUSTOMER';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  businessId?: string;
  business?: {
    id: string;
    businessName: string;
    businessType?: string;
    registrationNumber?: string;
    vatGstNumber?: string;
    preferredCurrency: string;
    type: string;
    country?: string;
    addressStreet?: string;
    addressCity?: string;
    addressState?: string;
    addressCountry?: string;
    postalCode?: string;
    stripeAccount?: {
      expressAccountId?: string;
      stripeAccountId?: string;
      stripeAccountStatus?: string;
      stripePayoutsEnabled?: boolean;
      bankStatus?: string;
      stripeChargesEnabled?: boolean;
    };
  };
  createdAt: string;
}

interface BusinessFormData {
  businessName?: string;
  businessType?: 'INDIVIDUAL' | 'COMPANY';
  registrationNumber?: string;
  vatGstNumber?: string;
  country?: string;
  preferredCurrency?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [businessFormData, setBusinessFormData] = useState<BusinessFormData>({});
  const [addBusiness, setAddBusiness] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expressAccountData, setExpressAccountData] = useState<any>(null);
  const [expressLoading, setExpressLoading] = useState(false);
  
  // Requirements modal state
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [requirementsData, setRequirementsData] = useState<any>(null);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [selectedUserForRequirements, setSelectedUserForRequirements] = useState<User | null>(null);
  
  const router = useRouter();
  const hasFetchedUsers = useRef(false);

  const fetchUsers = useCallback(async () => {
    if (hasFetchedUsers.current) return;
    hasFetchedUsers.current = true;
    
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      hasFetchedUsers.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getStripeStatusBadge = (user: User) => {
    const stripeAccountStatus = user.business?.stripeAccount?.stripeAccountStatus;
    const stripePayoutsEnabled = user.business?.stripeAccount?.stripePayoutsEnabled;
    const bankStatus = user.business?.stripeAccount?.bankStatus;
    const expressAccountId = user.business?.stripeAccount?.expressAccountId;
    const stripeAccountId = user.business?.stripeAccount?.stripeAccountId;
    
    // Check if user has any Stripe account
    const hasStripeAccount = expressAccountId || stripeAccountId;
    
    // Determine overall status
    if (stripeAccountStatus === 'verified' && stripePayoutsEnabled && bankStatus === 'verified') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Fully Active
        </span>
      );
    } else if (stripeAccountStatus === 'verified' && stripePayoutsEnabled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Active
        </span>
      );
    } else if (stripeAccountStatus === 'verified') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Verified (Setup Pending)
        </span>
      );
    } else if (stripeAccountStatus === 'pending' || bankStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Pending
        </span>
      );
    } else if (stripeAccountStatus === 'restricted') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          ⚠️ Restricted
        </span>
      );
    } else if (stripeAccountStatus === 'rejected' || bankStatus === 'rejected') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ❌ Rejected
        </span>
      );
    } else if (hasStripeAccount && !stripeAccountStatus) {
      // User has Stripe account but no status yet (onboarding in progress)
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          🔄 Onboarding
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ❌ Not Started
        </span>
      );
    }
  };

  const createExpressAccount = async (userId: string) => {
    try {
      setExpressLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/express-account`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        const onboardingLink = data.data.onboardingLink;
        const userEmail = data.data.userEmail;
        const userName = data.data.userName;
        const message = data.message;
        
        // Ask admin if they want to send email
        const sendEmail = confirm(
          `${message}\n\nUser: ${userName} (${userEmail})\n\nOnboarding Link: ${onboardingLink}\n\nDo you want to send this link via email to the user?`
        );
        
        if (sendEmail) {
          await sendOnboardingEmail(userId, onboardingLink);
        } else {
          alert(`${message}\n\nShare this link manually with ${userName}:\n\n${onboardingLink}`);
        }
        
        fetchUsers(); // Refresh users list
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating Express account:', error);
      alert('Failed to create Express account');
    } finally {
      setExpressLoading(false);
    }
  };

  const generateOnboardingLink = async (userId: string) => {
    try {
      setExpressLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/express-link`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        const onboardingLink = data.data.onboardingLink;
        
        // Ask admin if they want to send email
        const sendEmail = confirm(
          `New onboarding link generated!\n\nLink: ${onboardingLink}\n\nDo you want to send this link via email to the user?`
        );
        
        if (sendEmail) {
          await sendOnboardingEmail(userId, onboardingLink);
        } else {
          alert(`Link copied to clipboard!\n\nShare this link manually with the user:\n${onboardingLink}`);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating onboarding link:', error);
      alert('Failed to generate onboarding link');
    } finally {
      setExpressLoading(false);
    }
  };

  const sendOnboardingEmail = async (userId: string, onboardingLink: string) => {
    try {
      setExpressLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/send-onboarding-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ onboardingLink }),
      });
      const data = await response.json();

      if (response.ok) {
        alert(`✅ Email sent successfully to ${data.data.userEmail}!\n\nUser will receive the onboarding link via email.`);
      } else {
        alert(`❌ Failed to send email: ${data.error}\n\nYou can still share the link manually.`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Failed to send email. You can still share the link manually.');
    } finally {
      setExpressLoading(false);
    }
  };

  const checkRequirements = async (userId: string) => {
    try {
      setRequirementsLoading(true);
      setSelectedUserForRequirements(users.find(u => u.id === userId) || null);
      
      const response = await fetch(`/api/admin/users/${userId}/stripe-requirements`);
      const data = await response.json();
      
      if (response.ok) {
        setRequirementsData(data.requirements);
        setShowRequirementsModal(true);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error checking requirements:', error);
      alert('Failed to check requirements');
    } finally {
      setRequirementsLoading(false);
    }
  };

  const resendOnboardingLink = async (userId: string, linkType: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/resend-onboarding-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkType })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Onboarding link sent successfully to ${data.data.userEmail}`);
        setShowRequirementsModal(false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error resending onboarding link:', error);
      alert('Failed to resend onboarding link');
    }
  };

  const checkExpressStatus = async (userId: string) => {
    try {
      setExpressLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/express-account`);
      const data = await response.json();
      
      if (response.ok) {
        setExpressAccountData(data.data);
        setShowDetails(true);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error checking Express status:', error);
      alert('Failed to check Express account status');
    } finally {
      setExpressLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: any = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status,
        isActive: editingUser.status === 'ACTIVE',
      };

      // Add business data if it's a vendor/supplier and addBusiness is checked
      if ((editingUser.role === 'VENDOR_USER' || editingUser.role === 'SUPPLIER_USER') && addBusiness) {
        updateData.addBusiness = true;
        updateData.businessName = businessFormData.businessName;
        updateData.businessType = businessFormData.businessType;
        updateData.registrationNumber = businessFormData.registrationNumber;
        updateData.vatGstNumber = businessFormData.vatGstNumber;
        updateData.country = businessFormData.country;
        updateData.preferredCurrency = businessFormData.preferredCurrency;
        updateData.addressStreet = businessFormData.addressStreet;
        updateData.addressCity = businessFormData.addressCity;
        updateData.addressState = businessFormData.addressState;
        updateData.addressCountry = businessFormData.addressCountry;
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setEditingUser(null);
        setBusinessFormData({});
        setAddBusiness(false);
        hasFetchedUsers.current = false;
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string | boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: (currentStatus === 'ACTIVE' || currentStatus === true) ? 'SUSPENDED' : 'ACTIVE' }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => router.push('/admin/users/add')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add User
        </button>
      </div>


      {/* Edit User Form */}
      {editingUser && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Edit User</h2>
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setBusinessFormData({});
                setAddBusiness(false);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Users List</span>
            </button>
          </div>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'ADMIN' | 'SUPPLIER_USER' | 'VENDOR_USER' | 'CUSTOMER' })}
                >
                  <option value="SUPPLIER_USER">Supplier</option>
                  <option value="VENDOR_USER">Vendor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={editingUser.status === 'ACTIVE' ? 'active' : 'inactive'}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value === 'active' ? 'ACTIVE' : 'SUSPENDED' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            {/* Business Information - Only for VENDOR_USER and SUPPLIER_USER */}
            {(editingUser.role === 'VENDOR_USER' || editingUser.role === 'SUPPLIER_USER') && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addBusiness}
                      onChange={(e) => {
                        setAddBusiness(e.target.checked);
                        if (!e.target.checked) {
                          setBusinessFormData({});
                        }
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Add/Update Company Details</span>
                  </label>
                </div>
                
                {addBusiness && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Name {addBusiness && '*'}
                        </label>
                        <input
                          type="text"
                          required={addBusiness}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={businessFormData.businessName || ''}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, businessName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Type {addBusiness && '*'}
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={businessFormData.businessType || 'INDIVIDUAL'}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, businessType: e.target.value as 'INDIVIDUAL' | 'COMPANY' })}
                        >
                          <option value="INDIVIDUAL">Individual</option>
                          <option value="COMPANY">Company</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={businessFormData.registrationNumber || ''}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, registrationNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          VAT/GST Number
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={businessFormData.vatGstNumber || ''}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, vatGstNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country {addBusiness && '*'}
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={businessFormData.country || 'US'}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, country: e.target.value })}
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="PK">Pakistan</option>
                          <option value="IN">India</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Currency {addBusiness && '*'}
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={businessFormData.preferredCurrency || 'USD'}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, preferredCurrency: e.target.value })}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="PKR">PKR</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Business Address</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address {addBusiness && '*'}
                          </label>
                          <input
                            type="text"
                            required={addBusiness}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={businessFormData.addressStreet || ''}
                            onChange={(e) => setBusinessFormData({ ...businessFormData, addressStreet: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City {addBusiness && '*'}
                            </label>
                            <input
                              type="text"
                              required={addBusiness}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={businessFormData.addressCity || ''}
                              onChange={(e) => setBusinessFormData({ ...businessFormData, addressCity: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State/Province {addBusiness && '*'}
                            </label>
                            <input
                              type="text"
                              required={addBusiness}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={businessFormData.addressState || ''}
                              onChange={(e) => setBusinessFormData({ ...businessFormData, addressState: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country {addBusiness && '*'}
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              value={businessFormData.addressCountry || businessFormData.country || 'US'}
                              onChange={(e) => setBusinessFormData({ ...businessFormData, addressCountry: e.target.value })}
                            >
                              <option value="US">United States</option>
                              <option value="CA">Canada</option>
                              <option value="GB">United Kingdom</option>
                              <option value="PK">Pakistan</option>
                              <option value="IN">India</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Update User
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setBusinessFormData({});
                  setAddBusiness(false);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Users Table - Only show when not editing */}
      {!editingUser && (
        <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stripe Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'SUPPLIER_USER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{user.business?.preferredCurrency || 'USD'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStripeStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          // Initialize business form data if user has business
                          if (user.business) {
                            setBusinessFormData({
                              businessName: user.business.businessName || '',
                              businessType: (user.business.businessType as 'INDIVIDUAL' | 'COMPANY') || 'INDIVIDUAL',
                              registrationNumber: user.business.registrationNumber || '',
                              vatGstNumber: user.business.vatGstNumber || '',
                              country: user.business.country || 'US',
                              preferredCurrency: user.business.preferredCurrency || 'USD',
                              addressStreet: user.business.addressStreet || '',
                              addressCity: user.business.addressCity || '',
                              addressState: user.business.addressState || '',
                              addressCountry: user.business.addressCountry || user.business.country || 'US',
                            });
                            setAddBusiness(true);
                          } else {
                            setBusinessFormData({});
                            setAddBusiness(false);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                        title="Edit User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        className={`p-1 rounded-full hover:bg-gray-50 ${
                          user.status === 'ACTIVE'
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'ACTIVE' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                        title="Delete User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      {/* Express Account Management for VENDOR_USER and SUPPLIER_USER */}
                      {(user.role === 'VENDOR_USER' || user.role === 'SUPPLIER_USER') && (
                        <>
                          {!user.business?.stripeAccount?.expressAccountId ? (
                            <button
                              onClick={() => createExpressAccount(user.id)}
                              disabled={expressLoading}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50"
                              title="Create Express Account"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => generateOnboardingLink(user.id)}
                                disabled={expressLoading}
                                className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                                title="Generate New Onboarding Link"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                              </button>
                              <button
                                onClick={() => checkExpressStatus(user.id)}
                                disabled={expressLoading}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded-full hover:bg-orange-50"
                                title="Check Express Status"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={async () => {
                                  const response = await fetch(`/api/admin/users/${user.id}/express-link`, { method: 'POST' });
                                  const data = await response.json();
                                  if (response.ok) {
                                    await sendOnboardingEmail(user.id, data.data.onboardingLink);
                                  } else {
                                    alert(`Error: ${data.error}`);
                                  }
                                }}
                                disabled={expressLoading}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                title="Send Onboarding Email"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </button>
                              
                              {/* Check Requirements Button */}
                              <button
                                onClick={() => checkRequirements(user.id)}
                                disabled={requirementsLoading}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                title="Check Stripe Requirements"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDetails(true);
                        setExpressAccountData(null); // Clear express account data to show user details
                      }}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                      title="View Details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {!editingUser && users.length === 0 && (
        <Card>
          <p className="text-center text-gray-500">No users found.</p>
        </Card>
      )}

      {/* User Details Modal */}
      {showDetails && selectedUser && !expressAccountData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  User Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.role === 'VENDOR_USER' ? 'Vendor' : 
                         selectedUser.role === 'SUPPLIER_USER' ? 'Supplier' : 
                         selectedUser.role === 'ADMIN' ? 'Admin' : 'Customer'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <p className={`mt-1 text-sm font-medium ${
                        selectedUser.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedUser.status}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created At</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                {selectedUser.business && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Business Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Business Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.business.businessName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Business Type</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.business.businessType || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.business.registrationNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">VAT/GST Number</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.business.vatGstNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.business.country || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Preferred Currency</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.business.preferredCurrency || 'USD'}</p>
                      </div>
                      {selectedUser.business.addressStreet && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.business.addressStreet}
                            {selectedUser.business.addressCity && `, ${selectedUser.business.addressCity}`}
                            {selectedUser.business.addressState && `, ${selectedUser.business.addressState}`}
                            {selectedUser.business.addressCountry && `, ${selectedUser.business.addressCountry}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stripe Account Information */}
                {selectedUser.business?.stripeAccount && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Stripe Account</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Express Account ID</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">
                          {selectedUser.business.stripeAccount.expressAccountId || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Stripe Account ID</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">
                          {selectedUser.business.stripeAccount.stripeAccountId || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Status</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.business.stripeAccount.stripeAccountStatus || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Status</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.business.stripeAccount.bankStatus || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Charges Enabled</label>
                        <p className={`mt-1 text-sm font-medium ${
                          selectedUser.business.stripeAccount.stripeChargesEnabled ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedUser.business.stripeAccount.stripeChargesEnabled ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payouts Enabled</label>
                        <p className={`mt-1 text-sm font-medium ${
                          selectedUser.business.stripeAccount.stripePayoutsEnabled ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedUser.business.stripeAccount.stripePayoutsEnabled ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedUser.business && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <p className="text-sm text-gray-600">No business information available for this user.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedUser(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Express Account Details Modal */}
      {showDetails && expressAccountData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Express Account Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setExpressAccountData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Name</label>
                    <p className="mt-1 text-sm text-gray-900">{expressAccountData.userName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{expressAccountData.userEmail}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <p className="mt-1 text-sm text-gray-900">{expressAccountData.businessCountry}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{expressAccountData.accountId}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Onboarding Status</label>
                  <p className={`mt-1 text-sm font-medium ${
                    expressAccountData.isOnboardingComplete 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {expressAccountData.isOnboardingComplete ? 'Completed' : 'Pending'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Charges Enabled</label>
                    <p className={`mt-1 text-sm font-medium ${
                      expressAccountData.stripeStatus.charges_enabled 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {expressAccountData.stripeStatus.charges_enabled ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payouts Enabled</label>
                    <p className={`mt-1 text-sm font-medium ${
                      expressAccountData.stripeStatus.payouts_enabled 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {expressAccountData.stripeStatus.payouts_enabled ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Details Submitted</label>
                    <p className={`mt-1 text-sm font-medium ${
                      expressAccountData.stripeStatus.details_submitted 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {expressAccountData.stripeStatus.details_submitted ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {expressAccountData.stripeStatus.requirements && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requirements</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {Object.entries(expressAccountData.stripeStatus.requirements).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setExpressAccountData(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirements Modal */}
      <StripeRequirementsModal
        isOpen={showRequirementsModal}
        onClose={() => {
          setShowRequirementsModal(false);
          setRequirementsData(null);
          setSelectedUserForRequirements(null);
        }}
        user={selectedUserForRequirements}
        requirements={requirementsData}
        loading={requirementsLoading}
        onResendLink={resendOnboardingLink}
      />
    </div>
  );
}
