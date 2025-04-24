const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'SHOP.CO'
  },
  logo: {
    type: String,
    default: '/images/logo.png'
  },
  featuredCategories: [String],
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    pinterest: String
  },
  contactInfo: {
    email: String,
    phone: String,
    address: String
  },
  footerLinks: [{
    title: String,
    links: [{
      text: String,
      url: String
    }]
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: String
  },
  themeColors: {
    primary: {
      type: String,
      default: '#000000'
    },
    secondary: {
      type: String,
      default: '#FFFFFF'
    },
    accent: {
      type: String,
      default: '#FF0000'
    }
  }
}, {
  timestamps: true,
  collection: 'siteconfig'
});

// Ensure there's only one config document by using a singleton pattern
siteConfigSchema.statics.getSiteConfig = async function() {
  const config = await this.findOne();
  if (config) {
    return config;
  }
  return this.create({}); // Create with defaults if none exists
};

const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);

module.exports = SiteConfig; 