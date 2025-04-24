# Inventory Management System

This document provides comprehensive information about the inventory management system implemented in our e-commerce application.

## Overview

The inventory management system handles:
- Size-specific inventory tracking
- Stock level validation during cart operations
- Real-time inventory updates
- Automatic cart adjustments based on inventory changes

## Product Schema

The product schema includes the following inventory-related fields:

```javascript
{
  // Total inventory count
  countInStock: {
    type: Number,
    required: true,
    default: 0,
  },
  
  // Size-specific inventory
  sizeInventory: {
    type: Map,
    of: Number,
    default: {},
  },
  
  // Available sizes
  sizes: [
    {
      type: String,
    },
  ]
}
```

### Size Inventory

The `sizeInventory` field is a Map that stores inventory counts per size. For example:

```javascript
sizeInventory: {
  "S": 5,
  "M": 10,
  "L": 8,
  "XL": 3
}
```

A pre-save hook calculates the total `countInStock` based on the sum of all size-specific inventory counts.

## Inventory Checking Logic

When checking for inventory availability, the system follows this priority:

1. Check size-specific inventory from `sizeInventory` object
2. If size-specific inventory is unavailable, distribute `countInStock` evenly across available sizes
3. If no sizes are defined, use the total `countInStock` as available for any size

## Cart & Inventory Integration

### Adding to Cart

When a user adds an item to their cart, the server:

1. Checks if the product exists
2. Validates the requested size against available sizes
3. Checks stock availability for the specific size
4. Returns detailed error messages if stock is insufficient
5. Updates the cart with the item if all validations pass

### Updating Cart Quantities

When updating quantities:

1. The system checks current stock levels
2. Validates that requested quantity doesn't exceed available stock
3. Adjusts quantities automatically if stock has decreased
4. Provides user feedback about stock changes

### Automatic Fixes

The `autoFixInventoryIssues` function:
- Removes out-of-stock items from the cart
- Adjusts quantities for items with insufficient stock
- Notifies users about changes made

## UI Components

### StockIndicator

A reusable component that displays stock status based on availability:

```jsx
<StockIndicator item={cartItem} stockLevels={stockLevels} />
```

The component shows:
- Green indicator for in-stock items
- Yellow for low stock (≤ 5 items)
- Warning for items where quantity exceeds stock
- Red for out-of-stock items

### Inventory Management Buttons

The cart includes buttons for:
- **Refresh Stock**: Get latest stock information
- **Fix Inventory Issues**: Automatically adjust cart based on stock
- **Remove Unavailable**: Remove non-existent or out-of-stock items
- **Clear Cart**: Remove all items

## Redux Implementation

### Stock Level Storage

Stock levels are stored in the Redux cart slice:

```javascript
const initialState = {
  items: [],
  loading: false,
  error: null,
  stockLevels: {}, // Stores stock levels by product-size key
  isUserCart: false
};
```

### Inventory Actions

The `setItemStock` action updates inventory information:

```javascript
setItemStock: (state, { payload }) => {
  const { productId, size, availableStock } = payload;
  const stockKey = `${productId}-${size}`;
  
  if (!state.stockLevels) {
    state.stockLevels = {};
  }
  
  state.stockLevels[stockKey] = availableStock;
  
  // Auto-adjust cart quantity if needed
  const item = state.items.find(i => i._id === productId && i.size === size);
  if (item && item.quantity > availableStock) {
    item.quantity = availableStock;
  }
}
```

## API Endpoints

### Stock Check Endpoint

```
GET /api/products/:id
```

Returns product details including:
- Current stock levels (`countInStock`)
- Size-specific inventory (`sizeInventory`)
- Available sizes (`sizes`)

### Cart Validation Endpoints

```
POST /api/cart
PUT /api/cart/:id
```

These endpoints validate inventory before modifying the cart and return appropriate error messages if stock is insufficient.

## Error Handling

If inventory issues occur, the system:

1. Returns HTTP 400 responses with detailed error messages for the client
2. Includes available stock information in the error response
3. Updates Redux state with the latest stock information
4. Displays user-friendly notifications

## Best Practices

1. **Regular Stock Checks**: Implement regular stock checks before checkout
2. **User Feedback**: Always provide clear feedback about stock changes
3. **Auto-Fixing**: Prefer automatic fixes when possible to reduce user friction
4. **Pre-Save Hooks**: Use database hooks to ensure consistency between total and size-specific inventory
5. **Graceful Degradation**: If size-specific inventory is unavailable, fall back to total inventory 