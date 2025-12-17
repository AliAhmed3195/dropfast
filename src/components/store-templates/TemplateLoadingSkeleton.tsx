'use client';

import React from 'react';

interface TemplateLoadingSkeletonProps {
  templateName: string;
}

const TemplateLoadingSkeleton: React.FC<TemplateLoadingSkeletonProps> = ({ templateName }) => {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gray-300 rounded"></div>
              <div className="ml-4 h-8 w-48 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="h-6 w-64 bg-gray-300 rounded mx-auto mb-4"></div>
          <div className="h-4 w-96 bg-gray-300 rounded mx-auto"></div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-300"></div>
              <div className="p-6">
                <div className="h-6 w-3/4 bg-gray-300 rounded mb-3"></div>
                <div className="h-4 w-1/2 bg-gray-300 rounded mb-4"></div>
                <div className="h-10 w-full bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading {templateName} Template</h3>
          <p className="text-gray-600">Please wait while we prepare your store...</p>
        </div>
      </div>
    </div>
  );
};

export default TemplateLoadingSkeleton;
