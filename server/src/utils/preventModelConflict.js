/**
 * Utility to prevent Mongoose model overwrite errors
 * This is used to safely define models that might be defined elsewhere
 */
const mongoose = require('mongoose');

/**
 * Get a model by name, creating it if it doesn't exist
 * @param {string} modelName - Name of the model
 * @param {mongoose.Schema} schema - Schema for the model (only used if model doesn't exist)
 * @returns {mongoose.Model} The mongoose model
 */
function getOrCreateModel(modelName, schema) {
  try {
    // Try to get the existing model
    return mongoose.model(modelName);
  } catch (error) {
    // If model doesn't exist, create it
    return mongoose.model(modelName, schema);
  }
}

module.exports = getOrCreateModel; 