/**
 * Inventory Cache Utility
 * 
 * Provides caching functionality for product inventory to reduce database queries
 * and improve performance when checking stock levels.
 */

const NodeCache = require('node-cache');

// Get TTL from environment or use default (5 minutes)
const CACHE_TTL = parseInt(process.env.INVENTORY_CACHE_DURATION || '300000', 10) / 1000;

// Create cache instance
const inventoryCache = new NodeCache({
  stdTTL: CACHE_TTL,  // Standard TTL in seconds
  checkperiod: Math.min(CACHE_TTL / 2, 60), // Check for expired keys at half the TTL or 60 seconds max
  useClones: false // Store references to objects to allow direct updates
});

/**
 * Generate a cache key for a product + size combination
 * @param {string} productId - The product ID
 * @param {string} size - Optional size
 * @returns {string} The cache key
 */
const getCacheKey = (productId, size) => {
  return size ? `${productId}:${size}` : `${productId}`;
};

/**
 * Get cached inventory data for a product
 * @param {string} productId - The product ID
 * @param {string} size - Optional size
 * @returns {object|number|null} The cached inventory data or null if not found
 */
const getInventory = (productId, size) => {
  if (!productId) return null;
  
  // If specific size requested, try to get that first
  if (size) {
    const sizeKey = getCacheKey(productId, size);
    const sizeInventory = inventoryCache.get(sizeKey);
    if (sizeInventory !== undefined) {
      return sizeInventory;
    }
  }
  
  // Get entire product inventory
  const productKey = getCacheKey(productId);
  const productInventory = inventoryCache.get(productKey);
  
  if (productInventory === undefined) {
    return null;
  }
  
  // If size specified and product inventory has that size, return it
  if (size && productInventory.sizeInventory && productInventory.sizeInventory[size] !== undefined) {
    // Also cache this specific size for future requests
    setInventory(productId, size, productInventory.sizeInventory[size]);
    return productInventory.sizeInventory[size];
  }
  
  return productInventory;
};

/**
 * Set inventory data in cache
 * @param {string} productId - The product ID
 * @param {string} size - Optional size
 * @param {object|number} data - The inventory data to cache
 * @param {number} ttl - Optional override for TTL in seconds
 */
const setInventory = (productId, size, data, ttl = CACHE_TTL) => {
  if (!productId) return;
  
  if (size) {
    // Cache specific size inventory
    const sizeKey = getCacheKey(productId, size);
    inventoryCache.set(sizeKey, data, ttl);
  } else {
    // Cache entire product inventory
    const productKey = getCacheKey(productId);
    inventoryCache.set(productKey, data, ttl);
  }
};

/**
 * Clear inventory data from cache
 * @param {string} productId - Optional product ID to clear
 * @param {string} size - Optional size
 */
const clearInventory = (productId, size) => {
  if (!productId) {
    // Clear entire cache if no product specified
    inventoryCache.flushAll();
    return;
  }
  
  if (size) {
    // Clear specific size
    const sizeKey = getCacheKey(productId, size);
    inventoryCache.del(sizeKey);
  } else {
    // Clear all cached data for this product
    const productKey = getCacheKey(productId);
    inventoryCache.del(productKey);
    
    // Also clear any size-specific caches for this product
    const keys = inventoryCache.keys();
    const productSizeKeys = keys.filter(key => key.startsWith(`${productId}:`));
    inventoryCache.del(productSizeKeys);
  }
};

/**
 * Update inventory level after a change
 * @param {string} productId - The product ID
 * @param {string} size - The size
 * @param {number} change - The quantity change (negative for decrease)
 */
const updateInventoryLevel = (productId, size, change) => {
  if (!productId || !size) return;
  
  const sizeKey = getCacheKey(productId, size);
  const currentLevel = inventoryCache.get(sizeKey);
  
  if (currentLevel !== undefined && typeof currentLevel === 'number') {
    // Update the cached value directly
    const newLevel = Math.max(0, currentLevel + change);
    inventoryCache.set(sizeKey, newLevel);
    
    // Also update in the full product cache if it exists
    const productKey = getCacheKey(productId);
    const productInventory = inventoryCache.get(productKey);
    
    if (productInventory && productInventory.sizeInventory) {
      productInventory.sizeInventory[size] = newLevel;
      inventoryCache.set(productKey, productInventory);
    }
  }
};

module.exports = {
  getInventory,
  setInventory,
  clearInventory,
  updateInventoryLevel
}; 