const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { adminAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Initialize default categories
const defaultCategories = [
  {
    name: 'Casual',
    description: 'Everyday comfort and style',
    image: '/images/categories/casual.jpg',
    isActive: true
  },
  {
    name: 'Formal',
    description: 'Professional and elegant',
    image: '/images/categories/formal.jpg',
    isActive: true
  },
  {
    name: 'Party',
    description: 'Stand out in the crowd',
    image: '/images/categories/party.jpg',
    isActive: true
  },
  {
    name: 'Gym',
    description: 'Performance and comfort',
    image: '/images/categories/gym.jpg',
    isActive: true
  }
];

// Initialize categories if they don't exist
const initializeCategories = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Drop the collection to ensure clean state
    await mongoose.connection.db.collection('categories').drop().catch(() => {
      console.log('Collection does not exist yet, proceeding with initialization');
    });

    // Create the collection with proper indexes
    await Category.createCollection();
    await Category.createIndexes();

    // Insert default categories
    const newCategories = await Category.insertMany(defaultCategories, { session });
    console.log('Successfully initialized categories:', newCategories);
    
    await session.commitTransaction();
    return newCategories;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error initializing categories:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

// Get all categories
router.get('/', async (req, res) => {
  try {
    console.log('GET /categories - Fetching categories...');
    
    // Check if we need to initialize
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log('No categories found, initializing...');
      await initializeCategories();
    }
    
    // Fetch all active categories
    const categories = await Category.find({ isActive: true });
    console.log(`Found ${categories.length} categories:`, categories.map(c => c.name));
    
    res.json(categories);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get category by slug
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug.toLowerCase(),
      isActive: true 
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create category (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Category with this name already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Update category (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Category with this name already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Delete category (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    category.isActive = false;
    await category.save();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 