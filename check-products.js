import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env') });

// Dynamically import the Product model
const importProductModel = async () => {
  try {
    // Create a dynamic import for the Product model
    const module = await import('./server/models/productModel.js');
    return module.default;
  } catch (err) {
    console.error('Error importing Product model:', err);
    process.exit(1);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function getOutOfStockProducts() {
  try {
    // Import the Product model
    const Product = await importProductModel();
    
    // Find products with zero stock overall or with zero stock in some sizes
    const products = await Product.find({
      $or: [
        { countInStock: 0 },
        { countInStock: { $gt: 0 } } // Include all products as we'll check sizeInventory
      ]
    });

    console.log('\n=== OUT OF STOCK PRODUCTS ===\n');
    
    let outOfStockProducts = [];
    let lowStockProducts = [];
    
    for (const product of products) {
      const sizes = product.sizes || [];
      const sizeInventory = product.sizeInventory || {};
      
      // Convert Map to object if needed
      const inventory = sizeInventory instanceof Map 
        ? Object.fromEntries(sizeInventory) 
        : sizeInventory;
      
      // Check if product has any sizes with zero stock
      const outOfStockSizes = [];
      const lowStockSizes = [];
      
      for (const size of sizes) {
        const stock = inventory[size] || 0;
        if (stock === 0) {
          outOfStockSizes.push(size);
        } else if (stock <= 5) {
          lowStockSizes.push(`${size} (${stock})`);
        }
      }
      
      // If all sizes are out of stock or there's no stock info
      if (outOfStockSizes.length === sizes.length || product.countInStock === 0) {
        outOfStockProducts.push({
          id: product._id,
          name: product.title || 'Product',
          brand: product.brand,
          category: product.category,
          price: product.price,
          allSizesOutOfStock: true
        });
      } 
      // If some sizes are out of stock
      else if (outOfStockSizes.length > 0) {
        outOfStockProducts.push({
          id: product._id,
          name: product.title || 'Product',
          brand: product.brand,
          category: product.category,
          price: product.price,
          outOfStockSizes
        });
      }
      
      // If product has low stock sizes
      if (lowStockSizes.length > 0 && outOfStockSizes.length < sizes.length) {
        lowStockProducts.push({
          id: product._id,
          name: product.title || 'Product',
          brand: product.brand,
          category: product.category,
          price: product.price,
          lowStockSizes
        });
      }
    }
    
    // Print completely out of stock products
    console.log('\n=== COMPLETELY OUT OF STOCK PRODUCTS ===\n');
    const completelyOutOfStock = outOfStockProducts.filter(p => p.allSizesOutOfStock);
    
    if (completelyOutOfStock.length === 0) {
      console.log('No products completely out of stock');
    } else {
      completelyOutOfStock.forEach(product => {
        console.log(`- ${product.name} (${product.brand}) - $${product.price} - ID: ${product.id}`);
      });
    }
    
    // Print partially out of stock products
    console.log('\n\n=== PARTIALLY OUT OF STOCK PRODUCTS ===\n');
    const partiallyOutOfStock = outOfStockProducts.filter(p => !p.allSizesOutOfStock);
    
    if (partiallyOutOfStock.length === 0) {
      console.log('No products with some sizes out of stock');
    } else {
      partiallyOutOfStock.forEach(product => {
        console.log(`- ${product.name} (${product.brand}) - $${product.price} - Out of stock sizes: ${product.outOfStockSizes.join(', ')}`);
      });
    }
    
    // Print low stock products
    console.log('\n\n=== LOW STOCK PRODUCTS (5 or fewer) ===\n');
    
    if (lowStockProducts.length === 0) {
      console.log('No products with low stock');
    } else {
      lowStockProducts.forEach(product => {
        console.log(`- ${product.name} (${product.brand}) - $${product.price} - Low stock sizes: ${product.lowStockSizes.join(', ')}`);
      });
    }
    
    console.log('\n=== SUMMARY ===\n');
    console.log(`Total products checked: ${products.length}`);
    console.log(`Products completely out of stock: ${completelyOutOfStock.length}`);
    console.log(`Products partially out of stock: ${partiallyOutOfStock.length}`);
    console.log(`Products with low stock: ${lowStockProducts.length}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error fetching out of stock products:', error);
    await mongoose.disconnect();
  }
}

getOutOfStockProducts();

// Simple script to analyze cart data from the browser's localStorage
// Run this in the browser console to check for out-of-stock products

// Function to analyze cart data
const analyzeCartData = () => {
  try {
    // Try to get cart data from localStorage
    const cartData = localStorage.getItem('guestCartItems');
    
    if (!cartData) {
      console.log('No cart data found in localStorage.');
      return;
    }
    
    const items = JSON.parse(cartData);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Cart is empty or data is invalid.');
      return;
    }
    
    console.log('\n=== CART ANALYSIS ===\n');
    console.log(`Total items in cart: ${items.length}`);
    
    // Look for items with potential stock issues
    const potentialStockIssues = items.filter(item => 
      !item.stock || item.stock <= 0 || item.quantity > item.stock
    );
    
    if (potentialStockIssues.length === 0) {
      console.log('\nNo items with potential stock issues found in cart.');
    } else {
      console.log(`\n${potentialStockIssues.length} items with potential stock issues found:`);
      
      potentialStockIssues.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.name || 'Unknown Product'}`);
        console.log(`   - Product ID: ${item._id || 'Unknown'}`);
        console.log(`   - Size: ${item.size || 'N/A'}`);
        console.log(`   - Quantity in cart: ${item.quantity}`);
        console.log(`   - Stock available: ${item.stock || 'Unknown'}`);
        console.log(`   - Image URL: ${item.image || 'No image'}`);
      });
    }
    
    // Show all cart items for reference
    console.log('\n=== ALL CART ITEMS ===\n');
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name || 'Unknown Product'} (Size: ${item.size || 'N/A'}) - Qty: ${item.quantity}`);
    });
    
  } catch (error) {
    console.error('Error analyzing cart data:', error);
  }
};

console.log(`
==================================================
OUT OF STOCK CHECKER
==================================================

This script allows you to check for potentially out-of-stock items
in your cart by analyzing localStorage cart data.

To run this script in your browser:

1. Open your browser's developer console (F12 or Ctrl+Shift+I)
2. Copy this entire script and paste it into the console
3. Press Enter to execute

The results will show cart items with potential stock issues.
==================================================
`);

// When running in Node, show instructions
// When running in browser, the script will execute
if (typeof window === 'undefined') {
  console.log('This script is meant to be run in a browser. Please copy the script and run it in your browser console.');
} else {
  analyzeCartData();
} 