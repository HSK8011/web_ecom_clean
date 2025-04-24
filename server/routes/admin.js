const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const UserProfile = require('../models/UserProfile');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data (combined metrics)
// @access  Private/Admin
router.get('/dashboard', auth, isAdmin, async (req, res) => {
  try {
    console.log('Admin dashboard request from:', req.user.name);

    // Get current date
    const currentDate = new Date();
    
    // Get start of current month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get start of previous month
    const startOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    // ----- ORDERS METRICS -----
    // Total orders count
    const totalOrders = await Order.countDocuments();
    
    // Orders this month
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    // Orders previous month (will be included in metrics response)
    const ordersPrevMonth = await Order.countDocuments({
      createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth }
    });
    
    // ----- USERS METRICS -----
    // Get total customers count
    const totalCustomers = await User.countDocuments({ role: 'user' });
    
    // Get total users count (including admins)
    const totalUsers = await User.countDocuments();
    
    // Get new customers this month
    const newCustomersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfMonth }
    });

    // ----- REVENUE METRICS -----
    // Total revenue (all time)
    const totalRevenueResult = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
    
    // Revenue this month
    const revenueThisMonthResult = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const revenueThisMonth = revenueThisMonthResult.length > 0 ? revenueThisMonthResult[0].total : 0;
    
    // ----- PRODUCT METRICS -----
    // Get all products
    const products = await Product.find().select('name price countInStock');
    
    // Calculate product statistics
    const inStockProducts = products.filter(p => p.countInStock > 0).length;
    const outOfStockProducts = products.length - inStockProducts;
    const lowStockProducts = products.filter(p => p.countInStock > 0 && p.countInStock < 10).length;
    
    // ----- RECENT ORDERS -----
    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id user totalAmount totalPrice status createdAt')
      .populate('user', 'name email');
    
    // Return the combined dashboard data
    const dashboardData = {
      metrics: {
        counts: {
          totalOrders,
          ordersThisMonth,
          ordersPrevMonth, // Include previous month orders in the response
          totalCustomers,
          totalUsers,
          newCustomersThisMonth
        },
        products: {
          totalProducts: products.length,
          inStockProducts,
          outOfStockProducts,
          lowStockProducts
        },
        revenue: {
          totalRevenue,
          revenueThisMonth
        }
      },
      recentOrders
    };
    
    res.json(dashboardData);
  } catch (err) {
    console.error('Error fetching admin dashboard data:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route   GET /api/admin/orders/:id
// @desc    Get order by ID (admin view)
// @access  Private/Admin
router.get('/orders/:id', auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images price');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders with optional pagination and filtering
// @access  Private/Admin
router.get('/orders', auth, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    
    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');
    
    // Get total count
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status (admin)
// @access  Private/Admin
router.put('/orders/:id/status', auth, isAdmin, async (req, res) => {
  try {
    console.log('Admin updating order status:', req.params.id);
    console.log('Request body:', req.body);
    
    const { status, trackingNumber, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Convert status to lowercase to match the enum in the model
    order.status = status.toLowerCase();
    
    // Optional fields
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    if (notes) {
      order.notes = notes;
    }
    
    // Save the changes
    const updatedOrder = await order.save();
    
    // UPDATE THE USER PROFILE ORDER STATUS (this was missing)
    if (order.user) {
      const userProfile = await UserProfile.findOne({ user: order.user });
      if (userProfile) {
        // Find the corresponding order in the profile
        const profileOrder = userProfile.orders.find(
          o => o.orderId.toString() === order._id.toString()
        );
        if (profileOrder) {
          // Update the status
          profileOrder.status = status.toLowerCase();
          // Update the order summary totals
          userProfile.updateOrderSummary();
          await userProfile.save();
          console.log('User profile order updated successfully');
        }
      }
    }
    
    // Populate user and product details for response
    await updatedOrder.populate('user', 'name email');
    await updatedOrder.populate('items.product', 'name images price');
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 