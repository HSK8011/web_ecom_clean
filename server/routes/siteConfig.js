const express = require('express');
const router = express.Router();
const { getSiteConfig, updateSiteConfig } = require('../controllers/siteConfigController');
const { auth } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// @route   GET /api/site-config
// @desc    Get site configuration
// @access  Public
router.get('/', getSiteConfig);

// @route   PUT /api/site-config
// @desc    Update site configuration
// @access  Private/Admin
router.put('/', auth, isAdmin, updateSiteConfig);

module.exports = router; 