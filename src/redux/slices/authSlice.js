import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../../config/api';
import { fetchUserCart, switchToGuestCart } from './cartSlice';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      console.log('Login response:', data); // Debug log
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      setAuthToken(data.token);
      
      // After successful login, fetch user's cart from MongoDB
      const guestCartItems = JSON.parse(localStorage.getItem('guestCartItems') || '[]');
      
      // Only merge if there are items in the guest cart
      if (guestCartItems.length > 0) {
        // Merge guest cart into user cart
        await api.post('/api/cart/merge', { guestCartItems });
      }
      
      // Then fetch the updated cart
      dispatch(fetchUserCart());
      
      return data;
    } catch (error) {
      console.error('Login error:', error); // Debug log
      return rejectWithValue(error.response?.data.error || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      setAuthToken(data.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data.error || 'Registration failed');
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/users/profile');
      console.log('Profile data:', data); // Debug log
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data.error || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('authSlice - updating profile with:', userData);
      
      // Ensure we have proper formatting for all fields
      const sanitizedData = {
        ...userData,
        phone: userData.phone || '',
        address: {
          street: userData.address?.street || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          zipCode: userData.address?.zipCode || '',
          country: userData.address?.country || ''
        }
      };
      
      const { data } = await api.put('/users/profile', sanitizedData);
      console.log('authSlice - profile update response:', data);
      
      // If the response has a user property, use that, otherwise use the response directly
      const updatedUserData = data && data.user ? data.user : data;
      
      // Save to localStorage
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      return updatedUserData;
    } catch (error) {
      console.error('authSlice - profile update error:', error);
      return rejectWithValue(error.response?.data.error || 'Failed to update profile');
    }
  }
);

const initialState = {
  token: localStorage.getItem('token'),
  user: (() => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
      localStorage.removeItem('userData'); // Remove corrupted data
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  status: 'idle'
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      setAuthToken(null);
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = 'loading';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          ...action.payload.user,
          token: action.payload.token
        };
        state.token = action.payload.token;
        state.error = null;
        state.status = 'succeeded';
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload;
        state.status = 'failed';
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = 'loading';
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          ...action.payload.user,
          token: action.payload.token
        };
        state.token = action.payload.token;
        state.error = null;
        state.status = 'succeeded';
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload;
        state.status = 'failed';
      })
      // Get Profile
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        console.log('Updated user profile:', action.payload); // Debug log
        state.error = null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload) {
          // Completely replace user data with the server response
          const userData = action.payload.user || action.payload;
          state.user = userData;
          
          // Also update localStorage
          try {
            localStorage.setItem('userData', JSON.stringify(userData));
            console.log('authSlice: Updated user data in localStorage');
          } catch (err) {
            console.error('Error saving user data to localStorage:', err);
          }
        }
        
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout: logoutAction } = authSlice.actions;

export const logout = () => (dispatch) => {
  dispatch(logoutAction());
  dispatch(switchToGuestCart());
};

export default authSlice.reducer;