// Classic theme section map
import HeroSection from './HeroSection';
import FeaturedSection from './FeaturedSection';
import CategoriesSection from './CategoriesSection';
import NewsletterSection from './NewsletterSection';
import Footer from './Footer';
import ProductDetailPage from './ProductDetailPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';

export const sectionMap = {
  hero: HeroSection,
  featured: FeaturedSection,
  categories: CategoriesSection,
  newsletter: NewsletterSection,
  footer: Footer,
} as const;

// Page components for different page types
export const pageComponents = {
  productDetail: ProductDetailPage,
  cart: CartPage,
  checkout: CheckoutPage,
} as const;

export type SectionMap = typeof sectionMap;
export type PageComponents = typeof pageComponents;

export { HeroSection, FeaturedSection, CategoriesSection, NewsletterSection, Footer, ProductDetailPage, CartPage, CheckoutPage };


