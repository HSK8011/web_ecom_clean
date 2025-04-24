/**
 * User model wrapper
 * This file ensures compatibility between ES modules frontend code and CommonJS server code
 * It references the same MongoDB 'User' collection as the server model
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Create a schema that references the same collection as server/models/User.js
// We define the essential fields and methods to ensure compatibility
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  avatar: { type: String, default: '' }
}, {
  timestamps: true,
  // Allow other fields from the server model to exist without validation errors
  strict: false,
  // Enable virtuals
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for isAdmin
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// Password comparison method (same as server model)
userSchema.methods.matchPassword = userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Use the same model name 'User' to ensure we access the same MongoDB collection
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 