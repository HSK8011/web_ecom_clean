const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
require('dotenv').config(); // Ensure dotenv is loaded

// Initialize Stripe with provided key
console.log('----------------------');
console.log('Setting up Stripe API');
console.log('----------------------');

// Use environment variable for Stripe key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'REPLACE_WITH_YOUR_KEY'; // Never hardcode API keys
console.log('Using Stripe key starting with:', STRIPE_SECRET_KEY.substring(0, 7) + '...');

// Initialize with the provided key
const stripe = require('stripe')(STRIPE_SECRET_KEY);
console.log('Stripe initialized with provided key');

const Order = require('../models/Order');
const Product = require('../models/Product');

// Process direct payment without requiring an existing order
router.post('/direct-payment', auth, async (req, res) => {
  try {
    console.log('Direct payment request received');
    const { amount, token } = req.body;
    
    // Basic validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }
    
    if (!token) {
      return res.status(400).json({ error: 'Payment token is required' });
    }
    
    console.log('Creating payment with amount:', amount);
    
    try {
      // Create a Payment Intent using the token
      console.log('Creating payment intent with token...');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Already in cents
        currency: 'usd',
        payment_method_types: ['card'],
        payment_method_data: {
          type: 'card',
          card: {
            token: token
          }
        },
        confirm: true, // Confirm the payment immediately
        return_url: process.env.FRONTEND_URL || 'http://localhost:5173',
        metadata: {
          userId: req.user._id.toString()
        }
      });
      
      console.log('Payment intent status:', paymentIntent.status);
      
      // Check payment status
      if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded!');
        res.json({ 
          success: true, 
          paymentIntentId: paymentIntent.id,
          message: 'Payment processed successfully!' 
        });
      } else if (paymentIntent.status === 'requires_action') {
        // 3D Secure or other authentication is required
        console.log('Payment requires additional action');
        res.json({
          success: false,
          requires_action: true,
          payment_intent_client_secret: paymentIntent.client_secret,
          next_action: paymentIntent.next_action,
          message: 'Additional authentication required'
        });
      } else {
        console.log('Payment failed with status:', paymentIntent.status);
        res.status(400).json({ 
          success: false,
          error: 'Payment processing failed', 
          status: paymentIntent.status 
        });
      }
    } catch (stripeError) {
      // Handle specific Stripe errors
      console.error('Stripe error:', stripeError.message);
      console.error('Stripe error type:', stripeError.type);
      
      return res.status(400).json({ 
        error: stripeError.message || 'Payment processing failed',
        code: stripeError.code || 'unknown_error',
        type: stripeError.type || 'unknown_type'
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to process payment', message: error.message });
  }
});

// Process direct payment without requiring authentication (for guest checkout)
router.post('/direct-payment-guest', async (req, res) => {
  try {
    console.log('Guest direct payment request received');
    const { amount, token } = req.body;
    
    // Log request data for debugging
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Basic validation
    if (!amount || amount <= 0) {
      console.error('Invalid payment amount:', amount);
      return res.status(400).json({ error: 'Invalid payment amount' });
    }
    
    if (!token) {
      console.error('Missing payment token');
      return res.status(400).json({ error: 'Payment token is required' });
    }
    
    console.log('Creating guest payment with amount:', amount);
    
    // Simplified payment processing with better error handling
    try {
      console.log('Creating payment intent with token:', token);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Already in cents
        currency: 'usd',
        payment_method_types: ['card'],
        payment_method_data: {
          type: 'card',
          card: {
            token: token
          }
        },
        confirm: true, // Confirm the payment immediately
        return_url: process.env.FRONTEND_URL || 'http://localhost:5173',
      });
      
      console.log('Guest payment intent created with ID:', paymentIntent.id);
      console.log('Guest payment intent status:', paymentIntent.status);
      
      // Check payment status
      if (paymentIntent.status === 'succeeded') {
        console.log('Guest payment succeeded!');
        res.json({ 
          success: true, 
          paymentIntentId: paymentIntent.id,
          message: 'Payment processed successfully!' 
        });
      } else if (paymentIntent.status === 'requires_action') {
        // 3D Secure or other authentication is required
        console.log('Payment requires additional action');
        res.json({
          success: false,
          requires_action: true,
          payment_intent_client_secret: paymentIntent.client_secret,
          next_action: paymentIntent.next_action,
          message: 'Additional authentication required'
        });
      } else {
        console.log('Payment failed with status:', paymentIntent.status);
        res.status(400).json({ 
          success: false,
          error: 'Payment processing failed', 
          status: paymentIntent.status 
        });
      }
    } catch (stripeError) {
      // Handle specific Stripe errors
      console.error('Stripe error:', stripeError.message);
      console.error('Stripe error type:', stripeError.type);
      
      return res.status(400).json({ 
        error: stripeError.message || 'Payment processing failed',
        code: stripeError.code || 'unknown_error',
        type: stripeError.type || 'unknown_type'
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to process payment', message: error.message });
  }
});

// Process payment for an existing order
router.post('/process-payment', auth, async (req, res) => {
  try {
    const { orderId, token } = req.body;
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Check if order is already paid
    if (order.isPaid) {
      return res.status(400).json({ error: 'Order is already paid' });
    }
    
    // Check for token
    if (!token) {
      return res.status(400).json({ error: 'Payment token is required' });
    }
    
    try {
      // Create a Payment Intent using the token
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalPrice * 100), // Stripe uses cents
        currency: 'usd',
        payment_method_types: ['card'],
        payment_method_data: {
          type: 'card',
          card: {
            token: token
          }
        },
        confirm: true, // Confirm the payment immediately
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderId}`,
        metadata: {
          orderId: order._id.toString(),
          userId: req.user._id.toString()
        }
      });
      
      // Check payment status
      if (paymentIntent.status === 'succeeded') {
        // Update order to paid
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          update_time: new Date().toISOString(),
          email_address: req.user.email || ''
        };
        
        await order.save();
        
        res.json({ 
          success: true, 
          order,
          message: 'Payment processed successfully!' 
        });
      } else if (paymentIntent.status === 'requires_action') {
        // 3D Secure or other authentication is required
        res.json({
          success: false,
          requires_action: true,
          payment_intent_client_secret: paymentIntent.client_secret,
          next_action: paymentIntent.next_action,
          message: 'Additional authentication required'
        });
      } else {
        res.status(400).json({ 
          success: false,
          error: 'Payment processing failed', 
          status: paymentIntent.status 
        });
      }
    } catch (stripeError) {
      // Handle specific Stripe errors
      console.error('Stripe error:', stripeError);
      return res.status(400).json({ 
        error: stripeError.message || 'Payment processing failed',
        code: stripeError.code || 'unknown_error'
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

module.exports = router; 