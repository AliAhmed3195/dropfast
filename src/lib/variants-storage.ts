// Temporary in-memory storage for variants until database schema is updated
interface Variant {
  id: string;
  name: string;
  value: string;
  priceModifier: number;
}

interface ProductVariants {
  [productId: string]: Variant[];
}

// In-memory storage
let variantsStorage: ProductVariants = {};

export function storeProductVariants(productId: string, variants: Variant[]) {
  variantsStorage[productId] = variants;
}

export function getProductVariants(productId: string): Variant[] {
  return variantsStorage[productId] || [];
}

export function getAllVariants(): ProductVariants {
  return variantsStorage;
}

// Clear storage (useful for testing)
export function clearVariantsStorage() {
  variantsStorage = {};
}
