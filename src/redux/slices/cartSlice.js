import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';
import axios from 'axios';

// Helper function to process cart items and ensure proper structure
const processCartItems = (items = []) => {
  return items.map(item => {
    // Ensure the product is an object with the minimum required fields
    let processedItem = {...item};
    
    if (typeof item.product !== 'object' || !item.product) {
      // Create a product object if it's just an ID
      processedItem.product = {
        _id: item.product || item._id,
        name: item.name,
        image: item.image,
      };
    } else if (!item.product.name) {
      // Ensure product object has required fields
      processedItem.product = {
        ...item.product,
        name: item.product.name || item.name || 'Product',
        image: item.product.image || item.image
      };
    }
    
    // Add displayName and displayImage for easier access in components
    processedItem.displayName = processedItem.product.name || item.name || 'Product';
    processedItem.displayImage = processedItem.product.image || item.image;
    
    return processedItem;
  });
};

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Async thunks for MongoDB cart operations
export const fetchUserCart = createAsyncThunk(
  'cart/fetchUserCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/cart');
      // Validate product IDs in the fetched cart
      const validItems = response.data.items.filter(item => isValidObjectId(item.productId));
      if (validItems.length !== response.data.items.length) {
        console.warn('Some items were removed from cart due to invalid product IDs');
      }
      return { ...response.data, items: validItems };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch cart');
    }
  }
);

export const addItemToUserCart = createAsyncThunk(
  'cart/addItemToUserCart',
  async (item, { rejectWithValue, dispatch }) => {
    try {
      console.log('Adding item to user cart:', item);
      
      const productId = item._id || item.productId;
      if (!productId) {
        return rejectWithValue('Product ID is missing');
      }

      // Validate product ID format
      if (!isValidObjectId(productId)) {
        return rejectWithValue('Invalid product ID format');
      }
      
      try {
        const { data } = await api.post('/api/cart', {
          productId: productId,
          quantity: item.quantity,
          color: item.color,
          size: item.size
        });
        
        return data;
      } catch (error) {
        // Handle inventory errors with more detail
        if (error.response?.data?.availableStock !== undefined) {
          // If we get back available stock info, we can use it to update the UI
          const availableStock = error.response.data.availableStock;
          dispatch(setItemStock({
            productId,
            size: item.size,
            availableStock
          }));
        }
        
        throw error; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error('Error adding item to user cart:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add item to cart');
    }
  }
);

export const updateUserCartItem = createAsyncThunk(
  'cart/updateUserCartItem',
  async ({ itemId, quantity }, { rejectWithValue, getState, dispatch }) => {
    try {
      console.log('Updating user cart item:', { itemId, quantity });
      
      if (!itemId) {
        return rejectWithValue('Item ID is missing');
      }
      
      try {
        const { data } = await api.put(`/api/cart/${itemId}`, { quantity });
        return data;
      } catch (error) {
        // Handle inventory errors with more detail
        if (error.response?.data?.availableStock !== undefined) {
          // Get the size for this item from the current state
          const { cart } = getState();
          const item = cart.items.find(i => i._id.toString() === itemId);
          
          if (item) {
            // If we get back available stock info, we can use it to update the UI
            const availableStock = error.response.data.availableStock;
            dispatch(setItemStock({
              productId: item.product,
              size: item.size,
              availableStock
            }));
          }
        }
        
        throw error; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart item');
    }
  }
);

export const removeUserCartItem = createAsyncThunk(
  'cart/removeUserCartItem',
  async (itemId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/api/cart/${itemId}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove cart item');
    }
  }
);

export const clearUserCart = createAsyncThunk(
  'cart/clearUserCart',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.delete('/api/cart');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

export const createOrder = createAsyncThunk(
  'cart/createOrder',
  async ({ shippingAddress, paymentMethod }, { getState, rejectWithValue }) => {
    try {
      const { cart } = getState();
      console.log('Creating order with cart items:', JSON.stringify(cart.items, null, 2));
      
      // Map items, handling different possible product structures
      const orderItems = cart.items.map(item => {
        // Extract product ID - handling both object and string cases
        const productId = 
          (typeof item.product === 'object' && item.product) 
            ? item.product._id 
            : item.product || item._id;
            
        // Get product name from all possible sources
        const productName = 
          (typeof item.product === 'object' && item.product && item.product.name)
            ? item.product.name
            : (item.displayName || item.name || 'Product');
            
        // Get product image from all possible sources
        const productImage = 
          (typeof item.product === 'object' && item.product && item.product.image)
            ? item.product.image
            : (item.displayImage || item.image || '/images/placeholder.png');
            
        // Return properly structured order item
        return {
          product: productId,
          quantity: item.quantity,
          price: item.price,
          name: productName,
          image: productImage,
          size: item.size || '',
          color: item.color || ''
        };
      });
      
      // Ensure we have valid order data
      if (!orderItems.length) {
        console.error('No valid items in cart for order creation');
        return rejectWithValue('Cart is empty or contains invalid items');
      }
      
      // Calculate total amount if not available
      const totalAmount = cart.totalAmount || orderItems.reduce(
        (total, item) => total + (item.price * item.quantity), 0
      );

      const orderData = {
        items: orderItems,
        totalAmount,
        shippingAddress,
        paymentMethod
      };

      console.log('Sending order data:', JSON.stringify(orderData, null, 2));
      const { data } = await api.post('/api/orders', orderData);
      return data;
    } catch (error) {
      console.error('Order creation failed:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to create order');
    }
  }
);

export const loadGuestCart = createAsyncThunk(
  'cart/loadGuestCart',
  async () => {
    const guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    // Validate product IDs in the guest cart
    const validItems = guestCart.items.filter(item => isValidObjectId(item.productId));
    if (validItems.length !== guestCart.items.length) {
      console.warn('Some items were removed from guest cart due to invalid product IDs');
      // Update localStorage with valid items only
      localStorage.setItem('guestCart', JSON.stringify({ ...guestCart, items: validItems }));
    }
    return { ...guestCart, items: validItems };
  }
);

const initialState = {
  items: localStorage.getItem('guestCartItems')
    ? JSON.parse(localStorage.getItem('guestCartItems'))
    : [],
  shippingAddress: localStorage.getItem('shippingAddress')
    ? JSON.parse(localStorage.getItem('shippingAddress'))
    : {},
  paymentMethod: localStorage.getItem('paymentMethod')
    ? localStorage.getItem('paymentMethod')
    : '',
  loading: false,
  error: null,
  dbCartId: null,
  isUserCart: false,
  stockLevels: {}
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Guest cart actions (local storage)
    addToGuestCart: (state, { payload }) => {
      console.log('Adding to guest cart:', payload);
      
      const productId = payload._id || payload.productId;
      if (!productId) {
        console.error('Product ID is missing in cart payload');
        return;
      }

      // Validate product ID format
      if (!isValidObjectId(productId)) {
        console.error('Invalid product ID format:', productId);
        return;
      }
      
      // Enforce stock limits
      const quantity = Math.min(payload.quantity, payload.stock || 999);
      
      // Ensure we have product name and image
      const productName = payload.name || payload.title || 'Product';
      let productImage = payload.image;
      
      // If no image or image is a placeholder, try to get a better one
      if (!productImage || productImage.includes('placeholder')) {
        if (payload.images && payload.images.length > 0) {
          productImage = payload.images[0];
        }
      }
      
      const existingItem = state.items.find(
        (item) => 
          (item._id === productId || (item.productId && item.productId === productId)) && 
          item.size === payload.size && 
          item.color === payload.color
      );

      if (existingItem) {
        // Check if adding would exceed stock
        if (existingItem.quantity + quantity > (payload.stock || 999)) {
          // Update to max stock instead
          state.items = state.items.map((item) =>
            (item._id === existingItem._id || 
             (item.productId && item.productId === existingItem.productId)) &&
            item.size === existingItem.size &&
            item.color === existingItem.color
              ? { 
                  ...item, 
                  quantity: payload.stock || item.quantity,
                  // Update product info in case it changed
                  name: productName,
                  image: productImage || item.image
                }
              : item
          );
        } else {
          // Add the quantities as normal
          state.items = state.items.map((item) =>
            (item._id === existingItem._id || 
             (item.productId && item.productId === existingItem.productId)) &&
            item.size === existingItem.size &&
            item.color === existingItem.color
              ? { 
                  ...item, 
                  quantity: item.quantity + quantity,
                  // Update product info in case it changed
                  name: productName,
                  image: productImage || item.image
                }
              : item
          );
        }
      } else {
        // Add new item with the validated quantity
        state.items.push({
          ...payload,
          _id: productId,
          productId: productId,
          quantity: quantity,
          name: productName,
          image: productImage || '/images/placeholder.png'
        });
      }

      localStorage.setItem('guestCartItems', JSON.stringify(state.items));
    },
    
    updateGuestCartItem: (state, { payload }) => {
      console.log('Updating guest cart item:', payload);
      
      const productId = payload._id || payload.productId;
      if (!productId) {
        console.error('Product ID is missing in cart update payload');
        return;
      }
      
      // Ensure we have valid name and image data
      const productName = payload.name || payload.title || 'Product';
      let productImage = payload.image;
      
      // If no image or image is a placeholder, check if it was saved in a better format
      if (!productImage || (typeof productImage === 'string' && productImage.includes('placeholder'))) {
        if (payload.images && payload.images.length > 0) {
          productImage = payload.images[0];
        }
      }
      
      state.items = state.items.map((item) => {
        if ((item._id === productId || 
            (item.productId && item.productId === productId)) &&
            item.size === payload.size &&
            item.color === payload.color) {
          
          // Create updated item with preserving existing image/name if better than payload
          return { 
            ...item, 
            ...payload,
            quantity: payload.quantity,
            // Only update name and image if provided or keep existing ones if better
            name: productName || item.name,
            image: productImage || item.image,
            _id: productId, // Ensure ID is preserved
            productId: productId // Ensure productId is preserved
          };
        }
        return item;
      });
      localStorage.setItem('guestCartItems', JSON.stringify(state.items));
    },
    
    removeFromGuestCart: (state, { payload }) => {
      console.log('Removing from guest cart:', payload);
      
      const productId = payload._id || payload.productId;
      if (!productId) {
        console.error('Product ID is missing in cart remove payload');
        return;
      }
      
      state.items = state.items.filter(
        (item) => 
          !((item._id === productId || (item.productId && item.productId === productId)) && 
            item.size === payload.size && 
            item.color === payload.color)
      );
      localStorage.setItem('guestCartItems', JSON.stringify(state.items));
    },
    
    clearGuestCart: (state) => {
      state.items = [];
      localStorage.setItem('guestCartItems', JSON.stringify([]));
    },
    
    // Common actions
    saveShippingAddress: (state, { payload }) => {
      state.shippingAddress = payload;
      localStorage.setItem('shippingAddress', JSON.stringify(payload));
    },
    
    savePaymentMethod: (state, { payload }) => {
      state.paymentMethod = payload;
      localStorage.setItem('paymentMethod', payload);
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear cart - works for both user and guest cart
    clearCart: (state) => {
      state.items = [];
      if (state.isUserCart) {
        // This will trigger a backend API call to clear the user's cart
        // But we clear the state immediately for better UX
      } else {
        localStorage.setItem('guestCartItems', JSON.stringify([]));
      }
    },
    
    // User login/logout
    switchToUserCart: (state, { payload }) => {
      // When user logs in, switch to their DB cart
      state.items = payload.items || [];
      state.dbCartId = payload._id;
      state.isUserCart = true;
      localStorage.removeItem('guestCartItems'); // Clear guest cart
    },
    
    switchToGuestCart: (state) => {
      // When user logs out, switch to guest cart
      state.items = [];
      state.dbCartId = null;
      state.isUserCart = false;
      // Load any saved guest cart
      const guestCart = localStorage.getItem('guestCartItems');
      if (guestCart) {
        state.items = JSON.parse(guestCart);
      }
    },
    
    // Add this new reducer to update stock levels for specific items
    setItemStock: (state, { payload }) => {
      const { productId, size, availableStock } = payload;
      
      // Create a stock key in the same format used by the Cart component
      const stockKey = `${productId}-${size}`;
      
      // Add/update to the stockLevels object
      if (!state.stockLevels) {
        state.stockLevels = {};
      }
      
      state.stockLevels[stockKey] = availableStock;
      
      // Auto-update quantity if needed
      const item = state.items.find(item => 
        (item.product === productId || item._id === productId) && 
        item.size === size
      );
      
      if (item && item.quantity > availableStock) {
        // Update the item quantity to match available stock
        item.quantity = availableStock;
      }
    },

    // Add a new action to remove invalid items
    removeInvalidItems: (state) => {
      // Filter out items with invalid product IDs
      state.items = state.items.filter(item => {
        const productId = item._id || item.productId || (typeof item.product === 'object' ? item.product._id : item.product);
        return isValidObjectId(productId);
      });
      
      // Update localStorage for guest cart
      if (!state.isUserCart) {
        localStorage.setItem('guestCartItems', JSON.stringify(state.items));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user cart
      .addCase(fetchUserCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserCart.fulfilled, (state, { payload }) => {
        state.loading = false;
        
        // Process the cart items to ensure all items have proper product objects
        const processedItems = processCartItems(payload.items);
        
        state.items = processedItems;
        state.dbCartId = payload._id;
        state.isUserCart = true;
      })
      .addCase(fetchUserCart.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      
      // Add item
      .addCase(addItemToUserCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addItemToUserCart.fulfilled, (state, { payload }) => {
        state.loading = false;
        
        // Process the cart items to ensure all items have proper product objects
        const addItemProcessedItems = processCartItems(payload.items);
        
        state.items = addItemProcessedItems;
        state.dbCartId = payload._id;
      })
      .addCase(addItemToUserCart.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      
      // Update item
      .addCase(updateUserCartItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserCartItem.fulfilled, (state, { payload }) => {
        state.loading = false;
        
        // Process the cart items to ensure all items have proper product objects
        const updateItemProcessedItems = processCartItems(payload.items);
        
        state.items = updateItemProcessedItems;
      })
      .addCase(updateUserCartItem.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      
      // Remove item
      .addCase(removeUserCartItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeUserCartItem.fulfilled, (state, { payload }) => {
        state.loading = false;
        
        // Process the cart items to ensure all items have proper product objects
        const removeItemProcessedItems = processCartItems(payload.items);
        
        state.items = removeItemProcessedItems;
      })
      .addCase(removeUserCartItem.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      
      // Clear user cart
      .addCase(clearUserCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearUserCart.fulfilled, (state) => {
        state.items = [];
        state.loading = false;
      })
      .addCase(clearUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create order
      .addCase(createOrder.fulfilled, (state) => {
        // Clear cart after successful order
        state.items = [];
        state.totalItems = 0;
        state.totalAmount = 0;
        localStorage.removeItem('cartItems');
      });
  }
});

export const {
  addToGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  clearGuestCart,
  saveShippingAddress,
  savePaymentMethod,
  clearError,
  switchToUserCart,
  switchToGuestCart,
  clearCart,
  setItemStock,
  removeInvalidItems
} = cartSlice.actions;

export default cartSlice.reducer; 