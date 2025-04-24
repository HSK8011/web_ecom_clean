import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

// Async thunk for fetching profile data
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      // Force fresh data from server - don't use cached data
      const response = await api.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        // Force timestamp parameter to bypass cache
        params: { _t: new Date().getTime() }
      });
      
      console.log('Profile API response (fresh):', response.data);
      
      // Log order summary specifically for debugging
      if (response.data && response.data.orderSummary) {
        console.log('Order summary from API:', response.data.orderSummary);
      } else if (response.data && response.data.recentOrders) {
        console.log('Recent orders count:', response.data.recentOrders.length);
        
        // If orderSummary is missing but we have recentOrders, calculate it
        if (!response.data.orderSummary && Array.isArray(response.data.recentOrders)) {
          const totalOrders = response.data.recentOrders.length;
          const totalSpent = response.data.recentOrders.reduce((sum, order) => 
            sum + (Number(order.totalAmount) || Number(order.totalPrice) || 0), 0);
          
          console.log('Calculated order summary:', { totalOrders, totalSpent });
          
          // Add the calculated summary to the response
          response.data.orderSummary = { totalOrders, totalSpent };
        }
      }
      
      // Store in localStorage to ensure consistency
      if (response.data && response.data.user) {
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      } else if (response.data) {
        localStorage.setItem('userData', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

// Async thunk for updating profile
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue, getState, dispatch }) => {
    try {
      console.log('userSlice - STARTING UPDATE with data:', profileData);
      
      const { token } = getState().auth;
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      // Ensure address fields are included with default values if missing
      const sanitizedData = {
        ...profileData,
        phone: profileData.phone || '',
        address: {
          street: profileData.address?.street || '',
          city: profileData.address?.city || '',
          state: profileData.address?.state || '',
          zipCode: profileData.address?.zipCode || '',
          country: profileData.address?.country || ''
        }
      };
      
      console.log('userSlice - Sending sanitized data to API:', JSON.stringify(sanitizedData, null, 2));

      const response = await api.put('/users/profile', sanitizedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('userSlice - RAW API response:', response);
      console.log('userSlice - Profile API response data:', JSON.stringify(response.data, null, 2));
      
      // Detailed logging of specific fields we're having trouble with
      if (response.data && response.data.user) {
        console.log('userSlice - Phone in response:', response.data.user.phone);
        console.log('userSlice - Address in response:', response.data.user.address);
      } else if (response.data) {
        console.log('userSlice - Phone in response:', response.data.phone);
        console.log('userSlice - Address in response:', response.data.address);
      }
      
      // After successful update, update the auth state as well
      try {
        // Make sure we handle the new response structure
        const userData = response.data && response.data.user ? response.data.user : response.data;
        
        // Only save to localStorage if userData is defined and not null
        if (userData) {
          localStorage.setItem('userData', JSON.stringify(userData));
          console.log('userSlice - Saved user data to localStorage. Phone:', userData.phone, 'Address:', userData.address);
        } else {
          console.warn('No user data to save to localStorage');
        }
      } catch (err) {
        console.error('Error saving user data to localStorage:', err);
      }
      
      return response.data;
    } catch (error) {
      console.error('userSlice - Update error:', error);
      return rejectWithValue(error.response?.data.error || 'Failed to update profile');
    }
  }
);

const initialState = {
  user: null,
  recentOrders: [],
  orderSummary: {
    totalOrders: 0,
    totalSpent: 0
  },
  status: 'idle',
  error: null
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.user = null;
      state.recentOrders = [];
      state.orderSummary = {
        totalOrders: 0,
        totalSpent: 0
      };
      state.status = 'idle';
      state.error = null;
    },
    // Add a manual update reducer for direct state updates
    updateUserData: (state, action) => {
      if (action.payload) {
        state.user = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload && action.payload.user) {
          state.user = action.payload.user;
          state.recentOrders = action.payload.recentOrders || [];
          state.orderSummary = action.payload.orderSummary || {
            totalOrders: 0,
            totalSpent: 0
          };
        } else if (action.payload) {
          state.user = action.payload;
          state.recentOrders = [];
          state.orderSummary = {
            totalOrders: 0,
            totalSpent: 0
          };
        }
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        console.log('userSlice - REDUCER: Update fulfilled with payload:', action.payload);
        
        if (action.payload && action.payload.user) {
          console.log('userSlice - REDUCER: Using server response directly');
          // Replace the user object entirely with the server response
          state.user = action.payload.user;
          
          state.recentOrders = action.payload.recentOrders || state.recentOrders;
          state.orderSummary = action.payload.orderSummary || state.orderSummary;
        } else if (action.payload) {
          console.log('userSlice - REDUCER: Using direct payload response');
          // Replace the user object entirely with the server response
          state.user = action.payload;
        }
        
        console.log('userSlice - REDUCER: Final user state:', JSON.stringify(state.user, null, 2));
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { clearProfile, updateUserData } = userSlice.actions;

export default userSlice.reducer; 