const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      // Create a new cart if one doesn't exist
      cart = new Cart({
        user: req.user._id,
        items: []
      });
      await cart.save();
    }

    // Verify stock levels and update cart if necessary
    let cartUpdated = false;
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      const product = await Product.findById(item.product);
      
      if (!product) {
        // Remove item if product no longer exists
        cart.items.splice(i, 1);
        i--;
        cartUpdated = true;
        continue;
      }
      
      let currentStock = 0;
      // Check stock for the specific size
      if (product.sizeInventory && product.sizeInventory[item.size] !== undefined) {
        currentStock = product.sizeInventory[item.size];
      } else if (product.sizes && product.sizes.includes(item.size)) {
        // Fallback if size exists but no specific inventory
        currentStock = Math.floor(product.countInStock / product.sizes.length);
      }
      
      if (currentStock === 0) {
        // Remove item if out of stock
        cart.items.splice(i, 1);
        i--;
        cartUpdated = true;
      } else if (item.quantity > currentStock) {
        // Reduce quantity if more than available stock
        cart.items[i].quantity = currentStock;
        cartUpdated = true;
      }
    }
    
    if (cartUpdated) {
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to cart
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;

    if (!productId || !quantity || !size) {
      return res.status(400).json({ message: 'Product ID, quantity, and size are required' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate size
    if (!product.sizes.includes(size)) {
      return res.status(400).json({ message: 'Invalid size selected' });
    }

    // Check stock availability
    let availableStock = 0;
    if (product.sizeInventory && product.sizeInventory[size] !== undefined) {
      availableStock = product.sizeInventory[size];
    } else {
      // Fallback if no specific size inventory
      availableStock = Math.floor(product.countInStock / product.sizes.length);
    }

    if (availableStock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${availableStock} items available in size ${size}.` 
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: []
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId && 
      item.size === size && 
      (color ? item.color === color : true)
    );

    if (existingItemIndex > -1) {
      // Calculate new quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Validate against available stock
      if (newQuantity > availableStock) {
        return res.status(400).json({ 
          message: `Cannot add ${quantity} more items. Only ${availableStock} available in total.` 
        });
      }
      
      // Update existing item quantity
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        name: product.name || product.title,
        price: product.price,
        image: product.image || (product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.png'),
        size,
        color: color || null,
        quantity
      });
    }

    await cart.save();
    res.status(201).json(cart);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update cart item quantity
router.put('/:itemId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    console.log('Update cart item request:', { itemId, quantity });

    // Find cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find item in cart - ensuring string comparison
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    console.log('Found item index:', itemIndex);
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Check stock availability
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      return res.status(404).json({ message: 'Product no longer exists' });
    }

    const size = cart.items[itemIndex].size;
    let availableStock = 0;
    
    if (product.sizeInventory && product.sizeInventory[size] !== undefined) {
      availableStock = product.sizeInventory[size];
    } else if (product.sizes && product.sizes.includes(size)) {
      availableStock = Math.floor(product.countInStock / product.sizes.length);
    }

    if (quantity > availableStock) {
      return res.status(400).json({ 
        message: `Cannot update to ${quantity}. Only ${availableStock} items available.` 
      });
    }

    // Update item quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item from cart
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find and remove item using MongoDB ObjectId
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Merge guest cart with user cart after login
router.post('/merge', auth, async (req, res) => {
  try {
    const { guestCartItems } = req.body;
    
    if (!guestCartItems || !Array.isArray(guestCartItems) || guestCartItems.length === 0) {
      return res.status(200).json({ message: 'No items to merge' });
    }

    // Find or create user cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: []
      });
    }

    // Process each guest cart item
    for (const guestItem of guestCartItems) {
      if (!guestItem._id || !guestItem.size || !guestItem.quantity) {
        continue; // Skip invalid items
      }

      // Find product
      const product = await Product.findById(guestItem._id);
      if (!product) continue;

      // Check stock
      let availableStock = 0;
      if (product.sizeInventory && product.sizeInventory[guestItem.size] !== undefined) {
        availableStock = product.sizeInventory[guestItem.size];
      } else if (product.sizes && product.sizes.includes(guestItem.size)) {
        availableStock = Math.floor(product.countInStock / product.sizes.length);
      }

      if (availableStock < 1) continue; // Skip out of stock items

      // Check if item already exists in user cart
      const existingItemIndex = cart.items.findIndex(item => 
        item.product.toString() === guestItem._id && 
        item.size === guestItem.size && 
        (guestItem.color ? item.color === guestItem.color : true)
      );

      if (existingItemIndex > -1) {
        // Calculate new quantity
        const newQuantity = Math.min(
          cart.items[existingItemIndex].quantity + guestItem.quantity,
          availableStock
        );
        
        // Update existing item quantity
        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item with quantity limited by stock
        cart.items.push({
          product: guestItem._id,
          name: product.name || product.title,
          price: product.price,
          image: product.image || (product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.png'),
          size: guestItem.size,
          color: guestItem.color || null,
          quantity: Math.min(guestItem.quantity, availableStock)
        });
      }
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 