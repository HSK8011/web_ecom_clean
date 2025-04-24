const jwt = require('jsonwebtoken');
const fs = require('fs');

// JWT Secret
const JWT_SECRET = 'your-secret-key';

// Generate token for a user with consistent ID field
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id || user._id, // Always include userId field
      name: user.name, 
      email: user.email, 
      isAdmin: user.isAdmin 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user in request, always using userId field for consistency
    req.user = {
      id: decoded.userId || decoded.id || decoded._id
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Authentication middleware
module.exports = authMiddleware; 