'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', response.status, data);

      if (response.ok) {
        console.log('Login successful, redirecting to:', data.user.role);
        // Redirect based on role
        if (data.user.role === 'ADMIN') {
          router.push('/admin');
        } else if (data.user.role === 'SUPPLIER_USER') {
          router.push('/supplier');
        } else if (data.user.role === 'VENDOR_USER') {
          router.push('/vendor');
        } else if (data.user.role === 'CUSTOMER') {
          router.push('/customer');
        }
      } else {
        console.log('Login failed:', data.error);
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="mx-auto w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
              <span className="text-2xl font-bold text-indigo-600">FD</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Welcome to FastDrop
            </h2>
            <p className="text-lg text-indigo-200">
              Your E-commerce Platform
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
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
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-white">
                      Password
                    </label>
                    <a 
                      href="/forgot-password" 
                      className="text-sm text-indigo-200 hover:text-white transition-colors duration-200"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
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
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center">
                <a 
                  href="/register" 
                  className="text-indigo-200 hover:text-white transition-colors duration-200 font-medium"
                >
                  Don't have an account? 
                  <span className="text-white font-semibold ml-1">Sign up</span>
                </a>
              </div>
            </form>
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
              <div className="relative w-full aspect-square max-w-lg">
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
                  alt="E-commerce Shopping"
                  fill
                  className="object-cover rounded-3xl shadow-2xl"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
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
