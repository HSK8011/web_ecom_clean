require('dotenv').config();
const mongoose = require('mongoose');
const Brand = require('../models/Brand');

const brands = [
  {
    name: 'VERSACE',
    logo: 'https://example.com/versace-logo.png',
    description: 'Italian luxury fashion company',
    featured: true
  },
  {
    name: 'ZARA',
    logo: 'https://example.com/zara-logo.png',
    description: 'Spanish apparel retailer',
    featured: true
  },
  {
    name: 'GUCCI',
    logo: 'https://example.com/gucci-logo.png',
    description: 'Italian luxury brand of fashion',
    featured: true
  },
  {
    name: 'PRADA',
    logo: 'https://example.com/prada-logo.png',
    description: 'Italian luxury fashion house',
    featured: true
  },
  {
    name: 'Calvin Klein',
    logo: 'https://example.com/calvin-klein-logo.png',
    description: 'American fashion house',
    featured: true
  }
];

const seedBrands = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Clear existing brands
    await Brand.deleteMany({});
    
    // Insert new brands
    await Brand.insertMany(brands);
    
    console.log('Brands seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding brands:', error);
    process.exit(1);
  }
};

seedBrands(); 