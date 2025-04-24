const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const { auth, adminAuth } = require('../middleware/auth');

// Get all brands
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({});
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching brands' });
  }
});

// Get featured brands
router.get('/featured', async (req, res) => {
  try {
    const featuredBrands = await Brand.find({ featured: true });
    res.json(featuredBrands);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching featured brands' });
  }
});

// Admin Routes

// Add new brand (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const brand = new Brand(req.body);
    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    res.status(400).json({ error: 'Error creating brand' });
  }
});

// Update brand (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    res.status(400).json({ error: 'Error updating brand' });
  }
});

// Delete brand (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error deleting brand' });
  }
});

module.exports = router; 