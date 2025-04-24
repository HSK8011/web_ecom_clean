const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Cart = require('../models/Cart');
const Product = require('../models/Product');
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

// Script to clean up carts with missing products
const cleanupCarts = async () => {
  try {
    // Find all carts
    const carts = await Cart.find({});
    console.log(`Found ${carts.length} carts to check for missing products`);
    
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
    mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error cleaning up carts:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
cleanupCarts(); 