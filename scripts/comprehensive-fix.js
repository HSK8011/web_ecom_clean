const mongoose = require('mongoose');
require('dotenv').config();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

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

// Comprehensive fix for cart and order issues
const comprehensiveFix = async () => {
  try {
    console.log('Starting comprehensive fix...');
    
    // PART 1: Fix carts with missing products
    await fixCarts();
    
    // PART 2: Update product inventory
    await updateProductInventory();
    
    // PART 3: Check and fix pending orders
    await fixPendingOrders();
    
    console.log('Comprehensive fix completed successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error during comprehensive fix:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Fix user carts
const fixCarts = async () => {
  console.log('\n=== FIXING USER CARTS ===');
  
  // Find all carts
  const carts = await Cart.find({});
  console.log(`Found ${carts.length} carts to check`);
  
  let fixedCount = 0;
  let problemProduct = '67fb9d4ffb4b27d37eb60021'; // The specific problematic product ID
  
  for (const cart of carts) {
    const userId = cart.user;
    let originalItemsCount = cart.items.length;
    let hadMissingProducts = false;
    
    // Check each item in the cart
    const validItems = [];
    
    for (const item of cart.items) {
      // Check if this is the problematic product ID
      if (item.product && item.product.toString() === problemProduct) {
        console.log(`Found problematic product ${problemProduct} in cart for user ${userId}`);
        hadMissingProducts = true;
        continue; // Skip this item (don't add to validItems)
      }
      
      // For other items, verify they exist in the database
      try {
        const productExists = await Product.findById(item.product);
        if (productExists) {
          validItems.push(item); // Product exists, keep it in the cart
        } else {
          console.log(`Found missing product ${item.product} in cart for user ${userId}`);
          hadMissingProducts = true;
        }
      } catch (error) {
        console.log(`Error checking product ${item.product}: ${error.message}`);
        hadMissingProducts = true;
      }
    }
    
    // Update cart if any items were removed
    if (hadMissingProducts) {
      // Calculate new total price
      let totalAmount = 0;
      for (const item of validItems) {
        totalAmount += item.price * item.quantity;
      }
      
      // Update the cart
      await Cart.findByIdAndUpdate(
        cart._id,
        { 
          $set: { 
            items: validItems,
            totalAmount: totalAmount
          } 
        },
        { new: true }
      );
      
      console.log(`Updated cart for user ${userId}: Removed ${originalItemsCount - validItems.length} invalid items`);
      fixedCount++;
    }
  }
  
  console.log(`Fixed ${fixedCount} carts with missing products`);
  return fixedCount;
};

// Update product inventory
const updateProductInventory = async () => {
  console.log('\n=== UPDATING PRODUCT INVENTORY ===');
  
  // Get all products
  const products = await Product.find({});
  console.log(`Found ${products.length} products to update`);
  
  let updatedCount = 0;
  
  for (const product of products) {
    try {
      // Only process products with sizes
      if (!product.sizes || product.sizes.length === 0) {
        console.log(`Skipping product ${product._id} - ${product.title || product.name} (no sizes defined)`);
        continue;
      }
      
      // Get current inventory
      const totalStock = product.countInStock || 0;
      
      // Skip if no stock
      if (totalStock <= 0) {
        continue;
      }
      
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
      
      console.log(`Updating product ${product._id} - ${product.title || product.name || 'Unnamed Product'}`);
      console.log(`Setting inventory: ${JSON.stringify(sizeInventory)}`);
      
      // Update the product with the new size inventory
      await Product.findByIdAndUpdate(
        product._id,
        { 
          $set: { 
            sizeInventory: sizeInventory
          } 
        },
        { runValidators: false, new: true }
      );
      
      updatedCount++;
    } catch (error) {
      console.error(`Error updating product ${product._id}:`, error);
    }
  }
  
  console.log(`Successfully updated ${updatedCount} products with inventory`);
  return updatedCount;
};

// Fix pending orders with missing products
const fixPendingOrders = async () => {
  console.log('\n=== FIXING PENDING ORDERS ===');
  
  // Find pending orders
  const pendingOrders = await Order.find({ status: 'pending' });
  console.log(`Found ${pendingOrders.length} pending orders to check`);
  
  let fixedCount = 0;
  let problemProduct = '67fb9d4ffb4b27d37eb60021'; // The specific problematic product ID
  
  for (const order of pendingOrders) {
    let hasIssue = false;
    const validItems = [];
    
    // Check each item in the order
    for (const item of order.items) {
      // Check if this is the problematic product ID
      if (item.product && item.product.toString() === problemProduct) {
        console.log(`Found problematic product ${problemProduct} in order ${order._id}`);
        hasIssue = true;
        continue; // Skip this item
      }
      
      // Verify product exists
      try {
        const productExists = await Product.findById(item.product);
        if (productExists) {
          validItems.push(item);
        } else {
          console.log(`Found missing product ${item.product} in order ${order._id}`);
          hasIssue = true;
        }
      } catch (error) {
        console.log(`Error checking product ${item.product}: ${error.message}`);
        hasIssue = true;
      }
    }
    
    // Update order if needed
    if (hasIssue && validItems.length > 0) {
      // Recalculate total amount
      let totalAmount = 0;
      for (const item of validItems) {
        totalAmount += item.price * item.quantity;
      }
      
      // Update the order
      await Order.findByIdAndUpdate(
        order._id,
        { 
          $set: { 
            items: validItems,
            totalAmount: totalAmount
          } 
        },
        { new: true }
      );
      
      console.log(`Updated order ${order._id}: Removed invalid items`);
      fixedCount++;
    } else if (hasIssue && validItems.length === 0) {
      // If all items are invalid, cancel the order
      await Order.findByIdAndUpdate(
        order._id,
        { 
          $set: { 
            status: 'cancelled',
            items: []
          } 
        },
        { new: true }
      );
      
      console.log(`Cancelled empty order ${order._id} (all products were invalid)`);
      fixedCount++;
    }
  }
  
  console.log(`Fixed ${fixedCount} problematic orders`);
  return fixedCount;
};

// Run the comprehensive fix
comprehensiveFix(); 