'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Forgot Password Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="mx-auto w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <Link href="/login" className="inline-block">
              <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-indigo-600">FD</span>
              </div>
            </Link>
            <h2 className="text-4xl font-bold text-white mb-2">
              Reset Password
            </h2>
            <p className="text-lg text-indigo-200">
              Enter your email to receive a reset link
            </p>
          </div>

          {/* Forgot Password Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            {success ? (
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Check Your Email!
                  </h3>
                  <p className="text-indigo-200 mb-6">
                    If an account exists with that email, we've sent password reset instructions to your inbox.
                  </p>
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <p className="text-blue-200 text-sm">
                      <strong>Note:</strong> The reset link will expire in 1 hour for security reasons.
                    </p>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="inline-block w-full py-3 px-4 border border-white/30 rounded-lg shadow-sm text-sm font-medium text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition-all duration-200"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-200 text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="text-indigo-200 hover:text-white transition-colors duration-200 font-medium"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-indigo-200 text-sm">
              © 2024 FastDrop. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="relative w-full h-full flex items-center justify-center p-12">
          <div className="relative w-full h-full max-w-2xl">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
            
            {/* Main Image Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-64 h-64 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg className="w-32 h-32 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">
                  Secure Password Reset
                </h3>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  We'll send you a secure link to reset your password. The link expires in 1 hour.
                </p>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 right-20 w-24 h-24 bg-pink-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
