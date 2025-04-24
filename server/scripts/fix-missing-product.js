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

// Specific ID of the problem product
const PROBLEM_PRODUCT_ID = '67fb9d4ffb4b27d37eb60021';

// Fix function to remove the problematic product from all carts
const fixMissingProduct = async () => {
  try {
    console.log(`FIXING MISSING PRODUCT: ${PROBLEM_PRODUCT_ID}`);
    
    // 1. Fix all carts containing the problematic product
    const carts = await Cart.find({
      'items.product': PROBLEM_PRODUCT_ID
    });
    
    console.log(`Found ${carts.length} carts with the problematic product`);
    
    for (const cart of carts) {
      // Get original items count
      const originalCount = cart.items.length;
      
      // Filter out the problem product
      const validItems = cart.items.filter(
        item => !item.product || item.product.toString() !== PROBLEM_PRODUCT_ID
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
    
    // 2. Fix all pending orders containing the problematic product
    const pendingOrders = await Order.find({
      'items.product': PROBLEM_PRODUCT_ID
    });
    
    console.log(`Found ${pendingOrders.length} orders with the problematic product`);
    
    for (const order of pendingOrders) {
      // Get original items count
      const originalCount = order.items.length;
      
      // Filter out the problem product
      const validItems = order.items.filter(
        item => !item.product || item.product.toString() !== PROBLEM_PRODUCT_ID
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
    
    // 3. Update inventory for all remaining products
    await updateProductInventory();
    
    console.log('Fix completed successfully!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing missing product:', error);
    mongoose.disconnect();
    process.exit(1);
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
fixMissingProduct(); 