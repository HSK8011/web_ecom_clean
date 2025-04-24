# E-Commerce Web Application

A fully dynamic e-commerce platform built using the MERN stack (MongoDB, Express, React, Node.js) that follows best practices for data storage, user management, and security.

## Features

- User authentication with JWT
- MongoDB integration for all data storage
- Product catalog with categories and search
- Shopping cart functionality
- Order processing and management
- User profile management with address and order history
- Admin dashboard for product, user, and order management
- Responsive design for all devices
- Advanced inventory management with size-specific stock tracking

## Documentation

- [Inventory Management System](docs/InventoryManagement.md) - Detailed documentation on the size-specific inventory system

## Architecture

The application is built with a clear separation between client and server:

- **Server**: Express.js REST API with MongoDB integration
- **Client**: React.js frontend with Redux for state management

## MongoDB Integration

All data is stored in MongoDB collections, including:

- User profiles and credentials
- Product information and inventory
- Orders and order history
- Shopping carts
- Site configuration

No data is stored locally on the server, ensuring scalability and data consistency.

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas cluster)
- npm or yarn

### Environment Variables

Copy the `.env.example` file to `.env` and update the variables:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/shop_db
MONGODB_URI=mongodb://localhost:27017/shop_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd e-commerce-app
   ```

2. Install server dependencies:
   ```
   cd server
   npm install
   ```

3. Install client dependencies:
   ```
   cd ../client
   npm install
   ```

4. Start the development servers:
   ```
   # Start the server (from server directory)
   npm run dev
   
   # Start the client (from client directory)
   npm start
   ```

## Best Practices Implemented

### MongoDB Best Practices

- **Atomic operations**: Using findOneAndUpdate with $set, $push to minimize DB operations
- **Optimized queries**: Using projection to get only required fields
- **Indexes**: Created on frequently queried fields
- **Connection pooling**: Properly configured connection options
- **Error handling**: Comprehensive error handling for MongoDB operations

### Security Best Practices

- **JWT Authentication**: Secure token-based authentication
- **Password hashing**: Using bcrypt for secure password storage
- **Input validation**: Express-validator for all API inputs
- **Protected routes**: Middleware for route protection
- **CORS configuration**: Properly configured for security

### Code Quality

- **Consistent error responses**: Standardized API error format
- **Modular architecture**: Clear separation of routes, models, and middleware
- **Environment variables**: Using dotenv for configuration
- **Logging**: Proper error logging for debugging and monitoring

## API Routes

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user

### User Management
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update user profile
- POST `/api/users/profile/orders` - Add an order to user profile
- GET `/api/users/admin/all` - Get all users (admin only)

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get a single product
- POST `/api/products` - Create a product (admin only)
- PUT `/api/products/:id` - Update a product (admin only)
- DELETE `/api/products/:id` - Delete a product (admin only)

### Orders
- GET `/api/orders` - Get user orders
- GET `/api/orders/:id` - Get order details
- POST `/api/orders` - Create a new order
- PUT `/api/orders/:id/status` - Update order status (admin only)

## License

MIT
