const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/productModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopco', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected - Fixing cart inventory issues'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to fix inventory across products
const fixInventoryIssues = async () => {
  try {
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check and fix`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      const productId = product._id;
      const productName = product.title || `Product ID: ${productId}`;
      
      // Skip products without sizes
      if (!product.sizes || product.sizes.length === 0) {
        console.log(`Skipping product ${productId} - ${productName} (no sizes defined)`);
        continue;
      }
      
      console.log(`Checking product ${productId} - ${productName}`);
      
      let needsUpdate = false;
      const totalStock = product.countInStock || 0;
      
      // Check if sizeInventory is properly initialized
      if (!product.sizeInventory || 
          typeof product.sizeInventory !== 'object' || 
          Object.keys(product.sizeInventory).length === 0) {
        console.log(`  - sizeInventory missing or empty, will be initialized`);
        needsUpdate = true;
      } else {
        // Check if all sizes are represented in sizeInventory
        for (const size of product.sizes) {
          if (product.sizeInventory[size] === undefined) {
            console.log(`  - Size ${size} missing from inventory, will be added`);
            needsUpdate = true;
          }
        }
        
        // Check if total matches countInStock
        const currentTotalStock = Object.values(product.sizeInventory)
          .reduce((sum, qty) => sum + (Number(qty) || 0), 0);
        
        if (currentTotalStock !== totalStock) {
          console.log(`  - Total stock mismatch: countInStock=${totalStock}, sum of sizeInventory=${currentTotalStock}`);
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        // Distribute stock evenly among sizes
        const sizeCount = product.sizes.length;
        const baseAllocation = Math.floor(totalStock / sizeCount);
        let remainder = totalStock % sizeCount;
        
        // Create a new size inventory object
        const newSizeInventory = {};
        
        product.sizes.forEach(size => {
          const extraFromRemainder = remainder > 0 ? 1 : 0;
          newSizeInventory[size] = baseAllocation + extraFromRemainder;
          if (remainder > 0) remainder--;
        });
        
        console.log(`  - Updating sizeInventory: `, newSizeInventory);
        
        // Update using findByIdAndUpdate to ensure proper type conversion
        const updated = await Product.findByIdAndUpdate(
          productId,
          { sizeInventory: newSizeInventory },
          { new: true, runValidators: false }
        );
        
        if (updated) {
          console.log(`  - Successfully updated product ${productId}`);
          updatedCount++;
        } else {
          console.log(`  - Failed to update product ${productId}`);
        }
      } else {
        console.log(`  - No issues found, skipping update`);
      }
    }
    
    console.log(`\nCompleted: Fixed inventory issues for ${updatedCount} products out of ${products.length} total`);
    console.log(`Run this script again if you continue to see issues with product availability.`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing inventory:', error);
    process.exit(1);
  }
};

// Run the fix function
fixInventoryIssues(); 