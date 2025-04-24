# Cart Inventory Management

This directory contains components for managing cart inventory and handling inventory-related issues.

## Features

### 1. Stock Level Checking

The cart system checks stock levels for all items to ensure that users can't checkout with:
- Out-of-stock items
- Items with insufficient stock

### 2. Auto-Fix Inventory Issues

The `autoFixInventoryIssues` function automatically:
- Removes items that are out of stock
- Adjusts quantities for items that have insufficient stock
- Shows a toast notification with details of changes made

### 3. Stock Indicators

The `StockIndicator` component provides visual feedback about item stock:
- Green: Item is in stock with sufficient quantity
- Yellow: Item is low in stock (5 or fewer available)
- Yellow warning: Item quantity exceeds available stock
- Red: Item is out of stock

### 4. Size-Specific Inventory

The system handles size-specific inventory in the following priority:
1. Check size-specific inventory from `sizeInventory` object (e.g., `sizeInventory.M = 5`)
2. Check size inventory from array format if object format not available
3. If no size-specific inventory exists, distribute `countInStock` evenly across available sizes

## Components

### `CartCleanup.jsx`

Handles issues with problematic products in the cart, particularly those that may cause errors during checkout.

### `CartErrorHandler.jsx`

Provides error handling functionality for the cart, displaying friendly error messages and recovery options.

## Usage

### Adding the Auto-Fix Button to Cart

```jsx
<Button 
  variant="outlined" 
  onClick={autoFixInventoryIssues}
  color="success"
  startIcon={<FaSyncAlt />}
  size="small"
>
  Fix Inventory Issues
</Button>
```

### Using the StockIndicator Component

```jsx
<StockIndicator item={item} />
```

## Troubleshooting

If you encounter issues with item quantities or stock levels:

1. Click the "Refresh Stock" button to get the latest stock information
2. Use the "Fix Inventory Issues" button to automatically adjust quantities
3. Use the "Remove Unavailable" button to remove items that no longer exist
4. If problems persist, use "Clear Cart" to start fresh

## Redux Integration

The cart system integrates with Redux to manage stock levels:

1. Local stock levels are stored in component state
2. Redux stock levels take precedence when both are available
3. Stock updates from the server are dispatched to Redux via the `setItemStock` action

## Implementation Details

The stock level checks include mechanisms for:
- Retrying failed requests
- Handling different formats of size inventory data
- Caching product data to reduce API calls
- Automatic updates when stock changes 