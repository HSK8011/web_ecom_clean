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