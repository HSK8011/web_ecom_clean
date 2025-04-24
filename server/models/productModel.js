const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const discountSchema = mongoose.Schema(
  {
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    sizeInventory: {
      type: Map,
      of: Number,
      default: {},
    },
    sizes: [
      {
        type: String,
      },
    ],
    colors: [
      {
        type: String,
      },
    ],
    discount: discountSchema,
    featured: {
      type: Boolean,
      default: false,
    },
    isNew: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function () {
  if (this.discount && this.discount.isActive) {
    const now = new Date();
    const startDate = new Date(this.discount.startDate);
    const endDate = this.discount.endDate ? new Date(this.discount.endDate) : null;
    
    if (now >= startDate && (!endDate || now <= endDate)) {
      return Number((this.price * (1 - this.discount.percentage / 100)).toFixed(2));
    }
  }
  return this.price;
});

// Virtual property for 'name' that returns 'title' for frontend compatibility
productSchema.virtual('name').get(function() {
  return this.title;
});

// Virtual property setter for 'name' to update 'title'
productSchema.virtual('name').set(function(value) {
  this.title = value;
});

// Calculate total stock from sizeInventory
productSchema.pre('save', function(next) {
  if (this.sizeInventory) {
    // Convert Map to object if needed
    const inventory = this.sizeInventory instanceof Map 
      ? Object.fromEntries(this.sizeInventory) 
      : this.sizeInventory;
    
    // Calculate total stock
    this.countInStock = Object.values(inventory).reduce((sum, count) => sum + (count || 0), 0);
  }
  next();
});

// Set virtuals in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 