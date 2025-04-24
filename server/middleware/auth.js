const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware that validates JWT tokens
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
      // Ensure JWT_SECRET is properly set in environment variables
      if (!process.env.JWT_SECRET) {
        console.error('ERROR: JWT_SECRET environment variable is not set');
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      const user = await User.findById(decoded.userId);

      if (!user) {
        console.error('User not found for ID:', decoded.userId);
        return res.status(401).json({ error: 'User not found' });
      }

      // Log user object to verify structure
      console.log('User found:', {
        id: user.id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Admin authorization middleware
 * Requires auth middleware to run first
 */
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
        next();
      } else {
        res.status(403).json({ error: 'Access denied. Admin only.' });
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

module.exports = { auth, adminAuth }; 