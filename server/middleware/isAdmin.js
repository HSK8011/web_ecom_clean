// Admin middleware that checks if the user is an admin
const isAdmin = (req, res, next) => {
  // Add logging to debug authentication issues
  console.log('isAdmin middleware - user:', req.user ? {
    id: req.user._id,
    role: req.user.role,
    isAdmin: req.user.isAdmin || req.user.role === 'admin'
  } : 'No user object');

  if (req.user && (req.user.isAdmin || req.user.role === 'admin')) {
    console.log('Admin check passed, proceeding to next middleware');
    next();
  } else {
    console.log('Admin check failed, access denied');
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

module.exports = isAdmin; 