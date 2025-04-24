const mongoose = require('mongoose');
require('dotenv').config();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');

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

// List of all known problematic product IDs
const PROBLEM_PRODUCT_IDS = [
  '67fb9d4ffb4b27d37eb60021',
  '67fbb1031cac97aca2f71202'
];

// Clear local storage of problematic items
const fixAllMissingProducts = async () => {
  try {
    console.log(`FIXING ALL MISSING PRODUCTS: ${PROBLEM_PRODUCT_IDS.join(', ')}`);
    
    // 1. Find and fix all carts containing any problematic products
    const cartPromises = PROBLEM_PRODUCT_IDS.map(async (problemId) => {
      const carts = await Cart.find({
        'items.product': problemId
      });
      
      console.log(`Found ${carts.length} carts with problematic product ${problemId}`);
      
      for (const cart of carts) {
        // Get original items count
        const originalCount = cart.items.length;
        
        // Filter out ALL problem products
        const validItems = cart.items.filter(
          item => !item.product || !PROBLEM_PRODUCT_IDS.includes(item.product.toString())
        );
        
        // Recalculate total
        let newTotal = 0;
        for (const item of validItems) {
          newTotal += (item.price || 0) * (item.quantity || 1);
        }
        
        // Update the cart
        await Cart.findByIdAndUpdate(
          cart._id,
          {
            $set: {
              items: validItems,
              totalAmount: newTotal
            }
          }
        );
        
        console.log(`Updated cart for user ${cart.user}: Removed ${originalCount - validItems.length} problematic items`);
      }
    });
    
    await Promise.all(cartPromises);
    
    // 2. Find and fix all orders containing any problematic products
    const orderPromises = PROBLEM_PRODUCT_IDS.map(async (problemId) => {
      const orders = await Order.find({
        'items.product': problemId
      });
      
      console.log(`Found ${orders.length} orders with problematic product ${problemId}`);
      
      for (const order of orders) {
        // Get original items count
        const originalCount = order.items.length;
        
        // Filter out ALL problem products
        const validItems = order.items.filter(
          item => !item.product || !PROBLEM_PRODUCT_IDS.includes(item.product.toString())
        );
        
        // If no valid items left, mark as cancelled
        if (validItems.length === 0) {
          await Order.findByIdAndUpdate(
            order._id,
            {
              $set: {
                status: 'cancelled',
                items: []
              }
            }
          );
          
          console.log(`Cancelled empty order ${order._id} (all items were problematic)`);
          continue;
        }
        
        // Recalculate total
        let newTotal = 0;
        for (const item of validItems) {
          newTotal += (item.price || 0) * (item.quantity || 1);
        }
        
        // Update the order
        await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              items: validItems,
              totalAmount: newTotal
            }
          }
        );
        
        console.log(`Updated order ${order._id}: Removed ${originalCount - validItems.length} problematic items`);
      }
    });
    
    await Promise.all(orderPromises);
    
    // 3. Check all existing products to make sure they're valid
    await validateAllProducts();
    
    // 4. Update inventory for all remaining products
    await updateProductInventory();
    
    console.log('Fix completed successfully!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing missing products:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Check all products to make sure they exist and are valid
const validateAllProducts = async () => {
  try {
    console.log('\nValidating all products...');
    
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to validate`);
    
    let validCount = 0;
    let invalidCount = 0;
    
    for (const product of products) {
      try {
        // Basic validation - make sure required fields exist
        const isValid = 
          product.name || product.title || product.productName &&
          product.price !== undefined && 
          product.countInStock !== undefined;
        
        if (isValid) {
          validCount++;
        } else {
          console.log(`Found invalid product: ${product._id} - Missing required fields`);
          invalidCount++;
        }
      } catch (error) {
        console.error(`Error validating product ${product._id}:`, error);
        invalidCount++;
      }
    }
    
    console.log(`Validation results: ${validCount} valid products, ${invalidCount} invalid products`);
  } catch (error) {
    console.error('Error validating products:', error);
  }
};

// Update inventory for remaining products
const updateProductInventory = async () => {
  try {
    console.log('\nUpdating inventory for all products...');
    
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      // Skip products without sizes
      if (!product.sizes || product.sizes.length === 0) {
        continue;
      }
      
      // Get current inventory
      const totalStock = product.countInStock || 0;
      
      // Skip if no stock
      if (totalStock <= 0) {
        continue;
      }
      
      const sizeCount = product.sizes.length;
      
      // Calculate stock per size
      const basePerSize = Math.floor(totalStock / sizeCount);
      let remainder = totalStock % sizeCount;
      
      // Create size inventory
      const sizeInventory = {};
      
      for (const size of product.sizes) {
        const extra = remainder > 0 ? 1 : 0;
        sizeInventory[size] = basePerSize + extra;
        if (remainder > 0) remainder--;
      }
      
      // Update product inventory
      await Product.findByIdAndUpdate(
        product._id,
        {
          $set: {
            sizeInventory: sizeInventory
          }
        },
        { runValidators: false }
      );
      
      updatedCount++;
    }
    
    console.log(`Updated inventory for ${updatedCount} products`);
  } catch (error) {
    console.error('Error updating product inventory:', error);
  }
};

// Run the fix
fixAllMissingProducts(); 