const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Direct fix for sizeInventory serialization issue
const directInventoryFix = async () => {
  try {
    // Connect to MongoDB directly and wait for connection
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopco', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB Connected - direct fix');
    
    // Get direct access to the collection
    const productCollection = mongoose.connection.db.collection('products');
    const products = await productCollection.find({}).toArray();
    
    console.log(`Found ${products.length} products to fix directly`);
    let fixedCount = 0;
    
    for (const product of products) {
      // Extract product info
      const productName = product.title || product.name || `Product ID: ${product._id}`;
      const productId = product._id;
      
      // Get the current sizeInventory
      const currentInventory = product.sizeInventory || {};
      
      // Check if sizeInventory is a Map (has empty/no keys in object form)
      if (
        (typeof currentInventory === 'object' && 
         Object.keys(currentInventory).length === 0 && 
         product.countInStock > 0 && 
         product.sizes && 
         product.sizes.length > 0) ||
        currentInventory.constructor.name === 'Map'
      ) {
        console.log(`\nFixing product: ${productName}`);
        
        // Create inventory based on sizes
        const totalStock = product.countInStock || 0;
        const sizes = product.sizes || [];
        
        if (sizes.length === 0) {
          console.log(`Skipping - no sizes defined for ${productName}`);
          continue;
        }
        
        // Base allocation per size (integer division)
        const baseAllocation = Math.floor(totalStock / sizes.length);
        
        // Remainder to distribute to first sizes
        let remainder = totalStock % sizes.length;
        
        // Create new size inventory object
        const newSizeInventory = {};
        
        sizes.forEach(size => {
          // Add one extra from remainder if available
          const extraFromRemainder = remainder > 0 ? 1 : 0;
          newSizeInventory[size] = baseAllocation + extraFromRemainder;
          
          if (remainder > 0) remainder--;
        });
        
        console.log(`Setting inventory to:`, newSizeInventory);
        
        // Direct update with MongoDB driver
        // Use $set operator to ensure we're setting the field as an object
        const updateResult = await productCollection.updateOne(
          { _id: productId },
          { 
            $set: { 
              sizeInventory: newSizeInventory
            } 
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`Successfully updated inventory for ${productName}`);
          fixedCount++;
        } else {
          console.log(`No changes made to ${productName}`);
        }
      } else {
        console.log(`No fix needed for ${productName}`);
      }
    }
    
    console.log(`\nDirectly fixed ${fixedCount} products with inventory issues`);
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error fixing inventory directly:', error);
    try {
      await mongoose.disconnect();
    } catch (err) {
      console.error('Error disconnecting from MongoDB:', err);
    }
    process.exit(1);
  }
};

// Run the direct fix
directInventoryFix().catch(err => {
  console.error('Unhandled error in directInventoryFix:', err);
  process.exit(1);
}); 