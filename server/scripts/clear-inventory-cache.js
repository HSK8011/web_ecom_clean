#!/usr/bin/env node

/**
 * Inventory Cache Clearing Tool
 * 
 * This script allows administrators to clear the inventory cache manually.
 * It can clear the entire cache or specific product/size caches.
 * 
 * Usage:
 *   - Clear all: npm run cache-clear
 *   - Clear specific product: npm run cache-clear -- --product=productId
 *   - Clear specific size: npm run cache-clear -- --product=productId --size=S
 */

require('dotenv').config();
const { clearInventory } = require('../utils/inventoryCache');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value || true;
  }
});

console.log('🧹 Inventory Cache Clearing Tool');
console.log('--------------------------------');

// Clear cache based on provided options
if (options.product) {
  if (options.size) {
    console.log(`Clearing cache for product ${options.product}, size ${options.size}...`);
    clearInventory(options.product, options.size);
    console.log(`✅ Cache cleared for product ${options.product}, size ${options.size}`);
  } else {
    console.log(`Clearing all cache for product ${options.product}...`);
    clearInventory(options.product);
    console.log(`✅ Cache cleared for product ${options.product}`);
  }
} else {
  console.log('Clearing all inventory cache...');
  clearInventory();
  console.log('✅ All inventory cache cleared');
}

console.log('\n👉 Cache cleared successfully. Inventory data will be refreshed on next request.'); 