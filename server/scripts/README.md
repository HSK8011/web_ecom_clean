# Server Scripts

This directory contains utility scripts for managing and debugging the SHOP.CO server application.

## Environment Setup

### Setup Environment Variables

```bash
npm run setup-env
```

This script helps set up your environment variables for development or production. It checks for important security configurations like `JWT_SECRET` and guides you through setting them up properly. It will also help configure inventory caching settings.

## Inventory Management

### Clear Inventory Cache

```bash
# Clear all inventory cache
npm run cache-clear

# Clear cache for a specific product
npm run cache-clear -- --product=productId

# Clear cache for a specific product size
npm run cache-clear -- --product=productId --size=XL
```

This script allows you to clear the inventory cache manually. The cache improves performance by reducing database queries for inventory checks, but you may need to clear it if you notice discrepancies between cached and actual inventory levels.

## Debugging Tools

### Debug Cart API

```bash
npm run debug-cart
```

This script helps diagnose issues with the cart API by testing various API endpoints and checking for common problems. It provides detailed output about your cart configuration and potential issues.

### Create Admin User

```bash
npm run create-admin
```

Creates an admin user for the application, which is necessary for accessing admin features.

## How Inventory Caching Works

The inventory caching system improves performance by:

1. **Reducing Database Queries**: Instead of checking the database for every stock verification, the system stores stock data in memory.

2. **Time-Based Expiration**: Cached data automatically expires after a configurable time period (default: 5 minutes), ensuring data doesn't become stale.

3. **Automatic Updates**: When cart actions occur (add/update/remove), the cache is automatically updated to reflect the change.

4. **Size-Specific Caching**: Stock levels are cached both at the product level and for individual sizes, improving performance for size-specific inventory checks.

### Configuration

The inventory cache can be configured through environment variables:

- `INVENTORY_CACHE_DURATION`: Time in milliseconds before cached data expires (default: 300000ms = 5 minutes)

You can set this value by running the `setup-env` script or by manually editing your `.env` file.

## Best Practices

- Run `npm run setup-env` when setting up a new development environment
- Use `npm run cache-clear` if you notice inventory discrepancies
- For production deployments, adjust `INVENTORY_CACHE_DURATION` based on your traffic patterns 