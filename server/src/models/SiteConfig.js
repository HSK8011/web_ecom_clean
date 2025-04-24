const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  hero: {
    title: {
      type: String,
      required: true,
      default: "FIND CLOTHES THAT MATCHES YOUR STYLE"
    },
    description: {
      type: String,
      required: true,
      default: "Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style."
    }
  },
  brands: [{
    name: {
      type: String,
      required: true
    },
    logo: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);

module.exports = SiteConfig; 