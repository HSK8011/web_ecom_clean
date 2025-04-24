const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const query = {};

    // Handle category filtering
    if (req.query.category) {
      if (req.query.category === 'new-arrivals') {
        // Filter products created in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.createdAt = { $gte: thirtyDaysAgo };
      } else {
        query.category = req.query.category;
      }
    }

    // Handle other filters
    if (req.query.style) {
      query.style = req.query.style;
    }

    // Handle search
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await Product.find(query)
      .sort(req.query.sort ? { [req.query.sort]: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviews');

    res.json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const {
      name,
      title,
      price,
      description,
      images,
      image,
      brand,
      category,
      countInStock,
      features,
      sizes,
      colors,
      sizeInventory,
      discount
    } = req.body;

    // Validate required fields
    if (!name && !title) {
      return res.status(400).json({ error: 'Product name/title is required' });
    }
    
    if (!price) {
      return res.status(400).json({ error: 'Product price is required' });
    }
    
    if (!category) {
      return res.status(400).json({ error: 'Product category is required' });
    }
    
    if (!description) {
      return res.status(400).json({ error: 'Product description is required' });
    }

    // Handle images (support both arrays and single image)
    let productImages = [];
    if (images && Array.isArray(images)) {
      productImages = images;
    } else if (image) {
      productImages = [image];
    }

    const product = new Product({
      title: title || name || 'Sample Product', // Handle both name and title
      price: price || 0,
      user: req.user._id,
      images: productImages,
      brand: brand || 'Sample Brand',
      category: category || 'Sample Category',
      countInStock: countInStock || 0,
      numReviews: 0,
      description: description || 'Sample Description',
      features: features || [],
      sizes: sizes || [],
      colors: colors || [],
      sizeInventory: sizeInventory || {},
      discount: discount || { isActive: false, percentage: 0 }
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ 
      error: 'Failed to create product',
      message: error.message 
    });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  try {
    console.log('Update request body:', req.body);
    
    const {
      name,
      title,
      price,
      description,
      images,
      image,
      brand,
      category,
      countInStock,
      features,
      sizes,
      colors,
      sizeInventory,
      discount
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Handle images (support both arrays and single image)
    let productImages = product.images || [];
    if (images && Array.isArray(images)) {
      productImages = images;
    } else if (image) {
      productImages = [image];
    }

    // Update the product fields
    product.title = title || name || product.title;
    product.price = price !== undefined ? price : product.price;
    product.description = description || product.description;
    product.images = productImages;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
    product.features = features || product.features;
    product.sizes = sizes || product.sizes;
    product.colors = colors || product.colors;
    
    // Update sizeInventory if provided
    if (sizeInventory) {
      product.sizeInventory = sizeInventory;
    }
    
    // Update discount if provided
    if (discount) {
      product.discount = discount;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ 
      error: 'Failed to update product',
      message: error.message 
    });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    // Check if user already submitted a review
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    
    // Calculate average rating
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(4);
  res.json(products);
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  
  const count = await Product.countDocuments({ category: req.params.category });
  const products = await Product.find({ category: req.params.category })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort(req.query.sort ? { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 } : { createdAt: -1 });

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    totalProducts: count,
  });
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Find products in the same category but exclude the current product
  const relatedProducts = await Product.find({
    _id: { $ne: req.params.id },
    category: product.category,
  }).limit(4);
  
  res.json(relatedProducts);
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getProductsByCategory,
  getRelatedProducts,
}; 