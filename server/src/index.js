// Load environment variables first thing - with explicit path
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
console.log('Environment loaded from:', path.resolve(__dirname, '../.env'));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_SECRET_KEY begins with:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'undefined');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes from correct paths
const authRoutes = require('../routes/auth');
const productRoutes = require('../routes/products');
const orderRoutes = require('../routes/orders');
const userRoutes = require('../routes/users');
const brandRoutes = require('./routes/brands');
const categoryRoutes = require('./routes/categories');
const siteConfigRoutes = require('./routes/siteConfig');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('../routes/uploadRoutes');
const cartRoutes = require('./routes/cart');
const stripeRoutes = require('./routes/stripe');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from server/public directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/site-config', siteConfigRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/stripe', stripeRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

