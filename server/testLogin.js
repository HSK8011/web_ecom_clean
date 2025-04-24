const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('Environment loaded from:', path.resolve(__dirname, '.env'));
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

if (process.env.JWT_SECRET) {
  console.log('JWT_SECRET begins with:', process.env.JWT_SECRET.substring(0, 5) + '...');
}

// If MONGODB_URI isn't in the environment, use a default value
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
console.log('Using MongoDB URI:', MONGODB_URI);

// Import the User model
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Test login
const testLogin = async () => {
  try {
    const email = 'admin@example.com';
    const password = '123456';
    
    console.log(`Testing login with email: ${email} and password: ${password}`);
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('User found:', user);
    
    // Check if user has comparePassword method
    if (typeof user.comparePassword !== 'function') {
      console.error('comparePassword method not found on user object');
      
      // Try to compare password manually
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Manual password comparison result:', isMatch);
    } else {
      // Compare password using method
      const isMatch = await user.comparePassword(password);
      console.log('Password comparison result:', isMatch);
    }
    
    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('ERROR: JWT_SECRET environment variable is not set. Cannot generate token.');
      process.exit(1);
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    console.log('Generated token successfully');
    
  } catch (error) {
    console.error('Error testing login:', error);
  } finally {
    process.exit();
  }
};

// Run the function
testLogin(); 