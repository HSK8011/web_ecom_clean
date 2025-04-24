/**
 * Utility functions for handling product data consistently across the application
 */

/**
 * Gets the display name of a product, handling inconsistencies between title and name fields
 * @param {Object} product - The product object
 * @returns {String} The product name for display
 */
export const getProductDisplayName = (product) => {
  if (!product) return '';
  return product.title || product.name || 'Unnamed Product';
};

/**
 * Normalizes a product object to have consistent naming properties
 * @param {Object} product - The product object to normalize
 * @returns {Object} A new product object with consistent properties
 */
export const normalizeProduct = (product) => {
  if (!product) return {};
  
  // Create a copy to avoid modifying the original
  const normalizedProduct = { ...product };
  
  // Ensure both title and name are set
  if (normalizedProduct.title && !normalizedProduct.name) {
    normalizedProduct.name = normalizedProduct.title;
  } else if (normalizedProduct.name && !normalizedProduct.title) {
    normalizedProduct.title = normalizedProduct.name;
  }
  
  return normalizedProduct;
}; 