#!/usr/bin/env node

/**
 * Debug script for cart API issues
 * 
 * This script helps diagnose issues with the cart API by testing authentication
 * and cart data retrieval.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Validate environment setup
const checkEnvironment = () => {
  console.log('🔍 Checking environment configuration...');
  
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set in the .env file');
    console.log('   Run npm run setup-env to configure it properly');
    return false;
  }
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in the .env file');
    return false;
  }
  
  console.log('✅ Environment configuration looks good');
  return true;
};

// Connect to MongoDB
const connectToDatabase = async () => {
  console.log('🔌 Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopco', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB Connected');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    return false;
  }
};

// Find test user
const findTestUser = async () => {
  console.log('👤 Looking for a test user...');
  try {
    // Find any user in the system
    const user = await User.findOne({});
    
    if (!user) {
      console.error('❌ No users found in the database');
      return null;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    return user;
  } catch (error) {
    console.error('❌ Error finding user:', error);
    return null;
  }
};

// Check cart for a user
const checkUserCart = async (userId) => {
  console.log(`🛒 Checking cart for user ${userId}...`);
  try {
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      console.log('ℹ️  No cart found for this user');
      return null;
    }
    
    console.log(`✅ Found cart with ${cart.items.length} items`);
    
    if (cart.items.length > 0) {
      console.log('🛍️  Cart items:');
      cart.items.forEach(item => {
        console.log(`   - ${item.name} (${item.size}) x${item.quantity} at $${item.price}`);
      });
    }
    
    return cart;
  } catch (error) {
    console.error('❌ Error checking cart:', error);
    return null;
  }
};

// Test token generation and validation
const testTokenFunctionality = async (user) => {
  console.log('🔑 Testing JWT token functionality...');
  
  try {
    // Generate a token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    console.log('✅ Successfully generated a JWT token');
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ Successfully verified the JWT token');
    console.log(`   Token payload: userId=${decoded.userId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error with JWT tokens:', error);
    return false;
  }
};

// Main function
const main = async () => {
  console.log('🛠️  Starting Cart API debug...\n');
  
  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // Connect to database
  if (!await connectToDatabase()) {
    process.exit(1);
  }
  
  // Find a test user
  const user = await findTestUser();
  if (!user) {
    process.exit(1);
  }
  
  // Test token functionality
  const tokenWorks = await testTokenFunctionality(user);
  if (!tokenWorks) {
    console.error('\n❌ There appears to be an issue with JWT token generation/verification');
    console.log('   This could be causing the cart API authentication problems');
    console.log('   Run npm run setup-env to fix the JWT_SECRET');
  }
  
  // Check user's cart
  await checkUserCart(user._id);
  
  // Disconnect from MongoDB
  await mongoose.disconnect();
  
  console.log('\n✨ Cart API debug completed');
};

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 