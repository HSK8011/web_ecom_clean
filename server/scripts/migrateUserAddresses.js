require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Address = require('../models/Address');

const migrateUserAddresses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopco', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find all users with a permanentAddress reference
    const users = await User.find();
    
    console.log(`Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('No users found. Exiting...');
      process.exit(0);
      return;
    }
    
    // Migrate each user
    for (const user of users) {
      try {
        let needsUpdate = false;
        
        // Check if user has an address reference
        if (user.permanentAddress) {
          try {
            const addressDoc = await Address.findById(user.permanentAddress);
            
            if (addressDoc) {
              console.log(`Migrating address for user ${user.name} (${user.email})`);
              
              // Update user with embedded address
              user.address = {
                street: addressDoc.street || '',
                city: addressDoc.city || '',
                state: addressDoc.state || '',
                zipCode: addressDoc.zipCode || '',
                country: addressDoc.country || ''
              };
              
              needsUpdate = true;
            }
          } catch (addressErr) {
            console.error(`Error finding address for user ${user.email}:`, addressErr.message);
          }
        }
        
        // Check if address needs default values
        if (!user.address || !user.address.street) {
          console.log(`Setting default address for user ${user.email}`);
          
          // Set default address
          user.address = {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          };
          
          needsUpdate = true;
        }
        
        // Set default phone if not present
        if (!user.phone) {
          console.log(`Setting default phone for user ${user.email}`);
          user.phone = '1234567890';
          needsUpdate = true;
        }
        
        // Fix role if needed
        if (user.role === 'user') {
          console.log(`Fixing role for user ${user.email}`);
          user.role = 'customer';
          needsUpdate = true;
        }
        
        // Save user if changes were made
        if (needsUpdate) {
          await User.findByIdAndUpdate(user._id, {
            address: user.address,
            phone: user.phone,
            role: user.role
          });
          console.log(`Successfully updated user ${user.email}`);
        } else {
          console.log(`No changes needed for user ${user.email}`);
        }
      } catch (userError) {
        console.error(`Error migrating user ${user.email}:`, userError.message);
      }
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
migrateUserAddresses(); 