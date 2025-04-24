const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

/**
 * Utility function to ensure JWT_SECRET is set
 * @returns {boolean} - True if JWT_SECRET is set, otherwise sends error response
 */
const ensureJwtSecret = (res) => {
  if (!process.env.JWT_SECRET) {
    console.error('ERROR: JWT_SECRET environment variable is not set');
    console.error('Hint: Check if .env file exists and is being loaded correctly');
    console.error('Current process.env keys:', Object.keys(process.env).join(', '));
    console.error('Try running: npm run setup-env');
    
    res.status(500).json({ 
      error: 'Server configuration error', 
      details: 'JWT_SECRET not set. Please contact the administrator.'
    });
    return false;
  }
  
  if (process.env.JWT_SECRET === 'your_jwt_secret_key_here' || 
      process.env.JWT_SECRET === 'use_a_strong_random_string_here_at_least_32_chars') {
    console.warn('WARNING: JWT_SECRET is using a default/insecure value');
    // We'll still allow it to work, but log a warning
  }
  
  return true;
};

// Register a new user
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  // Add validation for new fields
  check('phone').optional().trim(),
  check('address').optional().isObject(),
  check('address.street').optional().trim(),
  check('address.city').optional().trim(),
  check('address.state').optional().trim(),
  check('address.zipCode').optional().trim(),
  check('address.country').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, address } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Process address object with proper default values
    const userAddress = {
      street: address?.street || '123 Main St',
      city: address?.city || 'New York',
      state: address?.state || 'NY',
      zipCode: address?.zipCode || '10001',
      country: address?.country || 'USA'
    };

    // Create new user with phone and address
    user = new User({
      name,
      email,
      password,
      role: 'user',
      phone: phone || '', // Empty string is better than a fake number
      address: userAddress
    });

    await user.save();

    // Ensure JWT_SECRET is properly set
    if (!ensureJwtSecret(res)) return;

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Return user data with address and phone
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin',
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', user._id);
    
    try {
      const isMatch = await user.comparePassword(password);
      console.log('Password comparison result:', isMatch);

      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return res.status(500).json({ error: 'Error verifying password' });
    }

    // Ensure JWT_SECRET is properly set
    if (!ensureJwtSecret(res)) return;
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Ensure we have complete address object
    const address = {
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      zipCode: user.address?.zipCode || '',
      country: user.address?.country || ''
    };

    console.log('Login successful for user:', user._id);
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin',
        phone: user.phone || '',
        address: address,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure we have complete and consistent user data
    const userData = {
      ...user.toObject(),
      isAdmin: user.role === 'admin',
      phone: user.phone || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || ''
      }
    };
    
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token - returns 200 if valid, 401 if invalid
router.get('/verify-token', auth, async (req, res) => {
  try {
    // If we get here, the token is valid (auth middleware passed)
    res.status(200).json({ valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 