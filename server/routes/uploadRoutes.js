const express = require('express');
const router = express.Router();
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Upload a single file
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, admin, (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create the path to the file (using the new images/products directory)
    const filePath = `/images/products/${req.file.filename}`;
    
    // Return the path
    return res.status(200).json({
      message: 'File uploaded successfully',
      path: filePath
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ 
      error: 'Server error while uploading file',
      details: error.message
    });
  }
});

module.exports = router; 