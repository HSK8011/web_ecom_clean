const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const Product = require('../models/Product');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    console.log('Order creation request body:', JSON.stringify(req.body, null, 2));
    const {
      items,
      orderItems, // Support for alternative format
      totalAmount,
      totalPrice, // Support for alternative format
      shippingAddress,
      paymentMethod,
      isPaid,
      paidAt,
      paymentResult,
      taxPrice,
      shippingPrice,
      itemsPrice
    } = req.body;

    // Use orderItems if items is not provided
    const orderItemsToUse = orderItems || items || [];
    
    if (orderItemsToUse.length === 0) {
      return res.status(400).json({ error: 'No order items provided' });
    }

    console.log('Order items before processing:', JSON.stringify(orderItemsToUse, null, 2));
    
    // Process and validate order items
    const processedItems = [];
    
    // Check stock and update inventory for each item
    for (const item of orderItemsToUse) {
      // Extract product ID properly from all possible structures
      const productId = typeof item.product === 'object' 
        ? item.product._id 
        : item.product;
        
      if (!productId) {
        console.error('Invalid item missing product ID:', item);
        return res.status(400).json({ error: 'One or more items have invalid product ID' });
      }
      
      try {
        console.log(`Finding product with ID: ${productId}`);
        const product = await Product.findById(productId);
        
        if (!product) {
          console.error(`Product not found with ID: ${productId}`);
          return res.status(404).json({ error: `Product ${productId} not found` });
        }
        
        // Get the quantity from the item
        const quantity = item.quantity || item.qty || 1;
        
        // Check if we have enough stock
        if (product.countInStock < quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${product.title || product.name}. Available: ${product.countInStock}` 
          });
        }
        
        // If product has size-specific inventory
        if (product.sizeInventory && item.size) {
          // Convert from Map to object if needed
          const inventory = product.sizeInventory instanceof Map 
            ? Object.fromEntries(product.sizeInventory) 
            : product.sizeInventory;
          
          const currentSizeStock = inventory[item.size] || 0;
          
          // Check size-specific inventory
          if (currentSizeStock < quantity) {
            return res.status(400).json({ 
              error: `Insufficient stock for product in size ${item.size}. Available: ${currentSizeStock}` 
            });
          }
          
          // Update the stock for this size
          inventory[item.size] = currentSizeStock - quantity;
          product.sizeInventory = inventory;
        } else {
          // Update total stock if no size inventory
          product.countInStock -= quantity;
        }
        
        // Add validated item to processed items list
        processedItems.push({
          product: productId,
          name: product.name || product.title || item.name || 'Product',
          quantity: quantity,
          price: item.price || product.price,
          size: item.size || '',
          color: item.color || '',
          image: item.image || (product.images && product.images.length > 0 ? product.images[0] : product.image) || ''
        });
        
        // Save the updated product inventory
        await product.save();
      } catch (productError) {
        console.error('Error with product:', productError.message);
        // If in development, still allow the order to be created
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ error: 'Error updating product inventory' });
        }
      }
    }

    // Create order with processed items
    const orderData = {
      user: req.user.id,
      items: processedItems,
      totalAmount: totalAmount || totalPrice || 0,
      shippingAddress,
      paymentMethod,
      isPaid: isPaid || false,
      paidAt: paidAt || null,
      paymentResult: paymentResult || null
    };

    if (taxPrice) orderData.taxPrice = taxPrice;
    if (shippingPrice) orderData.shippingPrice = shippingPrice;
    if (itemsPrice) orderData.itemsPrice = itemsPrice;

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
    const order = new Order(orderData);

    const savedOrder = await order.save();
    console.log('Order created successfully:', savedOrder._id);
    
    // Add order to user profile
    let userProfile = await UserProfile.findOne({ user: req.user.id });
    if (!userProfile) {
      const user = await User.findById(req.user.id).select('-password');
      userProfile = new UserProfile({
        user: req.user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      });
    }

    // Add order to profile
    userProfile.orders.push({
      orderId: savedOrder._id,
      items: savedOrder.items.map(item => ({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: savedOrder.totalAmount,
      status: savedOrder.status,
      orderDate: savedOrder.createdAt
    });

    // Update order summary
    userProfile.updateOrderSummary();
    await userProfile.save();
    
    // Populate product details for response
    await savedOrder.populate('items.product', 'name image');
    
    res.json(savedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/orders
// @desc    Get all orders for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image');
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get all orders for the logged-in user
// @access  Private
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image');
    
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if the order belongs to the logged-in user
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if the order belongs to the logged-in user
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    order.status = status;
    await order.save();

    // Update order status in user profile
    const userProfile = await UserProfile.findOne({ user: req.user.id });
    if (userProfile) {
      const profileOrder = userProfile.orders.find(
        o => o.orderId.toString() === order._id.toString()
      );
      if (profileOrder) {
        profileOrder.status = status;
        userProfile.updateOrderSummary();
        await userProfile.save();
      }
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/orders/:id/pay
// @desc    Update order to paid
// @access  Private
router.put('/:id/pay', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate payment result
    const { paymentResult } = req.body;
    if (!paymentResult) {
      return res.status(400).json({ error: 'Payment result is required' });
    }

    // Update order payment status
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'completed';
    order.paymentResult = paymentResult;

    const updatedOrder = await order.save();
    
    // Update order status in user profile
    const userProfile = await UserProfile.findOne({ user: req.user.id });
    if (userProfile) {
      const profileOrder = userProfile.orders.find(
        o => o.orderId.toString() === order._id.toString()
      );
      if (profileOrder) {
        userProfile.updateOrderSummary();
        await userProfile.save();
      }
    }

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/orders/admin/metrics
// @desc    Get admin dashboard metrics
// @access  Private/Admin
router.get('/admin/metrics', auth, async (req, res) => {
  try {
    console.log('Admin metrics request from user:', req.user._id, req.user.name, req.user.role);
    
    // Check if user is admin
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      console.log('Access denied: User is not admin. Role:', req.user.role, 'isAdmin:', req.user.isAdmin);
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    // Get current date
    const currentDate = new Date();
    
    // Get start of current month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get start of previous month
    const startOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    // Get start of current year
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Total orders count
    const totalOrders = await Order.countDocuments();
    
    // Orders this month
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    // Orders previous month
    const ordersPrevMonth = await Order.countDocuments({
      createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth }
    });
    
    // Get total customers count
    const totalCustomers = await User.countDocuments({ role: 'user' });
    
    // Get total users count (including admins)
    const totalUsers = await User.countDocuments();
    
    // Get new customers this month
    const newCustomersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfMonth }
    });

    // Get new customers previous month
    const newCustomersPrevMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth }
    });
    
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
    
    // Revenue previous month
    const revenuePrevMonthResult = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const revenuePrevMonth = revenuePrevMonthResult.length > 0 ? revenuePrevMonthResult[0].total : 0;
    
    // Get in-stock product count
    const products = await Product.find();
    const inStockProducts = products.filter(p => p.countInStock > 0).length;
    const outOfStockProducts = products.length - inStockProducts;
    const lowStockProducts = products.filter(p => p.countInStock > 0 && p.countInStock < 10).length;
    
    // Recent orders (last 10)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('user totalAmount status createdAt')
      .populate('user', 'name email');
    
    // Monthly revenue for the year (for chart)
    const monthlyRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfYear } 
        } 
      },
      {
        $group: {
          _id: { 
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format monthly revenue for chart
    const monthlyRevenueFormatted = Array(12).fill(0);
    monthlyRevenue.forEach(item => {
      const monthIndex = item._id.month - 1;
      monthlyRevenueFormatted[monthIndex] = item.revenue;
    });
    
    // Return metrics
    const response = {
      counts: {
        totalOrders,
        ordersThisMonth,
        ordersPrevMonth,
        monthOverMonthOrderGrowth: ordersThisMonth - ordersPrevMonth,
        totalCustomers,
        totalUsers,
        newCustomersThisMonth,
        newCustomersPrevMonth,
        monthOverMonthCustomerGrowth: newCustomersThisMonth - newCustomersPrevMonth
      },
      products: {
        totalProducts: products.length,
        inStockProducts,
        outOfStockProducts,
        lowStockProducts
      },
      revenue: {
        totalRevenue,
        revenueThisMonth,
        revenuePrevMonth,
        monthOverMonthRevenueGrowth: revenueThisMonth - revenuePrevMonth
      },
      recentOrders,
      chart: {
        monthlyRevenue: monthlyRevenueFormatted
      }
    };
    
    console.log('Sending admin metrics response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    console.error('Error fetching admin metrics:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 