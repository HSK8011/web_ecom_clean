const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// @route   GET /api/users/profile
// @desc    Get user profile with order summary
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    // Find user 
    const user = await User.findById(req.user._id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure complete user data with proper address format
    const formattedUser = {
      ...user.toObject(),
      phone: user.phone || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || '',
      }
    };

    // Get order information if available
    let orderSummary = {
      totalOrders: 0,
      totalSpent: 0
    };
    
    let recentOrders = [];
    
    // Check if UserProfile exists for order data
    const userProfile = await UserProfile.findOne({ user: req.user._id })
      .populate({
        path: 'orders.orderId',
        select: 'orderNumber status createdAt totalPrice'
      })
      .populate({
        path: 'orders.items.product',
        select: 'name price images'
      })
      .lean();
    
    if (userProfile) {
      orderSummary = userProfile.orderSummary || orderSummary;
      recentOrders = userProfile.orders
        ? userProfile.orders
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, 5)
        : [];
    }

    res.json({
      user: formattedUser,
      recentOrders,
      orderSummary
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('phone').optional().trim(),
    // Address validation
    check('address').optional().isObject(),
    check('address.street').optional().trim(),
    check('address.city').optional().trim(),
    check('address.state').optional().trim(),
    check('address.zipCode').optional().trim(),
    check('address.country').optional().trim(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  console.log('==== SERVER: Profile Update Request ====');
  console.log('Request body (raw):', req.body);
  console.log('Request body (stringified):', JSON.stringify(req.body, null, 2));

  const {
    name,
    email,
    phone,
    address
  } = req.body;
  
  // Detailed logging of specific fields
  console.log('Phone field (raw):', phone);
  console.log('Phone field type:', typeof phone);
  console.log('Address field (raw):', address);
  console.log('Address field (stringified):', JSON.stringify(address, null, 2));

  try {
    // Check if email is already in use by another user
    const emailUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (emailUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Get current user to have access to current values
    const currentUser = await User.findById(req.user._id).select('-password');
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log current values
    console.log('Current user phone:', currentUser.phone);
    console.log('Current user address:', JSON.stringify(currentUser.address, null, 2));

    // Update user with atomic operation - more efficient for MongoDB
    const phoneToUse = phone !== undefined ? phone : (currentUser.phone || '');
    const addressToUse = address ? {
      street: address.street !== undefined ? address.street : (currentUser.address?.street || ''),
      city: address.city !== undefined ? address.city : (currentUser.address?.city || ''),
      state: address.state !== undefined ? address.state : (currentUser.address?.state || ''),
      zipCode: address.zipCode !== undefined ? address.zipCode : (currentUser.address?.zipCode || ''),
      country: address.country !== undefined ? address.country : (currentUser.address?.country || '')
    } : currentUser.address || {};

    // Log what will be updated
    console.log('Will update phone with:', phoneToUse);
    console.log('Will update address with:', JSON.stringify(addressToUse, null, 2));

    // Update user with atomic operation - direct field assignment
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          name, 
          email,
          phone: phoneToUse,
          address: addressToUse  // Set the whole address object directly
        } 
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Log updated user
    console.log('Updated user phone:', user.phone);
    console.log('Updated user address:', JSON.stringify(user.address, null, 2));

    // Update user profile with ALL user information if it exists
    if (await UserProfile.exists({ user: req.user._id })) {
      await UserProfile.updateOne(
        { user: req.user._id },
        { 
          $set: { 
            name, 
            email,
            phone: phoneToUse,
            address: addressToUse
          } 
        }
      );
    }
    
    // Get order information for response
    let orderSummary = {
      totalOrders: 0,
      totalSpent: 0
    };
    
    let recentOrders = [];
    
    // Check if UserProfile exists for order data - using projection for better performance
    const userProfile = await UserProfile.findOne(
      { user: req.user._id },
      { orders: { $slice: 5 }, orderSummary: 1 }
    )
      .populate({
        path: 'orders.orderId',
        select: 'orderNumber status createdAt totalPrice'
      })
      .populate({
        path: 'orders.items.product',
        select: 'name price images'
      })
      .lean();
    
    if (userProfile) {
      orderSummary = userProfile.orderSummary || orderSummary;
      recentOrders = userProfile.orders || [];
    }

    // Format user data for consistent response
    // Ensure all properties are properly returned
    const formattedUser = {
      ...user.toObject(),
      phone: user.phone || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || ''
      }
    };
    
    // Log the response being sent back
    console.log('==== SERVER: Sending Response ====');
    console.log('Response phone field:', formattedUser.phone);
    console.log('Response address fields:', JSON.stringify(formattedUser.address, null, 2));
    console.log('Full response:', JSON.stringify({
      user: formattedUser,
      recentOrders,
      orderSummary
    }, null, 2));

    res.json({
      user: formattedUser,
      recentOrders,
      orderSummary
    });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/profile/orders
// @desc    Add a new order to user profile
// @access  Private
router.post('/profile/orders', auth, async (req, res) => {
  try {
    const { orderId, items, totalAmount, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Check if order exists
    const orderExists = await Order.exists({ _id: orderId });
    if (!orderExists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const newOrder = {
      orderId,
      items: items.map(item => ({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount,
      status,
      orderDate: new Date()
    };

    // Get the full user data to ensure we have all fields
    const currentUser = await User.findById(req.user._id).select('-password');
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use findOneAndUpdate with upsert for atomic operation
    const userProfile = await UserProfile.findOneAndUpdate(
      { user: req.user._id },
      { 
        $push: { orders: newOrder },
        $setOnInsert: {
          user: req.user._id,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '',
          address: {
            street: currentUser.address?.street || '',
            city: currentUser.address?.city || '',
            state: currentUser.address?.state || '',
            zipCode: currentUser.address?.zipCode || '',
            country: currentUser.address?.country || ''
          },
          createdAt: currentUser.createdAt
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    // Update order summary
    await userProfile.updateOrderSummary();
    await userProfile.save();

    res.json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/admin/all
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    const searchRegex = new RegExp(search, 'i');
    const query = search 
      ? {
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } }
          ]
        } 
      : {};
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 