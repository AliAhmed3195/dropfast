'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push('/login');
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>
      
      <div className="relative text-center">
        {/* Logo */}
        <div className="mx-auto h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8 animate-pulse">
          <span className="text-4xl font-bold text-indigo-600">FD</span>
        </div>
        
        {/* Title */}
        <h1 className="text-6xl font-bold text-white mb-4 animate-bounce">
          FastDrop
        </h1>
        
        {/* Subtitle */}
        <p className="text-2xl text-indigo-200 mb-8">
          E-commerce Platform
        </p>
        
        {/* Loading Animation */}
        <div className="flex justify-center items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        
        <p className="text-indigo-200 mt-4 text-lg">
          Redirecting to login...
        </p>
      </div>
    </main>
  );
}