#!/usr/bin/env node

/**
 * Environment setup script for SHOP.CO application
 * 
 * This script helps developers set up their environment with proper security configurations.
 * It checks for important environment variables like JWT_SECRET and provides guidance
 * on how to set them securely.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const dotenv = require('dotenv');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to .env file
const envPath = path.join(__dirname, '..', '.env');

// Generate a secure random string for JWT_SECRET
const generateSecureSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Check if .env file exists
const checkEnvFile = () => {
  try {
    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
      console.log('No .env file found. Creating one...');
      fs.copyFileSync(
        path.join(__dirname, '..', '.env.example'), 
        envPath
      );
      console.log('.env file created from .env.example');
    }
    
    // Parse existing .env file
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    return envConfig;
  } catch (error) {
    console.error('Error checking .env file:', error);
    return {};
  }
};

// Validate and update JWT_SECRET
const validateJwtSecret = (envConfig) => {
  const currentSecret = envConfig.JWT_SECRET;
  
  if (!currentSecret || currentSecret === 'your_jwt_secret_key_here' || 
      currentSecret === 'use_a_strong_random_string_here_at_least_32_chars') {
    console.log('⚠️  WARNING: JWT_SECRET is not set or using a default value.');
    console.log('This is a security risk and should be fixed before production use.');
    
    const newSecret = generateSecureSecret();
    console.log('\n✅ Generated a secure JWT_SECRET:');
    console.log(newSecret);
    
    rl.question('\nDo you want to update your .env file with this new JWT_SECRET? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const updatedContent = envContent.replace(
          /JWT_SECRET=.*/g,
          `JWT_SECRET=${newSecret}`
        );
        
        fs.writeFileSync(envPath, updatedContent);
        console.log('✅ JWT_SECRET has been updated in your .env file.');
      } else {
        console.log('\nPlease manually update your JWT_SECRET in the .env file with the generated value.');
      }
      
      checkOtherConfigs(envConfig);
    });
  } else {
    console.log('✅ JWT_SECRET is properly set.');
    checkOtherConfigs(envConfig);
  }
};

// Check and configure inventory caching
const configureInventoryCaching = (envConfig) => {
  // Default value is 5 minutes (300000 milliseconds)
  const defaultCacheDuration = '300000';
  
  if (!envConfig.INVENTORY_CACHE_DURATION) {
    console.log('\n📦 Inventory Caching Configuration:');
    console.log('No INVENTORY_CACHE_DURATION found in .env file.');
    
    rl.question(`Would you like to enable inventory caching? (Default: ${defaultCacheDuration}ms = 5 minutes) (y/n): `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        let duration = defaultCacheDuration;
        
        rl.question(`Enter cache duration in milliseconds (Press Enter for default ${defaultCacheDuration}ms): `, (customDuration) => {
          if (customDuration && !isNaN(customDuration)) {
            duration = customDuration;
          }
          
          const envContent = fs.readFileSync(envPath, 'utf8');
          // Append to the end of the file if it doesn't exist
          const updatedContent = envContent + `\n# Inventory caching duration in milliseconds\nINVENTORY_CACHE_DURATION=${duration}\n`;
          
          fs.writeFileSync(envPath, updatedContent);
          console.log(`✅ Inventory caching configured with duration: ${duration}ms`);
          
          finishSetup();
        });
      } else {
        console.log('Inventory caching will not be enabled.');
        finishSetup();
      }
    });
  } else {
    console.log(`✅ Inventory caching is configured (${envConfig.INVENTORY_CACHE_DURATION}ms).`);
    finishSetup();
  }
};

// Check other important configurations
const checkOtherConfigs = (envConfig) => {
  console.log('\n📋 Environment Configuration Check:');
  
  // Check MongoDB connection
  if (!envConfig.MONGODB_URI || envConfig.MONGODB_URI === 'mongodb://localhost:27017/shopco') {
    console.log('⚠️  MONGODB_URI is set to the default value. Update this for production.');
  } else {
    console.log('✅ MONGODB_URI is configured.');
  }
  
  // Check Stripe configuration
  if (!envConfig.STRIPE_SECRET_KEY || 
      envConfig.STRIPE_SECRET_KEY === 'stripe_test_key_placeholder') {
    console.log('⚠️  STRIPE_SECRET_KEY is not set or using a placeholder. Replace with your actual key for production.');
  } else {
    console.log('✅ STRIPE_SECRET_KEY is configured.');
  }
  
  // Check for duplicate keys
  const keys = Object.keys(envConfig);
  const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
  
  if (duplicateKeys.length > 0) {
    console.log(`⚠️  Warning: Duplicate keys found in .env file: ${duplicateKeys.join(', ')}`);
    console.log('   This can cause confusion. Please remove the duplicates.');
  }
  
  // Continue to inventory caching configuration
  configureInventoryCaching(envConfig);
};

// Final setup message
const finishSetup = () => {
  console.log('\n🚀 Environment setup completed!');
  console.log('To apply these changes, restart your server.');
  rl.close();
};

// Main function
const main = () => {
  console.log('🔒 Checking application security configuration...\n');
  
  const envConfig = checkEnvFile();
  validateJwtSecret(envConfig);
};

// Run the script
main(); 