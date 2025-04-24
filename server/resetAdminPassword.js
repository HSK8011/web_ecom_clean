const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('Environment loaded from:', path.resolve(__dirname, '.env'));

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

// Reset admin password
const resetAdminPassword = async () => {
  try {
    const email = 'admin@example.com';
    const newPassword = '123456';
    
    console.log(`Resetting password for user with email: ${email}`);
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('User found with ID:', user._id);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password directly in the database
    // Using findByIdAndUpdate to bypass any model middleware
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true }
    );
    
    console.log('Password reset successfully');
    console.log('Updated user:', updatedUser);
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

// Run the function
resetAdminPassword(); 