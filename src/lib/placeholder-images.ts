// Utility for generating reliable placeholder images
export const getPlaceholderImage = (width: number, height: number, seed?: string) => {
  const randomSeed = seed || Math.floor(Math.random() * 1000);
  return `https://picsum.photos/${width}/${height}?random=${randomSeed}`;
};

// Predefined placeholder images for consistency
export const placeholderImages = {
  // Product images
  product1: 'https://picsum.photos/300/200?random=10',
  product2: 'https://picsum.photos/300/200?random=11',
  product3: 'https://picsum.photos/300/200?random=12',
  product4: 'https://picsum.photos/300/200?random=13',
  product5: 'https://picsum.photos/300/200?random=14',
  product6: 'https://picsum.photos/300/200?random=15',
  
  // Category images
  category1: 'https://picsum.photos/200/200?random=20',
  category2: 'https://picsum.photos/200/200?random=21',
  category3: 'https://picsum.photos/200/200?random=22',
  category4: 'https://picsum.photos/200/200?random=23',
  
  // Banner images
  banner1: 'https://picsum.photos/1200/400?random=30',
  banner2: 'https://picsum.photos/1200/400?random=31',
  banner3: 'https://picsum.photos/1200/400?random=32',
  
  // Hero images
  hero1: 'https://picsum.photos/800/400?random=40',
  hero2: 'https://picsum.photos/800/400?random=41',
  hero3: 'https://picsum.photos/800/400?random=42',
  
  // Store banner
  storeBanner: 'https://picsum.photos/1200/400?random=50',
  
  // Logo placeholder
  logo: 'https://picsum.photos/200/200?random=60'
};
