const mongoose = require('mongoose');
const getOrCreateModel = require('../utils/preventModelConflict');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  oldPrice: {
    type: Number,
    min: 0
  },
  brand: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Casual', 'Formal', 'Party', 'Gym']
  },
  image: {
    type: String,
    required: true
  },
  countInStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sizeInventory: {
    type: Map,
    of: Number,
    default: {}
  },
  sizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  }],
  colors: [{
    type: String,
    trim: true
  }],
  discount: {
    isActive: {
      type: Boolean,
      default: false
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    comment: {
      type: String,
      required: true
    }
  }],
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add text index for search functionality
productSchema.index({ name: 'text', description: 'text' });

// Use getOrCreateModel to prevent conflicts
module.exports = getOrCreateModel('Product', productSchema); 