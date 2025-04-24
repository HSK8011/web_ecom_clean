import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

// Fetch all products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (params.category) {
        queryParams.append('category', params.category);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      if (params.search) {
        queryParams.append('search', params.search);
      }
      
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }
      
      const queryString = queryParams.toString();
      const url = queryString ? `/products?${queryString}` : '/products';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

// Fetch product by ID
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

// Add product
export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('Error in addProduct thunk:', error);
      
      // Check for response error details
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      'Failed to add product';
                      
      // If there are detailed field errors, include them
      const errorDetails = error.response?.data?.details;
      if (errorDetails) {
        console.error('Error details:', errorDetails);
        
        // Format detailed field errors into a more readable message
        const fieldErrors = errorDetails
          .map(detail => `${detail.field}: ${detail.message}`)
          .join(', ');
        
        return rejectWithValue(`${errorMsg}. Details: ${fieldErrors}`);
      }
      
      return rejectWithValue(errorMsg);
    }
  }
);

// Update product
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error('Error in updateProduct thunk:', error);
      
      // Check for response error details
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      'Failed to update product';
                      
      // If there are detailed field errors, include them
      const errorDetails = error.response?.data?.details;
      if (errorDetails) {
        console.error('Error details:', errorDetails);
        
        // Format detailed field errors into a more readable message
        const fieldErrors = errorDetails
          .map(detail => `${detail.field}: ${detail.message}`)
          .join(', ');
        
        return rejectWithValue(`${errorMsg}. Details: ${fieldErrors}`);
      }
      
      return rejectWithValue(errorMsg);
    }
  }
);

// Delete product
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

// Add review to a product
export const addReview = createAsyncThunk(
  'products/addReview',
  async ({ productId, rating, comment }, { getState }) => {
    const response = await api.post(`/products/${productId}/reviews`, {
      rating,
      comment
    });
    return response.data;
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    selectedProduct: null,
    status: 'idle',
    error: null,
    totalPages: 1,
    currentPage: 1
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = Array.isArray(action.payload.products) ? action.payload.products : [];
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch products';
      })
      // Handle fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedProduct = action.payload;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch product';
      })
      // Handle addProduct
      .addCase(addProduct.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // Handle updateProduct
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedProduct?._id === action.payload._id) {
          state.selectedProduct = action.payload;
        }
      })
      // Handle deleteProduct
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item._id !== action.payload);
        if (state.selectedProduct?._id === action.payload) {
          state.selectedProduct = null;
        }
      })
      // Handle addReview
      .addCase(addReview.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedProduct = action.payload;
      })
      .addCase(addReview.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const { clearError, clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer; 