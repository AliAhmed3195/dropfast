'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'VENDOR_USER' | 'SUPPLIER_USER' | 'CUSTOMER';
  phone?: string;
  dob?: string;
  
  // Business fields (for VENDOR_USER and SUPPLIER_USER)
  businessName?: string;
  businessType?: 'INDIVIDUAL' | 'COMPANY';
  registrationNumber?: string;
  vatGstNumber?: string;
  country?: string;
  preferredCurrency?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
}

export default function AddUserPage() {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    phone: '',
    dob: '',
    businessName: '',
    businessType: 'INDIVIDUAL',
    registrationNumber: '',
    vatGstNumber: '',
    country: 'US',
    preferredCurrency: 'USD',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: 'US'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Redirect back to users list
        router.push('/admin/users');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyOptions = (role: string) => {
    switch (role) {
      case 'SUPPLIER_USER':
        return [
          { value: 'USD', label: 'USD - US Dollar' },
          { value: 'EUR', label: 'EUR - Euro' },
          { value: 'GBP', label: 'GBP - British Pound' },
          { value: 'PKR', label: 'PKR - Pakistani Rupee' },
          { value: 'CAD', label: 'CAD - Canadian Dollar' },
          { value: 'AUD', label: 'AUD - Australian Dollar' }
        ];
      case 'VENDOR_USER':
        return [
          { value: 'USD', label: 'USD - US Dollar' },
          { value: 'EUR', label: 'EUR - Euro' },
          { value: 'GBP', label: 'GBP - British Pound' },
          { value: 'PKR', label: 'PKR - Pakistani Rupee' },
          { value: 'CAD', label: 'CAD - Canadian Dollar' },
          { value: 'AUD', label: 'AUD - Australian Dollar' }
        ];
      default:
        return [
          { value: 'USD', label: 'USD - US Dollar' }
        ];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
              >
                ← Back to Users
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
              <p className="text-gray-600 mt-2">Create a new user account</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="VENDOR_USER">Vendor User</option>
                  <option value="SUPPLIER_USER">Supplier User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {/* Business Information - Only for VENDOR_USER and SUPPLIER_USER */}
            {(formData.role === 'VENDOR_USER' || formData.role === 'SUPPLIER_USER') && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                        Business/Company Name *
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                        Business Type *
                      </label>
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="INDIVIDUAL">Individual</option>
                        <option value="COMPANY">Company</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        id="registrationNumber"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="vatGstNumber" className="block text-sm font-medium text-gray-700">
                        VAT/GST Number
                      </label>
                      <input
                        type="text"
                        id="vatGstNumber"
                        name="vatGstNumber"
                        value={formData.vatGstNumber}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Country *
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IT">Italy</option>
                        <option value="ES">Spain</option>
                        <option value="AU">Australia</option>
                        <option value="JP">Japan</option>
                        <option value="PK">Pakistan</option>
                        <option value="IN">India</option>
                        <option value="AE">UAE</option>
                        <option value="SA">Saudi Arabia</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="preferredCurrency" className="block text-sm font-medium text-gray-700">
                        Preferred Currency *
                      </label>
                      <select
                        id="preferredCurrency"
                        name="preferredCurrency"
                        value={formData.preferredCurrency}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {getCurrencyOptions(formData.role).map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Business Address</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="addressStreet" className="block text-sm font-medium text-gray-700">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          id="addressStreet"
                          name="addressStreet"
                          value={formData.addressStreet}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="addressCity" className="block text-sm font-medium text-gray-700">
                            City *
                          </label>
                          <input
                            type="text"
                            id="addressCity"
                            name="addressCity"
                            value={formData.addressCity}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label htmlFor="addressState" className="block text-sm font-medium text-gray-700">
                            State/Province *
                          </label>
                          <input
                            type="text"
                            id="addressState"
                            name="addressState"
                            value={formData.addressState}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label htmlFor="addressZip" className="block text-sm font-medium text-gray-700">
                            ZIP/Postal Code *
                          </label>
                          <input
                            type="text"
                            id="addressZip"
                            name="addressZip"
                            value={formData.addressZip}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="addressCountry" className="block text-sm font-medium text-gray-700">
                          Country *
                        </label>
                        <select
                          id="addressCountry"
                          name="addressCountry"
                          value={formData.addressCountry}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="IT">Italy</option>
                          <option value="ES">Spain</option>
                          <option value="AU">Australia</option>
                          <option value="JP">Japan</option>
                          <option value="PK">Pakistan</option>
                          <option value="IN">India</option>
                          <option value="AE">UAE</option>
                          <option value="SA">Saudi Arabia</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Optional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}