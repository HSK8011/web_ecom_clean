const SiteConfig = require('../models/config/SiteConfig');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get site configuration
 * @route   GET /api/site-config
 * @access  Public
 */
const getSiteConfig = asyncHandler(async (req, res) => {
  try {
    console.log('Fetching site config...');
    let config;
    
    try {
      config = await SiteConfig.getSiteConfig();
    } catch (modelError) {
      console.error('Error in getSiteConfig model method:', modelError);
      // Fallback to direct find
      config = await SiteConfig.findOne();
      if (!config) {
        // Create a default config if none exists
        config = new SiteConfig({});
        await config.save();
      }
    }
    
    console.log('Site config fetched successfully');
    res.json(config);
  } catch (error) {
    console.error('Error fetching site config:', error);
    // Send a more detailed error response
    res.status(500).json({ 
      message: 'Error fetching site configuration',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

/**
 * @desc    Update site configuration
 * @route   PUT /api/site-config
 * @access  Private/Admin
 */
const updateSiteConfig = asyncHandler(async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      config = new SiteConfig({});
    }

    // Update fields from request body
    const updateFields = [
      'name', 'logo', 'featuredCategories', 'socialLinks',
      'contactInfo', 'footerLinks', 'seo', 'maintenanceMode', 'themeColors'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        config[field] = req.body[field];
      }
    });

    const updatedConfig = await config.save();
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating site config:', error);
    res.status(500).json({ message: 'Error updating site configuration' });
  }
});

module.exports = {
  getSiteConfig,
  updateSiteConfig
}; 