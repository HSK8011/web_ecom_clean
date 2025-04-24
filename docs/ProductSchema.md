# Product Schema Documentation

## Overview

This document explains the Product schema used in the application and how to handle any inconsistencies between the `title` and `name` fields.

## Schema Definition

The core Product schema is defined in `server/models/productModel.js`. The primary fields are:

- `title`: The official name of the product (this is the field stored in the database)
- `name`: A virtual property that maps to the `title` field for backward compatibility
- `images`: Array of image URLs
- `brand`: The brand name
- `category`: The product category
- `description`: Product description
- `price`: The product price
- `countInStock`: Total available stock
- `sizeInventory`: Map of size to stock count
- `sizes`: Array of available sizes
- `colors`: Array of available colors
- `discount`: Discount information (percentage, start date, end date, active status)

## Title vs Name Field

Historically, the application has had inconsistency between using `title` and `name` fields:

- The database schema uses `title` as the primary field
- Some frontend components reference `name` instead of `title`

To address this inconsistency, we've implemented the following solutions:

1. Added a virtual property `name` to the Product schema that returns the `title` value
2. Added a setter for the `name` virtual property that updates `title`
3. Created utility functions in `src/utils/productHelpers.js` for consistent product name handling

## Best Practices for Working with Products

When working with product data in this application, follow these practices:

### Backend

- Always save the product name to the `title` field in the database
- When receiving data from frontend forms, accept both `title` and `name` but store in `title`
- Use the provided utility functions to handle both properties consistently

### Frontend

- Use the `getProductDisplayName(product)` function to display product names consistently
- When submitting forms, you can use either `name` or `title` field - both will be handled correctly

Example using the helper function:

```jsx
import { getProductDisplayName } from '../utils/productHelpers';

// Later in your component:
const productName = getProductDisplayName(product);
```

## Future Improvements

Long term, we should standardize on a single field name to avoid confusion. The recommended approach would be:

1. Continue using `title` as the database field
2. Update all frontend components to use `title` consistently
3. Keep the virtual `name` property for backward compatibility, but prefer `title` in new code

This approach ensures backward compatibility while moving toward a more consistent naming convention. 