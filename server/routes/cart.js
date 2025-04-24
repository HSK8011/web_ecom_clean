const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/productModel');
const { 
  getInventory, 
  setInventory, 
  updateInventoryLevel 
} = require('../utils/inventoryCache');

// Transform the cart response to include proper product objects
const transformCartResponse = (cart) => {
  // Convert to plain object if it's a Mongoose document
  const plainCart = cart.toObject ? cart.toObject() : cart;
  
  // Transform each item to include proper product object
  const transformedItems = plainCart.items.map(item => {
    // Create a proper product object
    const productObject = {
      _id: item.product,
      name: item.name,
      image: item.image
    };
    
    // Return transformed item
    return {
      ...item,
      product: productObject,
      // Add these for direct access in the frontend
      displayName: item.name,
      displayImage: item.image
    };
  });
  
  // Return the transformed cart
  return {
    ...plainCart,
    items: transformedItems
  };
};

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
    let productData = {};
    
    // Get all product IDs from cart to fetch in a batch
    const productIds = cart.items.map(item => item.product);
    
    if (productIds.length > 0) {
      // Fetch all products needed for the cart in one query
      const products = await Product.find({ _id: { $in: productIds } });
      
      // Create a lookup map for quick access
      products.forEach(product => {
        productData[product._id.toString()] = {
          _id: product._id,
          name: product.name || product.title,
          image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null),
          countInStock: product.countInStock,
          sizeInventory: product.sizeInventory,
          sizes: product.sizes
        };
      });
    }
    
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      let currentStock = 0;
      
      // Check cache first for inventory data
      const cachedInventory = getInventory(item.product.toString(), item.size);
      
      if (cachedInventory !== null) {
        // Use cached inventory data
        console.log(`Using cached inventory for ${item.product} size ${item.size}: ${cachedInventory}`);
        currentStock = typeof cachedInventory === 'number' ? cachedInventory : 0;
      } else {
        // Get the product from our map
        const product = productData[item.product.toString()];
        
        if (!product) {
          // Remove item if product no longer exists
          cart.items.splice(i, 1);
          i--;
          cartUpdated = true;
          continue;
        }
        
        // Check stock for the specific size
        if (product.sizeInventory && product.sizeInventory[item.size] !== undefined) {
          currentStock = product.sizeInventory[item.size];
        } else if (product.sizes && product.sizes.includes(item.size)) {
          // Fallback if size exists but no specific inventory
          currentStock = Math.floor(product.countInStock / product.sizes.length);
        }
        
        // Cache this data for future requests
        setInventory(item.product.toString(), item.size, currentStock);
        
        // Also cache the full product inventory
        setInventory(item.product.toString(), null, {
          countInStock: product.countInStock,
          sizeInventory: product.sizeInventory || {}
        });
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
      
      // Enhance item with product data for the frontend
      if (productData[item.product.toString()]) {
        const productInfo = productData[item.product.toString()];
        cart.items[i].productInfo = {
          _id: productInfo._id,
          name: productInfo.name,
          image: productInfo.image
        };
      }
    }
    
    if (cartUpdated) {
      await cart.save();
    }

    // Transform cart for response
    const transformedCart = transformCartResponse(cart);
    res.json(transformedCart);
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to cart with improved size inventory handling
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;

    console.log('Add to cart request:', { 
      userId: req.user._id, 
      productId, 
      productIdType: typeof productId,
      quantity, 
      size, 
      color 
    });

    if (!productId || !quantity || !size) {
      return res.status(400).json({ message: 'Product ID, quantity, and size are required' });
    }

    // Check inventory cache first
    let cachedInventory = getInventory(productId, size);
    let product, availableStock = 0;
    
    if (cachedInventory !== null) {
      console.log(`Using cached inventory for ${productId} size ${size}: ${cachedInventory}`);
      
      if (typeof cachedInventory === 'number') {
        // We have a direct size inventory value
        availableStock = cachedInventory;
        
        // We still need the product for other details
        product = await Product.findById(productId).select('name title image images sizes price sizeInventory countInStock');
      } else if (typeof cachedInventory === 'object' && cachedInventory.sizeInventory) {
        // We have the full product inventory
        if (cachedInventory.sizeInventory[size] !== undefined) {
          availableStock = cachedInventory.sizeInventory[size];
        } else if (cachedInventory.countInStock) {
          // Distribute stock evenly
          const product = await Product.findById(productId).select('sizes');
          if (product && product.sizes && product.sizes.length > 0) {
            availableStock = Math.floor(cachedInventory.countInStock / product.sizes.length);
          }
        }
        
        // We still need the product for other details
        product = await Product.findById(productId).select('name title image images sizes price');
      }
    }
    
    // If not in cache, fetch from database
    if (!product) {
      // Find the product - handle possible ObjectId conversion issues
      try {
        product = await Product.findById(productId);
      } catch (idError) {
        console.error('Invalid product ID format:', productId);
        return res.status(400).json({ message: 'Invalid product ID format' });
      }
      
      if (!product) {
        console.log('Product not found for ID:', productId);
        return res.status(404).json({ message: 'Product not found' });
      }

      console.log('Product found:', { 
        id: product._id, 
        stringId: product._id.toString(),
        name: product.name || product.title, 
        sizes: product.sizes,
        countInStock: product.countInStock,
        sizeInventory: JSON.stringify(product.sizeInventory)
      });
      
      // Validate size
      if (!product.sizes || !Array.isArray(product.sizes)) {
        console.error('Product sizes not found or not an array:', product.sizes);
        return res.status(400).json({ message: 'Product sizes not available' });
      }
      
      if (!product.sizes.includes(size)) {
        console.error('Invalid size selected:', { size, availableSizes: product.sizes });
        return res.status(400).json({ message: 'Invalid size selected' });
      }

      // Check stock availability with improved logging
      console.log('Size inventory check:', { 
        hasSizeInventory: !!product.sizeInventory,
        sizeInventoryType: typeof product.sizeInventory,
        requestedSize: size,
        countInStock: product.countInStock
      });
      
      // Check for size-specific inventory first
      if (product.sizeInventory && typeof product.sizeInventory === 'object') {
        const sizeStock = product.sizeInventory[size];
        if (sizeStock !== undefined) {
          // Use size-specific inventory if available
          availableStock = parseInt(sizeStock, 10) || 0;
          console.log(`Found specific inventory for size ${size}:`, availableStock);
          
          // Cache this for future requests
          setInventory(productId, size, availableStock);
        }
      }
      
      // If no size-specific inventory, but we have total stock and sizes, distribute evenly
      if (availableStock <= 0 && product.countInStock > 0 && product.sizes && product.sizes.length > 0) {
        // Fallback to evenly distributed inventory
        availableStock = Math.floor(product.countInStock / product.sizes.length);
        console.log('Using evenly distributed inventory:', availableStock);
        
        // Cache this for future requests
        setInventory(productId, size, availableStock);
      }
      
      // Cache the full product inventory
      setInventory(productId, null, {
        countInStock: product.countInStock,
        sizeInventory: product.sizeInventory || {}
      });
    }
    
    // Get the product name - handle potential data inconsistencies
    const productName = product.name || product.title || 'Product';
    
    // Get the product image - with fallbacks
    let productImage = '/images/placeholder.png';
    if (product.image) {
      productImage = product.image;
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      productImage = product.images[0];
    }
    
    console.log('Available stock determined:', { size, availableStock });

    if (availableStock <= 0) {
      return res.status(400).json({ 
        message: `Size ${size} is out of stock.` 
      });
    }
    
    if (availableStock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${availableStock} items available in size ${size}.`,
        availableStock
      });
    }

    try {
      // Find or create cart
      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        console.log('Creating new cart for user:', req.user._id);
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

      console.log('Existing item check:', { existingItemIndex, itemsCount: cart.items.length });

      if (existingItemIndex > -1) {
        // Calculate new quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        // Validate against available stock
        if (newQuantity > availableStock) {
          return res.status(400).json({ 
            message: `Cannot add ${quantity} more items. Only ${availableStock} available in total.`,
            currentQuantity: cart.items[existingItemIndex].quantity,
            availableStock
          });
        }
        
        // Update existing item quantity
        cart.items[existingItemIndex].quantity = newQuantity;
        console.log('Updated existing item quantity:', { 
          itemId: cart.items[existingItemIndex]._id,
          newQuantity 
        });
        
        // Update inventory cache to reflect change
        updateInventoryLevel(productId, size, -quantity);
      } else {
        // Add new item
        cart.items.push({
          product: productId,
          name: productName,
          price: product.price,
          image: productImage,
          size,
          color: color || null,
          quantity
        });
        console.log('Added new item to cart');
        
        // Update inventory cache to reflect change
        updateInventoryLevel(productId, size, -quantity);
      }

      try {
        await cart.save();
        console.log('Cart saved successfully');
        
        // Transform cart for response
        const transformedCart = transformCartResponse(cart);
        res.status(201).json(transformedCart);
      } catch (saveError) {
        console.error('Error saving cart:', saveError);
        res.status(500).json({ message: 'Error saving cart', details: saveError.message });
      }
    } catch (cartError) {
      console.error('Cart processing error:', cartError);
      res.status(500).json({ message: 'Error processing cart', details: cartError.message });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Update cart item quantity with improved size inventory handling
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

    const item = cart.items[itemIndex];
    const productId = item.product.toString();
    const size = item.size;
    let availableStock = 0;
    
    // Check inventory cache first
    const cachedStock = getInventory(productId, size);
    if (cachedStock !== null) {
      console.log(`Using cached inventory for ${productId} size ${size}: ${cachedStock}`);
      
      if (typeof cachedStock === 'number') {
        availableStock = cachedStock;
      } else if (typeof cachedStock === 'object' && cachedStock.sizeInventory && cachedStock.sizeInventory[size] !== undefined) {
        availableStock = cachedStock.sizeInventory[size];
      }
    } else {
      // Cache miss - check database
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product no longer exists' });
      }
      
      console.log('Size inventory check:', { 
        productId: product._id,
        productName: product.name || product.title,
        size,
        hasSizeInventory: !!product.sizeInventory,
        sizeInventoryType: typeof product.sizeInventory
      });
      
      // Check size-specific inventory first
      if (product.sizeInventory && typeof product.sizeInventory === 'object') {
        const sizeStock = product.sizeInventory[size];
        if (sizeStock !== undefined) {
          availableStock = parseInt(sizeStock, 10) || 0;
          console.log(`Found specific inventory for size ${size}:`, availableStock);
          
          // Cache this for future requests
          setInventory(productId, size, availableStock);
        }
      }
      
      // If no size-specific inventory, distribute total stock among sizes
      if (availableStock <= 0 && product.countInStock > 0 && product.sizes && product.sizes.includes(size)) {
        availableStock = Math.floor(product.countInStock / product.sizes.length);
        console.log(`Distributing total stock for size ${size}:`, availableStock);
        
        // Cache this for future requests
        setInventory(productId, size, availableStock);
      }
      
      // Cache the full product inventory
      setInventory(productId, null, {
        countInStock: product.countInStock,
        sizeInventory: product.sizeInventory || {}
      });
    }

    if (availableStock <= 0) {
      return res.status(400).json({ 
        message: `Size ${size} is out of stock.` 
      });
    }

    if (quantity > availableStock) {
      return res.status(400).json({ 
        message: `Cannot update to ${quantity}. Only ${availableStock} items available in size ${size}.`,
        availableStock
      });
    }

    // Calculate the change in quantity
    const quantityDiff = quantity - item.quantity;
    
    // Update item quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    
    // Update inventory cache to reflect the change
    if (quantityDiff !== 0) {
      updateInventoryLevel(productId, size, -quantityDiff);
    }

    // Transform cart for response
    const transformedCart = transformCartResponse(cart);
    res.json(transformedCart);
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

    // Get item details before removing
    const item = cart.items[itemIndex];
    const productId = item.product.toString();
    const size = item.size;
    const quantity = item.quantity;
    
    // Remove the item
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    // Update inventory cache to reflect the item being released back to inventory
    updateInventoryLevel(productId, size, quantity);

    // Transform cart for response
    const transformedCart = transformCartResponse(cart);
    res.json(transformedCart);
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
      // Return items to inventory cache before clearing
      cart.items.forEach(item => {
        const productId = item.product.toString();
        const size = item.size;
        const quantity = item.quantity;
        
        // Update inventory cache
        updateInventoryLevel(productId, size, quantity);
      });
      
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

      const productId = guestItem._id;
      const size = guestItem.size;
      
      // Check inventory cache first
      let availableStock = 0;
      let cachedStock = getInventory(productId, size);
      let product;
      
      if (cachedStock !== null) {
        // Use cached inventory
        availableStock = typeof cachedStock === 'number' ? cachedStock : 
                         (cachedStock.sizeInventory && cachedStock.sizeInventory[size] !== undefined ? 
                         cachedStock.sizeInventory[size] : 0);
      } else {
        // Cache miss - check database
        product = await Product.findById(productId);
        if (!product) continue;
        
        if (product.sizeInventory && product.sizeInventory[size] !== undefined) {
          availableStock = product.sizeInventory[size];
        } else if (product.sizes && product.sizes.includes(size)) {
          availableStock = Math.floor(product.countInStock / product.sizes.length);
        }
        
        // Cache this inventory data
        setInventory(productId, size, availableStock);
        setInventory(productId, null, {
          countInStock: product.countInStock,
          sizeInventory: product.sizeInventory || {}
        });
      }

      if (availableStock < 1) continue; // Skip out of stock items

      // Check if item already exists in user cart
      const existingItemIndex = cart.items.findIndex(item => 
        item.product.toString() === productId && 
        item.size === size && 
        (guestItem.color ? item.color === guestItem.color : true)
      );
      
      // Get the full product if we haven't already
      if (!product) {
        product = await Product.findById(productId);
        if (!product) continue;
      }

      if (existingItemIndex > -1) {
        // Calculate new quantity
        const newQuantity = Math.min(
          cart.items[existingItemIndex].quantity + guestItem.quantity,
          availableStock
        );
        
        // Update existing item quantity
        cart.items[existingItemIndex].quantity = newQuantity;
        
        // Update inventory cache
        updateInventoryLevel(productId, size, -(newQuantity - cart.items[existingItemIndex].quantity));
      } else {
        // Add new item with quantity limited by stock
        const quantityToAdd = Math.min(guestItem.quantity, availableStock);
        
        cart.items.push({
          product: productId,
          name: product.name || product.title,
          price: product.price,
          image: product.image || (product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.png'),
          size: guestItem.size,
          color: guestItem.color || null,
          quantity: quantityToAdd
        });
        
        // Update inventory cache
        updateInventoryLevel(productId, size, -quantityToAdd);
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