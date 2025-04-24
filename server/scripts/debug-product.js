const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Product = require('../models/productModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopco', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to debug product data
const debugProductData = async () => {
  try {
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to debug`);
    
    for (const product of products) {
      const productName = product.title || `Product ID: ${product._id}`;
      
      console.log(`\n=== PRODUCT: ${productName} ===`);
      console.log(`ID: ${product._id}`);
      console.log(`Brand: ${product.brand}`);
      console.log(`Price: $${product.price}`);
      console.log(`countInStock: ${product.countInStock}`);
      
      // Debug sizes array
      console.log(`Sizes: ${JSON.stringify(product.sizes || [])}`);
      
      // Debug sizeInventory
      console.log('sizeInventory:');
      
      // Convert Map to object if needed
      const sizeInventory = product.sizeInventory || {};
      const inventory = sizeInventory instanceof Map 
        ? Object.fromEntries(sizeInventory) 
        : sizeInventory;
      
      console.log(JSON.stringify(inventory, null, 2));
      
      // Check if product schema has toObject method
      if (typeof product.toObject === 'function') {
        console.log('Full product data (toObject):');
        console.log(JSON.stringify(product.toObject(), null, 2));
      }
      
      console.log('\n----------------------------\n');
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error debugging products:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the debug function
debugProductData(); 