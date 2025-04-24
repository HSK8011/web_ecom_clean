const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get category by slug
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize default categories if none exist
router.post('/init', async (req, res) => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      const defaultCategories = [
        {
          title: 'Casual',
          description: 'Everyday comfort and style',
          image: '/images/categories/casual.jpg',
          slug: 'casual'
        },
        {
          title: 'Formal',
          description: 'Professional and elegant',
          image: '/images/categories/formal.jpg',
          slug: 'formal'
        },
        {
          title: 'Party',
          description: 'Stand out in the crowd',
          image: '/images/categories/party.jpg',
          slug: 'party'
        },
        {
          title: 'Gym',
          description: 'Performance and comfort',
          image: '/images/categories/gym.jpg',
          slug: 'gym'
        }
      ];

      await Category.insertMany(defaultCategories);
      res.json({ message: 'Default categories initialized' });
    } else {
      res.json({ message: 'Categories already exist' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 