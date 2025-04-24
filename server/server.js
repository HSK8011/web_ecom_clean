const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Import routes
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const categoriesRoutes = require('./routes/categories');
const stripeRoutes = require('./src/routes/stripe');
const siteConfigRoutes = require('./routes/siteConfig');
const adminRoutes = require('./routes/admin');

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('Environment loaded from:', path.resolve(__dirname, '.env'));
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET first 10 chars:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'undefined');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopco', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
    socketTimeoutMS: 45000, // Close sockets after 45s
    family: 4 // Use IPv4, skip trying IPv6
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => {
    console.log('MongoDB Connection Error:', err);
    process.exit(1); // Exit with failure
  });

// Set up file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/images/products');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileName = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, fileName);
  },
});

// File filter for image uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, .png and .webp format allowed!'));
  }
};

// Set up multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

// Make images folder static
app.use('/images/products', express.static(path.join(__dirname, '../public/images/products')));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', upload.single('file'), uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/site-config', siteConfigRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  console.error('Error Stack:', err.stack);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    details: err.details || null
  });
});

// Catch-all for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server with port conflict handling
const startServer = (port) => {
  const server = app.listen(port)
    .on('listening', () => {
      console.log(`Server running on port ${port}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying port ${port + 1}...`);
        server.close();
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
};

// Start the server with initial port
startServer(PORT);

// Comment out the old server start code
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// }); 