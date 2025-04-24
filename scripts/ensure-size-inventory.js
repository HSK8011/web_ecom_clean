const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/productModel');

console.log('Starting inventory repair script');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopco', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected - Ensuring size inventory'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to ensure all products have proper sizeInventory
const ensureSizeInventory = async () => {
  try {
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      const productId = product._id;
      const productName = product.title || product.name || `Product ID: ${productId}`;
      const sizes = product.sizes || [];
      
      console.log(`\nChecking product: ${productName} (${productId})`);
      
      // Skip products with no sizes
      if (!sizes.length) {
        console.log(`  - No sizes defined, skipping`);
        continue;
      }
      
      // Get total stock
      const totalStock = product.countInStock || 0;
      console.log(`  - Total stock: ${totalStock}`);
      
      // Log the current sizeInventory state
      console.log(`  - Current sizeInventory: `, 
        typeof product.sizeInventory === 'object' 
          ? JSON.stringify(product.sizeInventory) 
          : String(product.sizeInventory)
      );
      
      // Determine if update is needed
      let needsUpdate = false;
      
      // Case 1: sizeInventory is undefined or null
      if (!product.sizeInventory) {
        console.log(`  - sizeInventory is undefined/null`);
        needsUpdate = true;
      } 
      // Case 2: sizeInventory is not an object
      else if (typeof product.sizeInventory !== 'object') {
        console.log(`  - sizeInventory is not an object: ${typeof product.sizeInventory}`);
        needsUpdate = true;
      }
      // Case 3: sizeInventory is empty
      else if (Object.keys(product.sizeInventory).length === 0) {
        console.log(`  - sizeInventory is empty object`);
        needsUpdate = true;
      }
      // Case 4: sizeInventory is missing sizes
      else {
        for (const size of sizes) {
          if (product.sizeInventory[size] === undefined) {
            console.log(`  - Size ${size} missing from inventory`);
            needsUpdate = true;
            break;
          }
        }
      }
      
      if (needsUpdate) {
        console.log(`  - Updating sizeInventory for ${productName}`);
        
        // Evenly distribute stock across sizes
        const perSizeStock = Math.floor(totalStock / sizes.length);
        let remainder = totalStock % sizes.length;
        
        // Create new sizeInventory object
        const newSizeInventory = {};
        
        for (const size of sizes) {
          const extraFromRemainder = remainder > 0 ? 1 : 0;
          newSizeInventory[size] = perSizeStock + extraFromRemainder;
          if (remainder > 0) remainder--;
        }
        
        console.log(`  - New sizeInventory: ${JSON.stringify(newSizeInventory)}`);
        
        try {
          // Update the product directly
          const result = await Product.updateOne(
            { _id: productId },
            { $set: { sizeInventory: newSizeInventory } }
          );
          
          if (result.modifiedCount > 0) {
            console.log(`  - ✅ Successfully updated product ${productId}`);
            updatedCount++;
          } else {
            console.log(`  - ❌ No changes made to product ${productId}`);
          }
        } catch (updateError) {
          console.error(`  - ❌ Error updating product ${productId}:`, updateError);
        }
      } else {
        console.log(`  - ✓ No issues found, skipping update`);
      }
    }
    
    console.log(`\n==================================`);
    console.log(`Completed: Fixed ${updatedCount} out of ${products.length} products`);
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error in ensureSizeInventory:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
ensureSizeInventory(); 