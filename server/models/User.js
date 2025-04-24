const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true,
    required: false,
    default: ''
  },
  address: {
    street: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    zipCode: {
      type: String,
      trim: true,
      default: ''
    },
    country: {
      type: String,
      trim: true,
      default: ''
    }
  },
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true, // This automatically adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for isAdmin
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!candidatePassword) {
      console.error('No password provided for comparison');
      return false;
    }
    
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password comparison details:', {
      result,
      passwordLength: candidatePassword.length,
      hashedPasswordLength: this.password.length
    });
    return result;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};

// Add matchPassword as an alias for comparePassword for backward compatibility
userSchema.methods.matchPassword = userSchema.methods.comparePassword;

// Add a method to ensure address object is complete
userSchema.methods.ensureCompleteAddress = function() {
  if (!this.address) {
    this.address = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };
  } else {
    this.address.street = this.address.street || '';
    this.address.city = this.address.city || '';
    this.address.state = this.address.state || '';
    this.address.zipCode = this.address.zipCode || '';
    this.address.country = this.address.country || '';
  }
  return this.address;
};

const User = mongoose.model('User', userSchema);
module.exports = User; 