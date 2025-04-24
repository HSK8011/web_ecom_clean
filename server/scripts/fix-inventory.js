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

// Function to fix inventory serialization
const fixInventorySerialization = async () => {
  try {
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to fix`);
    
    let fixedCount = 0;
    
    for (const product of products) {
      const productName = product.title || product.name || `Product ID: ${product._id}`;
      
      // Get the current sizeInventory
      const sizeInventory = product.sizeInventory || {};
      const inventory = sizeInventory instanceof Map 
        ? Object.fromEntries(sizeInventory) 
        : sizeInventory;
      
      // Check if inventory is empty in the serialized data
      const serializedProduct = product.toObject();
      const serializedInventory = serializedProduct.sizeInventory || {};
      
      if (Object.keys(serializedInventory).length === 0 && Object.keys(inventory).length > 0) {
        console.log(`Fixing serialization for product: ${productName}`);
        console.log(`Current inventory: ${JSON.stringify(inventory)}`);
        
        // Create a plain object version of the inventory
        const plainInventory = {};
        
        // Convert the inventory object to key-value pairs
        for (const [size, quantity] of Object.entries(inventory)) {
          plainInventory[size] = quantity;
        }
        
        // Debug - show what we're saving
        console.log(`Saving inventory as: ${JSON.stringify(plainInventory)}`);
        
        // Use findByIdAndUpdate to bypass schema validation
        await Product.findByIdAndUpdate(
          product._id,
          { $set: { sizeInventory: plainInventory } },
          { 
            runValidators: false, 
            new: true 
          }
        );
        
        fixedCount++;
      } else {
        console.log(`No fix needed for product: ${productName}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} products with inventory serialization issues`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing inventory:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the fix function
fixInventorySerialization(); 