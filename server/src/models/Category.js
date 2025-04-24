const mongoose = require('mongoose');

// Drop existing indexes
mongoose.connection.on('connected', async () => {
  try {
    await mongoose.connection.db.collection('categories').dropIndexes();
  } catch (error) {
    console.log('No indexes to drop');
  }
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to ensure slug is created from name
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
  }
  next();
});

// Create new indexes after schema is defined
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ slug: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category; 