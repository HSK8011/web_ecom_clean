/**
 * Product Model
 * 
 * This file re-exports the complete Product model from productModel.js.
 * It ensures that any code importing from Product.js gets the full schema.
 * 
 * IMPORTANT: For direct access to all schema features, import from productModel.js.
 * This file exists for backward compatibility and simplified imports.
 */

// Import the complete model with all schema properties and methods
const Product = require('./productModel');

// Export it directly to maintain all schema properties and virtuals
module.exports = Product; 