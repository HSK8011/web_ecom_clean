// Image paths configuration
const HERO_IMAGES = {
  main: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80',
  secondary: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80',
};

const CATEGORY_IMAGES = {
  casual: 'https://images.unsplash.com/photo-1552642986-ccb41e7059e7?auto=format&fit=crop&q=80',
  formal: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80',
  party: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80',
  gym: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80',
};

const BRAND_LOGOS = {
  nike: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Nike_Logo.svg/1200px-Nike_Logo.svg.png',
  adidas: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/1200px-Adidas_Logo.svg.png',
  puma: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Puma_Logo.svg/2560px-Puma_Logo.svg.png',
  reebok: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Reebok_2019_logo.svg/2560px-Reebok_2019_logo.svg.png',
};

const PAYMENT_ICONS = {
  visa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png',
  mastercard: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png',
  paypal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png',
  applePay: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/2560px-Apple_Pay_logo.svg.png',
};

// Helper function to get image path
const getImagePath = (category, key) => {
  const imageCategories = {
    hero: HERO_IMAGES,
    category: CATEGORY_IMAGES,
    brand: BRAND_LOGOS,
    payment: PAYMENT_ICONS,
  };

  return imageCategories[category]?.[key] || null;
};

// MongoDB schema fields for images
const mongoImageFields = {
  categories: {
    image: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return Object.values(CATEGORY_IMAGES).includes(v);
        },
        message: props => `${props.value} is not a valid category image path!`
      }
    }
  },
  brands: {
    logo: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return Object.values(BRAND_LOGOS).includes(v);
        },
        message: props => `${props.value} is not a valid brand logo path!`
      }
    }
  },
  products: {
    images: [{
      type: String,
      required: true
    }]
  }
};

// UI Elements
const UI_IMAGES = {
  NOT_FOUND: '/images/not-found.svg',
  PAYMENT_ILLUSTRATION: '/images/payment-illustration.svg',
  FAVICON: '/vite.svg'
};

module.exports = {
  HERO_IMAGES,
  CATEGORY_IMAGES,
  BRAND_LOGOS,
  PAYMENT_ICONS,
  UI_IMAGES,
  getImagePath,
  mongoImageFields
};

// MongoDB Schema fields for images
const IMAGE_SCHEMA_FIELDS = {
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