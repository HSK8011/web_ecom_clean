# SHOP.CO Server

Backend server for the SHOP.CO e-commerce platform.

## Troubleshooting Common Issues

### 500 Internal Server Error from /api/cart

If you encounter a 500 Internal Server Error when accessing the cart API, it may be due to invalid JWT authentication tokens. This commonly happens after the JWT_SECRET environment variable is changed.

#### Solution 1: Reset Your Browser's Application Data

1. Open your browser developer tools (F12)
2. Go to the "Application" tab
3. Select "Local Storage" on the left sidebar
4. Clear items named "token" and "userData"
5. Refresh the page and log in again

#### Solution 2: Run the Setup Environment Script

The server includes a script to help with environment variable setup:

```bash
cd server
npm run setup-env
```

This script checks your JWT_SECRET and helps generate a secure one if needed.

#### Solution 3: Run the Cart Debug Script

To diagnose cart-specific issues:

```bash
cd server
npm run debug-cart
```

This script checks your token configuration and tests cart access.

### Automatic Token Cleanup

The application includes an automatic token cleanup utility that detects invalid tokens on startup and prompts users to log in again if needed.

If you're still experiencing issues after trying these solutions, please contact the development team.

## Available Scripts

- `npm run dev` - Start the server in development mode
- `npm run start` - Start the server in production mode
- `npm run setup-env` - Configure environment variables
- `npm run debug-cart` - Diagnose issues with cart API
- `npm run create-admin` - Create an admin user
- `npm test` - Run tests 