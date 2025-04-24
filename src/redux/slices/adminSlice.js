import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../constants';
import { fetchUserProfile } from './userSlice';

// Admin Product Management Thunks
export const getAdminProducts = createAsyncThunk(
  'admin/getProducts',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { user, token } = getState().auth;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (params.brand) {
        queryParams.append('brand', params.brand);
      }
      
      if (params.category) {
        queryParams.append('category', params.category);
      }
      
      // Handle pagination parameters
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      // Always use a limit, either from parameters or default to 100 for admin view 
      queryParams.append('limit', params.limit || '100');
      
      // Construct the URL with query parameters
      const queryString = queryParams.toString();
      const url = queryString 
        ? `${API_URL}/products?${queryString}` 
        : `${API_URL}/products?limit=100`;
      
      console.log('Admin products API request URL:', url);
      
      const { data } = await axios.get(url, config);
      
      console.log('Admin products API response:', data);
      
      // Handle different response formats (array or object with products property)
      const products = Array.isArray(data) ? data : data.products || [];
      
      // Add pagination metadata to the first product if available
      if (products.length > 0 && data.total) {
        products[0].totalCount = data.total;
        products[0].currentPage = data.currentPage;
        products[0].totalPages = data.totalPages;
      }
      
      // Debug: Check if orange shirt2 is in the API response
      const orangeShirt = products.find(p => p.title === 'orange shirt2' || p.name === 'orange shirt2');
      console.log('Orange shirt2 found in API response:', orangeShirt ? 'Yes' : 'No', orangeShirt);
      
      return products;
    } catch (error) {
      console.error('Error fetching admin products:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const createProduct = createAsyncThunk(
  'admin/createProduct',
  async (productData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      // Make sure we have a valid token
      if (!token) {
        return rejectWithValue('Authentication required. Please log in again.');
      }
      
      // Log the product data for debugging
      console.log('Sending product data:', JSON.stringify(productData));
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.post(
        `${API_URL}/products`, 
        productData, 
        config
      );
      return data;
    } catch (error) {
      console.error('Create product error:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || 'Failed to create product'
      );
    }
  }
);

export const updateProduct = createAsyncThunk(
  'admin/updateProduct',
  async ({ id, productData }, { getState, rejectWithValue }) => {
    try {
      const { user, token } = getState().auth;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.put(
        `${API_URL}/products/${id}`, 
        productData, 
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { user, token } = getState().auth;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      await axios.delete(`${API_URL}/products/${id}`, config);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

export const uploadProductImage = createAsyncThunk(
  'admin/uploadImage',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { user, token } = getState().auth;
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.post(
        `${API_URL}/upload`, 
        formData, 
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload image');
    }
  }
);

export const createDiscount = createAsyncThunk(
  'admin/createDiscount',
  async ({ productId, discountData }, { getState, rejectWithValue }) => {
    try {
      const { user, token } = getState().auth;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.post(
        `${API_URL}/admin/products/${productId}/discount`, 
        discountData, 
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create discount');
    }
  }
);

export const deleteProductImage = createAsyncThunk(
  'admin/deleteImage',
  async ({ productId, imageId }, { getState, rejectWithValue }) => {
    try {
      const { user, token } = getState().auth;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      await axios.delete(
        `${API_URL}/admin/products/${productId}/images/${imageId}`, 
        config
      );
      return { productId, imageId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete image');
    }
  }
);

// Admin Order Management
export const getAdminOrders = createAsyncThunk(
  'admin/getOrders',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user, token } = getState().auth;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.get(`${API_URL}/admin/orders`, config);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ orderId, status, trackingNumber, notes }, { getState, rejectWithValue, dispatch }) => {
    try {
      const { token } = getState().auth;
      
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log(`Updating order ${orderId} status to ${status}`);
      
      const { data } = await axios.put(
        `${API_URL}/admin/orders/${orderId}/status`,
        { status, trackingNumber, notes },
        config
      );
      
      // Refresh user profile data to update orders in profile page
      dispatch(fetchUserProfile());
      
      return data;
    } catch (error) {
      console.error('Error updating order status:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update order status'
      );
    }
  }
);

// Get admin dashboard metrics
export const getAdminMetrics = createAsyncThunk(
  'admin/getMetrics',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log('Fetching admin metrics with token:', token ? 'Token present' : 'No token');
      
      const { data } = await axios.get(`${API_URL}/orders/admin/metrics`, config);
      console.log('Admin metrics response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching admin metrics:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch metrics'
      );
    }
  }
);

// Get recent orders
export const getRecentOrders = createAsyncThunk(
  'admin/getRecentOrders',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log('Fetching recent orders with token:', token ? 'Token present' : 'No token');
      
      const { data } = await axios.get(`${API_URL}/admin/orders?limit=5`, config);
      console.log('Recent orders response:', data);
      return data.orders || data;
    } catch (error) {
      console.error('Error fetching recent orders:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch recent orders'
      );
    }
  }
);

// Get all orders with pagination
export const getAllOrders = createAsyncThunk(
  'admin/getAllOrders',
  async ({ page = 1, limit = 10, status = '' }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.get(
        `/api/admin/orders?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`, 
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Get all users with pagination
export const getAllUsers = createAsyncThunk(
  'admin/getAllUsers',
  async ({ page = 1, limit = 10 }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.get(
        `/api/admin/users?page=${page}&limit=${limit}`, 
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Get all products with pagination (admin view)
export const getAdminProductsPaginated = createAsyncThunk(
  'admin/getProductsPaginated',
  async ({ page = 1, limit = 10, filter = '' }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.get(
        `/api/admin/products?page=${page}&limit=${limit}${filter ? `&filter=${filter}` : ''}`, 
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Get admin dashboard data (comprehensive endpoint)
export const getAdminDashboard = createAsyncThunk(
  'admin/getDashboard',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log('Fetching admin dashboard data with token:', token ? 'Token present' : 'No token');
      
      const { data } = await axios.get(`${API_URL}/admin/dashboard`, config);
      console.log('Admin dashboard response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching admin dashboard:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch dashboard data'
      );
    }
  }
);

// Get a single order by ID (admin view)
export const getOrderDetails = createAsyncThunk(
  'admin/getOrderDetails',
  async (orderId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log(`Fetching order details for ID: ${orderId}`);
      
      const { data } = await axios.get(`${API_URL}/admin/orders/${orderId}`, config);
      return data;
    } catch (error) {
      console.error('Error fetching order details:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch order details'
      );
    }
  }
);

// Initial state
const initialState = {
  products: [],
  productsPaginated: {
    products: [],
    page: 1,
    pages: 1,
    total: 0
  },
  orders: [],
  loading: false,
  error: null,
  success: false,
  uploadedImage: null,
  deleteSuccess: false,
  updateSuccess: false,
  createSuccess: false,
  uploadSuccess: false,
  discountSuccess: false,
  imageDeleteSuccess: false,
  metrics: null,
  recentOrders: [],
  dashboardData: null,
  orders: {
    orders: [],
    page: 1,
    pages: 1,
    total: 0
  },
  users: {
    users: [],
    page: 1,
    pages: 1,
    total: 0
  },
  updateLoading: false,
  orderDetails: null,
};

// Admin Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    resetAdminSuccess: (state) => {
      state.success = false;
      state.deleteSuccess = false;
      state.updateSuccess = false;
      state.createSuccess = false;
      state.uploadSuccess = false;
      state.discountSuccess = false;
      state.imageDeleteSuccess = false;
    },
    clearUploadedImage: (state) => {
      state.uploadedImage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Admin Products
      .addCase(getAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(getAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.products = [];
      })
      
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.createSuccess = true;
        state.products = [action.payload, ...state.products];
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.updateSuccess = true;
        const index = state.products.findIndex(
          (product) => product._id === action.payload._id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.deleteSuccess = true;
        state.products = state.products.filter(
          (product) => product._id !== action.payload
        );
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Upload Product Image
      .addCase(uploadProductImage.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadProductImage.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadSuccess = true;
        state.uploadedImage = action.payload;
      })
      .addCase(uploadProductImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Discount
      .addCase(createDiscount.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDiscount.fulfilled, (state, action) => {
        state.loading = false;
        state.discountSuccess = true;
        const index = state.products.findIndex(
          (product) => product._id === action.payload._id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(createDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Product Image
      .addCase(deleteProductImage.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProductImage.fulfilled, (state, action) => {
        state.loading = false;
        state.imageDeleteSuccess = true;
        const { productId, imageId } = action.payload;
        const productIndex = state.products.findIndex(p => p._id === productId);
        if (productIndex !== -1) {
          state.products[productIndex].images = state.products[productIndex].images.filter(
            img => img._id !== imageId
          );
        }
      })
      .addCase(deleteProductImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Admin Orders
      .addCase(getAdminOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(getAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.success = true;
        
        // Update order in recentOrders
        if (state.recentOrders.length > 0) {
          state.recentOrders = state.recentOrders.map(order => 
            order._id === action.payload._id ? action.payload : order
          );
        }
        
        // Update order in orders list
        if (state.orders.orders.length > 0) {
          state.orders.orders = state.orders.orders.map(order => 
            order._id === action.payload._id ? action.payload : order
          );
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      
      // Get admin metrics
      .addCase(getAdminMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(getAdminMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get recent orders
      .addCase(getRecentOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRecentOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.recentOrders = action.payload;
      })
      .addCase(getRecentOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get all orders
      .addCase(getAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = {
          orders: action.payload.orders,
          page: action.payload.page,
          pages: action.payload.pages,
          total: action.payload.total
        };
      })
      .addCase(getAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get all users
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = {
          users: action.payload.users,
          page: action.payload.page,
          pages: action.payload.pages,
          total: action.payload.total
        };
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get all products
      .addCase(getAdminProductsPaginated.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminProductsPaginated.fulfilled, (state, action) => {
        state.loading = false;
        state.productsPaginated = {
          products: action.payload.products,
          page: action.payload.page,
          pages: action.payload.pages,
          total: action.payload.total
        };
      })
      .addCase(getAdminProductsPaginated.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Dashboard
      .addCase(getAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardData = action.payload;
        state.metrics = action.payload.metrics;
        state.recentOrders = action.payload.recentOrders;
        state.error = null;
      })
      .addCase(getAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Order Details
      .addCase(getOrderDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.orderDetails = action.payload;
        state.error = null;
      })
      .addCase(getOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminError, resetAdminSuccess, clearUploadedImage } = adminSlice.actions;
export default adminSlice.reducer; 