const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Basic info (synced with registration)
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Additional profile info
  phone: {
    type: String,
    default: ''
  },
  address: {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    zipCode: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    }
  },
  // Order history
  orders: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      name: String,
      quantity: Number,
      price: Number
    }],
    totalAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    orderDate: {
      type: Date,
      default: Date.now
    }
  }],
  orderSummary: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Create or update order summary
userProfileSchema.methods.updateOrderSummary = function() {
  const completedOrders = this.orders.filter(order => 
    order.status === 'delivered' || order.status === 'shipped'
  );
  
  this.orderSummary = {
    totalOrders: completedOrders.length,
    totalSpent: completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  };
};

module.exports = mongoose.model('UserProfile', userProfileSchema); 