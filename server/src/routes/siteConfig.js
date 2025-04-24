const express = require('express');
const router = express.Router();
const SiteConfig = require('../models/SiteConfig');
const Brand = require('../models/Brand');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/images/hero');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Get site configuration
router.get('/', async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      // Create default config if none exists
      config = await SiteConfig.create({
        hero: {
          title: "FIND CLOTHES THAT MATCHES YOUR STYLE",
          description: "Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style."
        },
        brands: []
      });
    }
    
    // Get all brands from the database and include them in the response
    const brands = await Brand.find({});
    
    // If brands exist in the database, use them, otherwise keep the config's brands
    if (brands && brands.length > 0) {
      config = config.toObject(); // Convert to plain object to modify
      config.brands = brands;
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update hero image
router.post('/hero-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const config = await SiteConfig.findOne();
    if (!config) {
      return res.status(404).json({ message: 'Site configuration not found' });
    }

    // Delete old image if it exists
    if (config.hero.image && config.hero.image !== '/images/hero/default-hero.jpg') {
      const oldImagePath = path.join(__dirname, '../../public', config.hero.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update with new image path
    config.hero.image = `/images/hero/${req.file.filename}`;
    await config.save();

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update hero content
router.put('/hero', async (req, res) => {
  try {
    const { title, description } = req.body;
    const config = await SiteConfig.findOne();
    
    if (!config) {
      return res.status(404).json({ message: 'Site configuration not found' });
    }

    if (title) config.hero.title = title;
    if (description) config.hero.description = description;
    
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 