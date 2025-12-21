'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import KycForm from '@/components/forms/KycForm';

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
  addressCountry?: string;
  
  // KYC fields (for VENDOR_USER and SUPPLIER_USER)
  kycDetails?: {
    countryCode: string;
    accountType: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dobDay: number;
    dobMonth: number;
    dobYear: number;
    nationalId: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    businessName?: string;
    businessTaxId?: string;
  };
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
    addressCountry: 'US'
  });
  const [addBusiness, setAddBusiness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycData, setKycData] = useState<any>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Reset currency to USD when role changes to supplier or vendor
    if (name === 'role' && (value === 'SUPPLIER_USER' || value === 'VENDOR_USER')) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        preferredCurrency: 'USD'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBusinessToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddBusiness(e.target.checked);
    // Reset business fields if unchecked
    if (!e.target.checked) {
      setFormData(prev => ({
        ...prev,
        businessName: '',
        businessType: 'INDIVIDUAL',
        registrationNumber: '',
        vatGstNumber: '',
        country: 'US',
        preferredCurrency: 'USD',
        addressStreet: '',
        addressCity: '',
        addressState: '',
        addressCountry: 'US'
      }));
    }
  };

  const handleKycSubmit = (kycFormData: any) => {
    setKycData(kycFormData);
    setFormData(prev => ({
      ...prev,
      kycDetails: kycFormData
    }));
    setShowKycModal(false);
  };

  const handleKycCancel = () => {
    setShowKycModal(false);
    setKycData(null);
  };

  const shouldShowKycButton = () => {
    return (formData.role === 'VENDOR_USER' || formData.role === 'SUPPLIER_USER') && 
           formData.businessName && 
           formData.country;
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
        body: JSON.stringify({
          ...formData,
          addBusiness: addBusiness && (formData.role === 'VENDOR_USER' || formData.role === 'SUPPLIER_USER')
        }),
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
        // Supplier always uses USD in database, but can select local currency for UI reference
        return [
          { value: 'USD', label: 'USD - US Dollar (Default)' },
          { value: 'EUR', label: 'EUR - Euro' },
          { value: 'GBP', label: 'GBP - British Pound' },
          { value: 'PKR', label: 'PKR - Pakistani Rupee' },
          { value: 'CAD', label: 'CAD - Canadian Dollar' },
          { value: 'AUD', label: 'AUD - Australian Dollar' },
          { value: 'JPY', label: 'JPY - Japanese Yen' },
          { value: 'INR', label: 'INR - Indian Rupee' },
          { value: 'AED', label: 'AED - UAE Dirham' },
          { value: 'SAR', label: 'SAR - Saudi Riyal' },
          { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
          { value: 'CHF', label: 'CHF - Swiss Franc' },
          { value: 'SEK', label: 'SEK - Swedish Krona' },
          { value: 'NOK', label: 'NOK - Norwegian Krone' },
          { value: 'DKK', label: 'DKK - Danish Krone' },
          { value: 'PLN', label: 'PLN - Polish Zloty' },
          { value: 'CZK', label: 'CZK - Czech Koruna' },
          { value: 'HUF', label: 'HUF - Hungarian Forint' },
          { value: 'RON', label: 'RON - Romanian Leu' },
          { value: 'BGN', label: 'BGN - Bulgarian Lev' },
          { value: 'HRK', label: 'HRK - Croatian Kuna' },
          { value: 'RSD', label: 'RSD - Serbian Dinar' },
          { value: 'BAM', label: 'BAM - Bosnia-Herzegovina Mark' },
          { value: 'MKD', label: 'MKD - Macedonian Denar' },
          { value: 'ALL', label: 'ALL - Albanian Lek' },
          { value: 'MNT', label: 'MNT - Mongolian Tugrik' },
          { value: 'KZT', label: 'KZT - Kazakhstani Tenge' },
          { value: 'UZS', label: 'UZS - Uzbekistani Som' },
          { value: 'KGS', label: 'KGS - Kyrgyzstani Som' },
          { value: 'TJS', label: 'TJS - Tajikistani Somoni' },
          { value: 'TMT', label: 'TMT - Turkmenistani Manat' },
          { value: 'AFN', label: 'AFN - Afghan Afghani' },
          { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
          { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
          { value: 'NPR', label: 'NPR - Nepalese Rupee' },
          { value: 'BTN', label: 'BTN - Bhutanese Ngultrum' },
          { value: 'MVR', label: 'MVR - Maldivian Rufiyaa' },
          { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
          { value: 'THB', label: 'THB - Thai Baht' },
          { value: 'VND', label: 'VND - Vietnamese Dong' },
          { value: 'PHP', label: 'PHP - Philippine Peso' },
          { value: 'SGD', label: 'SGD - Singapore Dollar' },
          { value: 'BND', label: 'BND - Brunei Dollar' },
          { value: 'MMK', label: 'MMK - Myanmar Kyat' },
          { value: 'LAK', label: 'LAK - Lao Kip' },
          { value: 'KHR', label: 'KHR - Cambodian Riel' },
          { value: 'KRW', label: 'KRW - South Korean Won' },
          { value: 'TWD', label: 'TWD - Taiwan Dollar' },
          { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
          { value: 'MOP', label: 'MOP - Macanese Pataca' },
          { value: 'CNY', label: 'CNY - Chinese Yuan' },
          { value: 'MXN', label: 'MXN - Mexican Peso' },
          { value: 'BRL', label: 'BRL - Brazilian Real' },
          { value: 'ARS', label: 'ARS - Argentine Peso' },
          { value: 'CLP', label: 'CLP - Chilean Peso' },
          { value: 'COP', label: 'COP - Colombian Peso' },
          { value: 'PEN', label: 'PEN - Peruvian Sol' },
          { value: 'UYU', label: 'UYU - Uruguayan Peso' },
          { value: 'VES', label: 'VES - Venezuelan Bolívar' },
          { value: 'BOB', label: 'BOB - Bolivian Boliviano' },
          { value: 'PYG', label: 'PYG - Paraguayan Guarani' },
          { value: 'ZAR', label: 'ZAR - South African Rand' },
          { value: 'EGP', label: 'EGP - Egyptian Pound' },
          { value: 'MAD', label: 'MAD - Moroccan Dirham' },
          { value: 'TND', label: 'TND - Tunisian Dinar' },
          { value: 'DZD', label: 'DZD - Algerian Dinar' },
          { value: 'LYD', label: 'LYD - Libyan Dinar' },
          { value: 'ETB', label: 'ETB - Ethiopian Birr' },
          { value: 'KES', label: 'KES - Kenyan Shilling' },
          { value: 'UGX', label: 'UGX - Ugandan Shilling' },
          { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
          { value: 'RWF', label: 'RWF - Rwandan Franc' },
          { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
          { value: 'NGN', label: 'NGN - Nigerian Naira' },
          { value: 'XOF', label: 'XOF - West African CFA Franc' },
          { value: 'XAF', label: 'XAF - Central African CFA Franc' },
          { value: 'TRY', label: 'TRY - Turkish Lira' },
          { value: 'ILS', label: 'ILS - Israeli Shekel' },
          { value: 'JOD', label: 'JOD - Jordanian Dinar' },
          { value: 'LBP', label: 'LBP - Lebanese Pound' },
          { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
          { value: 'BHD', label: 'BHD - Bahraini Dinar' },
          { value: 'QAR', label: 'QAR - Qatari Riyal' },
          { value: 'OMR', label: 'OMR - Omani Rial' },
          { value: 'YER', label: 'YER - Yemeni Rial' },
          { value: 'IRR', label: 'IRR - Iranian Rial' },
          { value: 'IQD', label: 'IQD - Iraqi Dinar' },
          { value: 'SYP', label: 'SYP - Syrian Pound' },
        ];
      case 'VENDOR_USER':
        // Vendor can select local currency for UI reference, but database uses USD
        return [
          { value: 'USD', label: 'USD - US Dollar (Default)' },
          { value: 'EUR', label: 'EUR - Euro' },
          { value: 'GBP', label: 'GBP - British Pound' },
          { value: 'PKR', label: 'PKR - Pakistani Rupee' },
          { value: 'CAD', label: 'CAD - Canadian Dollar' },
          { value: 'AUD', label: 'AUD - Australian Dollar' },
          { value: 'JPY', label: 'JPY - Japanese Yen' },
          { value: 'INR', label: 'INR - Indian Rupee' },
          { value: 'AED', label: 'AED - UAE Dirham' },
          { value: 'SAR', label: 'SAR - Saudi Riyal' },
          { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
          { value: 'CHF', label: 'CHF - Swiss Franc' },
          { value: 'SEK', label: 'SEK - Swedish Krona' },
          { value: 'NOK', label: 'NOK - Norwegian Krone' },
          { value: 'DKK', label: 'DKK - Danish Krone' },
          { value: 'PLN', label: 'PLN - Polish Zloty' },
          { value: 'CZK', label: 'CZK - Czech Koruna' },
          { value: 'HUF', label: 'HUF - Hungarian Forint' },
          { value: 'RON', label: 'RON - Romanian Leu' },
          { value: 'BGN', label: 'BGN - Bulgarian Lev' },
          { value: 'HRK', label: 'HRK - Croatian Kuna' },
          { value: 'RSD', label: 'RSD - Serbian Dinar' },
          { value: 'BAM', label: 'BAM - Bosnia-Herzegovina Mark' },
          { value: 'MKD', label: 'MKD - Macedonian Denar' },
          { value: 'ALL', label: 'ALL - Albanian Lek' },
          { value: 'MNT', label: 'MNT - Mongolian Tugrik' },
          { value: 'KZT', label: 'KZT - Kazakhstani Tenge' },
          { value: 'UZS', label: 'UZS - Uzbekistani Som' },
          { value: 'KGS', label: 'KGS - Kyrgyzstani Som' },
          { value: 'TJS', label: 'TJS - Tajikistani Somoni' },
          { value: 'TMT', label: 'TMT - Turkmenistani Manat' },
          { value: 'AFN', label: 'AFN - Afghan Afghani' },
          { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
          { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
          { value: 'NPR', label: 'NPR - Nepalese Rupee' },
          { value: 'BTN', label: 'BTN - Bhutanese Ngultrum' },
          { value: 'MVR', label: 'MVR - Maldivian Rufiyaa' },
          { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
          { value: 'THB', label: 'THB - Thai Baht' },
          { value: 'VND', label: 'VND - Vietnamese Dong' },
          { value: 'PHP', label: 'PHP - Philippine Peso' },
          { value: 'SGD', label: 'SGD - Singapore Dollar' },
          { value: 'BND', label: 'BND - Brunei Dollar' },
          { value: 'MMK', label: 'MMK - Myanmar Kyat' },
          { value: 'LAK', label: 'LAK - Lao Kip' },
          { value: 'KHR', label: 'KHR - Cambodian Riel' },
          { value: 'KRW', label: 'KRW - South Korean Won' },
          { value: 'TWD', label: 'TWD - Taiwan Dollar' },
          { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
          { value: 'MOP', label: 'MOP - Macanese Pataca' },
          { value: 'CNY', label: 'CNY - Chinese Yuan' },
          { value: 'MXN', label: 'MXN - Mexican Peso' },
          { value: 'BRL', label: 'BRL - Brazilian Real' },
          { value: 'ARS', label: 'ARS - Argentine Peso' },
          { value: 'CLP', label: 'CLP - Chilean Peso' },
          { value: 'COP', label: 'COP - Colombian Peso' },
          { value: 'PEN', label: 'PEN - Peruvian Sol' },
          { value: 'UYU', label: 'UYU - Uruguayan Peso' },
          { value: 'VES', label: 'VES - Venezuelan Bolívar' },
          { value: 'BOB', label: 'BOB - Bolivian Boliviano' },
          { value: 'PYG', label: 'PYG - Paraguayan Guarani' },
          { value: 'ZAR', label: 'ZAR - South African Rand' },
          { value: 'EGP', label: 'EGP - Egyptian Pound' },
          { value: 'MAD', label: 'MAD - Moroccan Dirham' },
          { value: 'TND', label: 'TND - Tunisian Dinar' },
          { value: 'DZD', label: 'DZD - Algerian Dinar' },
          { value: 'LYD', label: 'LYD - Libyan Dinar' },
          { value: 'ETB', label: 'ETB - Ethiopian Birr' },
          { value: 'KES', label: 'KES - Kenyan Shilling' },
          { value: 'UGX', label: 'UGX - Ugandan Shilling' },
          { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
          { value: 'RWF', label: 'RWF - Rwandan Franc' },
          { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
          { value: 'NGN', label: 'NGN - Nigerian Naira' },
          { value: 'XOF', label: 'XOF - West African CFA Franc' },
          { value: 'XAF', label: 'XAF - Central African CFA Franc' },
          { value: 'TRY', label: 'TRY - Turkish Lira' },
          { value: 'ILS', label: 'ILS - Israeli Shekel' },
          { value: 'JOD', label: 'JOD - Jordanian Dinar' },
          { value: 'LBP', label: 'LBP - Lebanese Pound' },
          { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
          { value: 'BHD', label: 'BHD - Bahraini Dinar' },
          { value: 'QAR', label: 'QAR - Qatari Riyal' },
          { value: 'OMR', label: 'OMR - Omani Rial' },
          { value: 'YER', label: 'YER - Yemeni Rial' },
          { value: 'IRR', label: 'IRR - Iranian Rial' },
          { value: 'IQD', label: 'IQD - Iraqi Dinar' },
          { value: 'SYP', label: 'SYP - Syrian Pound' },
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={addBusiness}
                        onChange={handleBusinessToggle}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Add Company Details (Optional)</span>
                    </label>
                  </div>
                  
                  {addBusiness && (
                    <>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                        Business/Company Name {addBusiness && '*'}
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        required={addBusiness}
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
                        Country {addBusiness && '*'}
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required={addBusiness}
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
                        {formData.role === 'SUPPLIER_USER' ? 'Local Currency (UI Reference)' : 'Local Currency (UI Reference)'} *
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
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.role === 'SUPPLIER_USER' 
                          ? 'This currency will be used for UI display and price calculator. All prices are stored in USD in the database.'
                          : 'This currency will be used for UI display and profit calculator. All prices are stored in USD in the database.'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Business Address</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="addressStreet" className="block text-sm font-medium text-gray-700">
                          Street Address {addBusiness && '*'}
                        </label>
                        <input
                          type="text"
                          id="addressStreet"
                          name="addressStreet"
                          value={formData.addressStreet}
                          onChange={handleInputChange}
                          required={addBusiness}
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

                      </div>

                      <div>
                        <label htmlFor="addressCountry" className="block text-sm font-medium text-gray-700">
                          Country {addBusiness && '*'}
                        </label>
                        <select
                          id="addressCountry"
                          name="addressCountry"
                          value={formData.addressCountry}
                          onChange={handleInputChange}
                          required={addBusiness}
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

                  {/* KYC Details Section */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md font-medium text-blue-900">KYC Verification</h4>
                        <p className="text-sm text-blue-700">
                          Required for Stripe Connect and payout processing
                        </p>
                        {kycData && (
                          <p className="text-sm text-green-700 mt-1">
                            ✅ KYC details completed
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowKycModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {kycData ? 'Update KYC' : 'Add KYC Details'}
                      </button>
                    </div>
                  </div>
                    </>
                  )}
                  
                  {!addBusiness && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-600">
                      <p>💡 You can add company details later by editing this user.</p>
                    </div>
                  )}
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

      {/* KYC Modal */}
      {showKycModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  KYC Verification Details
                </h3>
                <button
                  onClick={handleKycCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <KycForm
                onSubmit={handleKycSubmit}
                onCancel={handleKycCancel}
                initialData={kycData || {
                  countryCode: formData.country,
                  accountType: formData.businessType?.toLowerCase() || 'individual',
                  firstName: formData.name.split(' ')[0] || '',
                  lastName: formData.name.split(' ').slice(1).join(' ') || '',
                  email: formData.email,
                  phone: formData.phone || '',
                  businessName: formData.businessName,
                  businessTaxId: formData.registrationNumber
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}