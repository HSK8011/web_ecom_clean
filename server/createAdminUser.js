const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('Environment loaded from:', path.resolve(__dirname, '.env'));
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

// If MONGODB_URI isn't in the environment, use a default value
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
console.log('Using MongoDB URI:', MONGODB_URI);

// Import the User model
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Admin user data
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: '123456',
  role: 'admin'
};

// Create the admin user
const createAdminUser = async () => {
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email: adminUser.email });
    
    if (userExists) {
      console.log('Admin user already exists');
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    
    // Create user with hashed password
    const user = await User.create({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      role: adminUser.role,
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AS',
        zipCode: '12345',
        country: 'USA'
      }
    });
    
    console.log('Admin user created successfully:', user);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
};

// Run the function
createAdminUser(); 