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

// Function to update inventory for testing
const updateInventoryForTesting = async () => {
  try {
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to update`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      const productName = product.title || `Product ID: ${product._id}`;
      
      // Only process products with sizes
      if (!product.sizes || product.sizes.length === 0) {
        console.log(`Skipping product ${product._id} - ${productName} (no sizes defined)`);
        continue;
      }
      
      // Set a reasonable stock amount for testing
      const totalStock = 50; // 50 items total
      const sizeCount = product.sizes.length;
      
      // Base allocation per size (integer division)
      const baseAllocation = Math.floor(totalStock / sizeCount);
      
      // Remainder to distribute to first sizes
      let remainder = totalStock % sizeCount;
      
      // Create size inventory object
      const sizeInventory = {};
      
      product.sizes.forEach(size => {
        // Add one extra from remainder if available
        const extraFromRemainder = remainder > 0 ? 1 : 0;
        sizeInventory[size] = baseAllocation + extraFromRemainder;
        
        if (remainder > 0) remainder--;
      });
      
      console.log(`Updating product ${product._id} - ${productName}`);
      console.log(`New total stock: ${totalStock}, Distribution: `, sizeInventory);
      
      // Update the product with the new size inventory and total count
      await Product.findByIdAndUpdate(
        product._id,
        { 
          sizeInventory: sizeInventory,
          countInStock: totalStock 
        },
        { runValidators: false, new: true }
      );
      
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} products with test inventory`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error updating products:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the update function
updateInventoryForTesting(); 