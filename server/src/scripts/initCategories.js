const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const defaultCategories = [
  {
    name: 'Casual',
    description: 'Everyday comfort and style',
    image: '/images/categories/casual.jpg',
    slug: 'casual',
    isActive: true
  },
  {
    name: 'Formal',
    description: 'Professional and elegant',
    image: '/images/categories/formal.jpg',
    slug: 'formal',
    isActive: true
  },
  {
    name: 'Party',
    description: 'Stand out in the crowd',
    image: '/images/categories/party.jpg',
    slug: 'party',
    isActive: true
  },
  {
    name: 'Gym',
    description: 'Performance and comfort',
    image: '/images/categories/gym.jpg',
    slug: 'gym',
    isActive: true
  }
];

const initCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopco', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert default categories
    await Category.insertMany(defaultCategories);
    console.log('Default categories initialized successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error initializing categories:', error);
    process.exit(1);
  }
};

initCategories(); 