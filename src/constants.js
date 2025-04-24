// API URL
export const BASE_URL = 'http://localhost:5000';
export const API_URL = `${BASE_URL}/api`;

// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}/${imagePath.replace(/^\//, '')}`;
};

// Payment methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'Credit Card',
  PAYPAL: 'PayPal',
  CASH_ON_DELIVERY: 'Cash on Delivery'
};

// Product categories
export const PRODUCT_CATEGORIES = [
  'Casual',
  'Formal',
  'Party',
  'Gym'
];

// Default order status flow
export const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled'
];

// Available sizes
export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Maximum products per page
export const PRODUCTS_PER_PAGE = 12; 