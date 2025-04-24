const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const { auth } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const {
      category,
      brand,
      maxPrice,
      colors,
      sizes,
      sort,
      page = 1,
      limit = 9
    } = req.query;

    console.log('GET /api/products request query params:', req.query);

    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (brand) {
      // Case-insensitive regex for brand matching
      filter.brand = { $regex: new RegExp('^' + brand + '$', 'i') };
    }
    
    if (maxPrice) {
      filter.price = { $lte: parseFloat(maxPrice) };
    }
    
    if (colors) {
      filter.colors = { $in: colors.split(',') };
    }
    
    if (sizes) {
      filter.sizes = { $in: sizes.split(',') };
    }

    console.log('MongoDB filter being applied:', filter);

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price-low':
        sortObj = { price: 1 };
        break;
      case 'price-high':
        sortObj = { price: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'popular':
        sortObj = { rating: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Calculate skip for pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Debug: Count products by title containing "orange"
    const orangeProductsCount = await Product.countDocuments({title: /orange/i});
    console.log(`Found ${orangeProductsCount} products with 'orange' in the title`);

    // Debug: Try to find the specific orange shirt2 product
    const orangeShirt2 = await Product.findOne({title: 'orange shirt2'});
    console.log('orange shirt2 product in MongoDB:', orangeShirt2 ? orangeShirt2._id : 'Not found');

    // Get filtered products
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    console.log(`Fetched ${products.length} products from MongoDB (page ${pageNum}, limit ${limitNum})`);
    console.log(`Total products matching filter: ${total} (total pages: ${Math.ceil(total / limitNum)})`);
    
    // Debug: Check if orange shirt2 is in the results
    const containsOrangeShirt2 = products.some(p => p.title === 'orange shirt2');
    console.log('products contains orange shirt2:', containsOrangeShirt2);

    res.json({
      products,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const query = {};
    
    // Handle special categories and dress styles
    if (req.params.category === 'new-arrivals') {
      // Get products created within the last 30 days instead of 7
      // OR products explicitly marked as new
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.$or = [
        { createdAt: { $gte: thirtyDaysAgo } },
        { isNew: true }
      ];
      console.log('New arrivals query using date or isNew flag:', thirtyDaysAgo);
    } else if (req.params.category === 'top-selling') {
      // For now, return all products as top selling
      query = {};
    } else if (['casual', 'formal', 'party', 'gym'].includes(req.params.category.toLowerCase())) {
      // Handle dress style categories
      query.category = req.params.category.charAt(0).toUpperCase() + req.params.category.slice(1).toLowerCase();
    } else {
      query.category = req.params.category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get products by dress style
router.get('/style/:category', async (req, res) => {
  try {
    const products = await Product.find({ 
      category: req.params.category.charAt(0).toUpperCase() + req.params.category.slice(1).toLowerCase() 
    }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:id - Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Create a new product (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    // Debug logs to help diagnose the user ID issue
    console.log('Creating new product, auth user:', {
      userId: req.user._id,
      userType: typeof req.user._id,
      userIdStr: req.user._id.toString()
    });

    // Determine product title from either title or name field for consistency
    const productTitle = req.body.title || req.body.name;
    if (!productTitle) {
      return res.status(400).json({ message: 'Product title/name is required' });
    }

    const productData = {
      title: productTitle, // Store consistently in title field
      price: req.body.price,
      oldPrice: req.body.oldPrice,
      images: req.body.images || [req.body.image],
      brand: req.body.brand ? req.body.brand.trim() : '',
      category: req.body.category,
      description: req.body.description,
      sizes: req.body.sizes,
      colors: req.body.colors,
      countInStock: req.body.countInStock,
      discount: req.body.discount,
      user: req.user._id
    };

    // Add sizeInventory if it exists in the request
    if (req.body.sizeInventory) {
      productData.sizeInventory = req.body.sizeInventory;
      
      // Calculate total stock from sizeInventory values
      if (!productData.countInStock) {
        const totalStock = Object.values(req.body.sizeInventory).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
        productData.countInStock = totalStock;
        console.log('Calculated countInStock from sizeInventory:', totalStock);
      }
    }

    console.log('Creating product with data:', productData);

    const product = new Product(productData);
    const newProduct = await product.save();
    
    console.log('Product created successfully:', {
      id: newProduct._id,
      title: newProduct.title,
      user: newProduct.user
    });
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    // Send more detailed error information
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      })) : null
    });
  }
});

// Update a product (admin only) - supports both PUT and PATCH
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    console.log('PUT product update received:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // First, check if the product exists
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Store the original user reference
    const originalUser = existingProduct.user;
    console.log('Original user reference:', {
      userId: originalUser,
      type: typeof originalUser
    });
    
    // Create an update object with the request data,
    // but explicitly exclude user field to prevent it from being changed
    const updateData = {};
    
    // Process form fields safely
    if (req.body.title != null || req.body.name != null) {
      updateData.title = req.body.title || req.body.name;
    }
    
    if (req.body.price != null) updateData.price = req.body.price;
    if (req.body.oldPrice != null) updateData.oldPrice = req.body.oldPrice;
    if (req.body.image != null) updateData.images = [req.body.image];
    if (req.body.images != null) updateData.images = req.body.images;
    if (req.body.brand != null) updateData.brand = req.body.brand.trim();
    if (req.body.category != null) updateData.category = req.body.category;
    if (req.body.description != null) updateData.description = req.body.description;
    if (req.body.sizes != null) updateData.sizes = req.body.sizes;
    if (req.body.colors != null) updateData.colors = req.body.colors;
    
    // Handle sizeInventory and calculate countInStock
    if (req.body.sizeInventory != null) {
      updateData.sizeInventory = req.body.sizeInventory;
      
      // Calculate total from sizeInventory values
      const totalStock = Object.values(req.body.sizeInventory).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
      updateData.countInStock = totalStock;
      console.log('Calculated countInStock from sizeInventory:', totalStock);
    } else if (req.body.countInStock != null) {
      updateData.countInStock = req.body.countInStock;
    }
    
    if (req.body.discount != null) updateData.discount = req.body.discount;
    
    console.log('Update data prepared:', updateData);
    
    // Use findByIdAndUpdate with {new: true} to return the updated document
    // and runValidators to ensure validation is run
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { 
        new: true,           // Return the updated document
        runValidators: false  // Don't run validators as that would require all fields
      }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found after update attempt' });
    }
    
    console.log('Product updated successfully:', {
      id: updatedProduct._id,
      title: updatedProduct.title,
      user: updatedProduct.user
    });
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      })) : null
    });
  }
});

// Update a product (admin only)
router.patch('/:id', auth, isAdmin, async (req, res) => {
  try {
    console.log('PATCH product update received:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // First, check if the product exists
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Create an update object with the request data
    const updateData = {};
    
    // Process form fields safely
    if (req.body.title != null || req.body.name != null) {
      updateData.title = req.body.title || req.body.name;
    }
    
    if (req.body.price != null) updateData.price = req.body.price;
    if (req.body.oldPrice != null) updateData.oldPrice = req.body.oldPrice;
    if (req.body.image != null) updateData.images = [req.body.image];
    if (req.body.images != null) updateData.images = req.body.images;
    if (req.body.brand != null) updateData.brand = req.body.brand;
    if (req.body.category != null) updateData.category = req.body.category;
    if (req.body.description != null) updateData.description = req.body.description;
    if (req.body.sizes != null) updateData.sizes = req.body.sizes;
    if (req.body.colors != null) updateData.colors = req.body.colors;
    
    // Handle sizeInventory and calculate countInStock
    if (req.body.sizeInventory != null) {
      updateData.sizeInventory = req.body.sizeInventory;
      
      // Calculate total from sizeInventory values
      const totalStock = Object.values(req.body.sizeInventory).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
      updateData.countInStock = totalStock;
      console.log('Calculated countInStock from sizeInventory:', totalStock);
    } else if (req.body.countInStock != null) {
      updateData.countInStock = req.body.countInStock;
    }
    
    if (req.body.discount != null) updateData.discount = req.body.discount;
    
    console.log('Update data prepared:', updateData);
    
    // Use findByIdAndUpdate with {new: true} to return the updated document
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { 
        new: true,           // Return the updated document
        runValidators: false  // Don't run validators as that would require all fields
      }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found after update attempt' });
    }
    
    console.log('Product updated successfully:', {
      id: updatedProduct._id,
      title: updatedProduct.title,
      user: updatedProduct.user
    });
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      })) : null
    });
  }
});

// Delete a product (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Batch fetch products by IDs for efficient cart stock checking
router.post('/batch', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required' });
    }
    
    // Limit the number of products that can be fetched at once
    if (productIds.length > 50) {
      return res.status(400).json({ message: 'Too many product IDs requested (max 50)' });
    }
    
    // Find all valid products from the provided IDs
    const products = await Product.find({
      _id: { $in: productIds }
    }).select('_id title name price countInStock sizeInventory sizes images image');
    
    console.log(`Batch fetched ${products.length} products out of ${productIds.length} requested IDs`);
    
    res.json(products);
  } catch (error) {
    console.error('Error in batch product fetch:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 