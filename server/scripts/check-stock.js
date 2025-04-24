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

// Function to check inventory status
const checkInventoryStatus = async () => {
  try {
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`);
    
    const outOfStockProducts = [];
    const lowStockProducts = [];
    
    for (const product of products) {
      const productName = product.title || `Product ID: ${product._id}`;
      const sizes = product.sizes || [];
      const sizeInventory = product.sizeInventory || {};
      
      // Check if the product has zero total stock
      if (product.countInStock === 0) {
        outOfStockProducts.push({
          id: product._id,
          name: productName,
          brand: product.brand,
          price: product.price,
          reason: 'No stock available for any size'
        });
        continue;
      }
      
      // Check inventory for each size
      if (sizes.length > 0) {
        const outOfStockSizes = [];
        const lowStockSizes = [];
        
        sizes.forEach(size => {
          let stock = sizeInventory[size] || 0;
          
          // If size inventory is empty but countInStock is positive, distribute evenly
          if (stock === 0 && product.countInStock > 0) {
            // Distribute stock evenly among sizes
            stock = Math.floor(product.countInStock / sizes.length);
            if (stock === 0) stock = 1; // Ensure at least 1 item per size if any stock exists
          }
          
          if (stock === 0) {
            outOfStockSizes.push(size);
          } else if (stock <= 5) {
            lowStockSizes.push(`${size} (${stock})`);
          }
        });
        
        // If all sizes are out of stock
        if (outOfStockSizes.length === sizes.length) {
          outOfStockProducts.push({
            id: product._id,
            name: productName,
            brand: product.brand,
            price: product.price,
            reason: 'All sizes out of stock'
          });
        } 
        // If some sizes are out of stock
        else if (outOfStockSizes.length > 0) {
          outOfStockProducts.push({
            id: product._id,
            name: productName,
            brand: product.brand,
            price: product.price,
            reason: `Some sizes out of stock: ${outOfStockSizes.join(', ')}`
          });
        }
        
        // If some sizes have low stock
        if (lowStockSizes.length > 0) {
          lowStockProducts.push({
            id: product._id,
            name: productName,
            brand: product.brand,
            price: product.price,
            reason: `Low stock for sizes: ${lowStockSizes.join(', ')}`
          });
        }
      }
    }
    
    // Display the results
    console.log('\n=== OUT OF STOCK PRODUCTS ===');
    
    if (outOfStockProducts.length === 0) {
      console.log('No out-of-stock products found.');
    } else {
      console.log(`Found ${outOfStockProducts.length} out-of-stock products:`);
      
      outOfStockProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name} (${product.brand}) - $${product.price}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Reason: ${product.reason}`);
      });
    }
    
    console.log('\n=== LOW STOCK PRODUCTS ===');
    
    if (lowStockProducts.length === 0) {
      console.log('No low-stock products found.');
    } else {
      console.log(`Found ${lowStockProducts.length} low-stock products:`);
      
      lowStockProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name} (${product.brand}) - $${product.price}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Status: ${product.reason}`);
      });
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total products: ${products.length}`);
    console.log(`Out of stock products: ${outOfStockProducts.length}`);
    console.log(`Low stock products: ${lowStockProducts.length}`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error checking inventory:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the check function
checkInventoryStatus(); 