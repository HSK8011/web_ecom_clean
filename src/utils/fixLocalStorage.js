/**
 * Utility function to clean up problematic products from local storage
 * Can be run in the browser console to fix cart issues
 */

// List of known problematic product IDs
const PROBLEM_PRODUCT_IDS = [
  '67fb9d4ffb4b27d37eb60021',
  '67fbb1031cac97aca2f71202'
];

export const cleanupLocalStorage = () => {
  console.log('Cleaning up local storage...');
  
  // Check for guest cart items
  const guestCartItems = localStorage.getItem('guestCartItems');
  if (guestCartItems) {
    try {
      const items = JSON.parse(guestCartItems);
      console.log(`Found ${items.length} items in guest cart`);
      
      // Filter out problematic items
      const validItems = items.filter(item => {
        const productId = item._id || item.productId;
        return !productId || !PROBLEM_PRODUCT_IDS.includes(productId.toString());
      });
      
      console.log(`Removed ${items.length - validItems.length} problematic items`);
      
      // Save back to local storage
      localStorage.setItem('guestCartItems', JSON.stringify(validItems));
      console.log('Guest cart updated successfully');
    } catch (error) {
      console.error('Error processing guest cart:', error);
    }
  }
  
  // Check for other storage items that might reference the problematic products
  const mockOrders = localStorage.getItem('mockOrders');
  if (mockOrders) {
    try {
      const orders = JSON.parse(mockOrders);
      
      // Process each order
      const validOrders = orders.map(order => {
        // Filter out problematic items from each order
        if (order.orderItems) {
          order.orderItems = order.orderItems.filter(item => {
            const productId = item.product;
            return !productId || !PROBLEM_PRODUCT_IDS.includes(productId.toString());
          });
        }
        
        if (order.items) {
          order.items = order.items.filter(item => {
            const productId = item.product;
            return !productId || !PROBLEM_PRODUCT_IDS.includes(productId.toString());
          });
        }
        
        return order;
      });
      
      // Save back to local storage
      localStorage.setItem('mockOrders', JSON.stringify(validOrders));
      console.log('Mock orders updated successfully');
    } catch (error) {
      console.error('Error processing mock orders:', error);
    }
  }
  
  console.log('Local storage cleanup completed');
  return true;
};

// This will be available as a global function in the browser
export const fixCart = () => {
  cleanupLocalStorage();
  
  // Force reload the cart from scratch
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

// Add a small script to be pasted in the browser console
const consoleScript = `
function fixMyCart() {
  // Clear specific problematic items
  const problemIds = ['67fb9d4ffb4b27d37eb60021', '67fbb1031cac97aca2f71202'];
  
  // Guest cart cleanup
  const guestCart = localStorage.getItem('guestCartItems');
  if (guestCart) {
    try {
      const items = JSON.parse(guestCart);
      const validItems = items.filter(item => {
        const productId = item._id || item.productId;
        return !productId || !problemIds.includes(productId.toString());
      });
      localStorage.setItem('guestCartItems', JSON.stringify(validItems));
    } catch (e) {
      console.error('Error fixing cart:', e);
    }
  }
  
  // Force reload
  window.location.reload();
  return "Fixing cart...";
}

// Run this function to fix your cart
fixMyCart();
`;

console.log('To fix cart issues directly in browser, run this in your browser console:');
console.log(consoleScript); 