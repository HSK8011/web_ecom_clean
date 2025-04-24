// Payment Method Icons
export const PAYMENT_ICONS = {
  VISA: '/images/payments/visa.png',
  MASTERCARD: '/images/payments/mastercard.png',
  PAYPAL: '/images/payments/paypal.png',
  APPLE_PAY: '/images/payments/apple-pay.png'
};

// Brand Logos
export const BRAND_LOGOS = {
  CALVIN_KLEIN: '/images/brands/calvin-klein.svg',
  PRADA: '/images/brands/prada.svg',
  GUCCI: '/images/brands/gucci.svg',
  ZARA: '/images/brands/zara.svg',
  VERSACE: '/images/brands/versace.svg'
};

// UI Elements
export const UI_IMAGES = {
  NOT_FOUND: '/images/not-found.svg',
  PAYMENT_ILLUSTRATION: '/images/payment-illustration.svg',
  FAVICON: '/vite.svg'
};

// Categories (for MongoDB)
export const CATEGORY_IMAGES = {
  CASUAL: {
    name: 'Casual',
    image: '/images/categories/casual.jpg',
    description: 'Everyday comfort and style'
  },
  FORMAL: {
    name: 'Formal',
    image: '/images/categories/formal.jpg',
    description: 'Professional and elegant'
  },
  PARTY: {
    name: 'Party',
    image: '/images/categories/party.jpg',
    description: 'Stand out in the crowd'
  },
  GYM: {
    name: 'Gym',
    image: '/images/categories/gym.jpg',
    description: 'Performance and comfort'
  }
};

// Helper function to get image path
export const getImagePath = (category, key) => {
  const imageCategories = {
    payment: PAYMENT_ICONS,
    brand: BRAND_LOGOS,
    ui: UI_IMAGES,
    category: CATEGORY_IMAGES
  };
  
  return imageCategories[category]?.[key] || null;
};

// MongoDB Schema fields for images
export const IMAGE_SCHEMA_FIELDS = {
  category: {
    image: {
      type: String,
      required: true
    }
  },
  brand: {
    logo: {
      type: String,
      required: true
    }
  },
  product: {
    images: [{
      type: String,
      required: true
    }]
  }
}; 