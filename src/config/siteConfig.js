import { BRAND_LOGOS, PAYMENT_ICONS } from './imageConfig';

const siteConfig = {
  // Site Information
  siteName: 'ShopCo',
  siteDescription: 'Your Premium Fashion Destination',
  
  // Contact Information
  email: 'support@shopco.com',
  phone: '+1 (555) 123-4567',
  address: '123 Fashion Street, Style City, ST 12345',
  
  // Social Media Links
  social: {
    facebook: 'https://facebook.com/shopco',
    twitter: 'https://twitter.com/shopco',
    instagram: 'https://instagram.com/shopco'
  },

  // Featured Brands
  brands: [
    { name: 'Calvin Klein', logo: BRAND_LOGOS.CALVIN_KLEIN },
    { name: 'Prada', logo: BRAND_LOGOS.PRADA },
    { name: 'Gucci', logo: BRAND_LOGOS.GUCCI },
    { name: 'Zara', logo: BRAND_LOGOS.ZARA },
    { name: 'Versace', logo: BRAND_LOGOS.VERSACE }
  ],

  // Payment Methods
  paymentMethods: [
    { name: 'Visa', icon: PAYMENT_ICONS.VISA },
    { name: 'Mastercard', icon: PAYMENT_ICONS.MASTERCARD },
    { name: 'PayPal', icon: PAYMENT_ICONS.PAYPAL },
    { name: 'Apple Pay', icon: PAYMENT_ICONS.APPLE_PAY }
  ],

  // Footer Links
  footerLinks: {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Careers', href: '/careers' }
    ],
    help: [
      { name: 'Customer Service', href: '/customer-service' },
      { name: 'Shipping', href: '/shipping' },
      { name: 'Returns', href: '/returns' }
    ],
    faq: [
      { name: 'Payment Options', href: '/payment-options' },
      { name: 'Sizing Guide', href: '/sizing-guide' },
      { name: 'Order Status', href: '/order-status' }
    ]
  }
};

export default siteConfig; 