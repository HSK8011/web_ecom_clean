require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const { CATEGORY_IMAGES } = require('../../../src/config/imageConfig');

const initializeCategories = async () => {
  try {
    // Check if categories already exist
    const existingCategories = await Category.find();
    if (existingCategories.length > 0) {
      console.log('Categories already exist. Skipping initialization.');
      return;
    }

    // Create default categories from imageConfig
    const categories = Object.values(CATEGORY_IMAGES).map(category => ({
      name: category.name,
      description: category.description,
      image: category.image,
      isActive: true
    }));

    await Category.insertMany(categories);
    console.log('Categories initialized successfully');
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
};

module.exports = initializeCategories; 