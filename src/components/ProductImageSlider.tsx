'use client';

import { useState } from 'react';

interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isMain: boolean;
  order: number;
}

interface ProductImageSliderProps {
  images: ProductImage[];
  fallbackImage?: string;
  productName: string;
  className?: string;
}

export default function ProductImageSlider({ 
  images, 
  fallbackImage, 
  productName, 
  className = "w-full h-32 object-cover rounded-md mb-3" 
}: ProductImageSliderProps) {
  // Safety check for productName
  const safeProductName = typeof productName === 'string' ? productName : 'Product';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Combine images from ProductImage table and fallback image
  const allImages = [
    ...(fallbackImage ? [{ id: 'main', url: fallbackImage, alt: safeProductName, isMain: true, order: -1 }] : []),
    ...(Array.isArray(images) ? images : [])
  ].filter(img => img && typeof img === 'object' && img.url) // Filter out invalid images
  .sort((a, b) => {
    // Sort by isMain first, then by order
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return a.order - b.order;
  });

  if (allImages.length === 0) {
    return (
      <div className={`bg-gray-200 rounded-md flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">No Image</span>
      </div>
    );
  }

  if (allImages.length === 1) {
    return (
      <img
        src={allImages[0].url}
        alt={allImages[0].alt || safeProductName}
        className={className}
      />
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="relative group">
      <img
        src={allImages[currentImageIndex].url}
        alt={allImages[currentImageIndex].alt || safeProductName}
        className={className}
      />
      
      {/* Navigation arrows */}
      <button
        onClick={prevImage}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70"
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        onClick={nextImage}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70"
        aria-label="Next image"
      >
        ›
      </button>

      {/* Image indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {allImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentImageIndex 
                ? 'bg-white' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image counter */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {currentImageIndex + 1} / {allImages.length}
      </div>
    </div>
  );
}

