import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

// Async thunks
export const fetchBrands = createAsyncThunk(
  'brands/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/brands');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data.error || 'Failed to fetch brands');
    }
  }
);

export const fetchFeaturedBrands = createAsyncThunk(
  'brands/fetchFeaturedBrands',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/brands/featured');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data.error || 'Failed to fetch featured brands');
    }
  }
);

const initialState = {
  brands: [],
  featuredBrands: [],
  loading: false,
  error: null,
  status: 'idle'
};

const brandsSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {
    clearBrandsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all brands
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = 'loading';
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload;
        state.error = null;
        state.status = 'succeeded';
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = 'failed';
      })
      // Fetch featured brands
      .addCase(fetchFeaturedBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredBrands = action.payload;
        state.error = null;
      })
      .addCase(fetchFeaturedBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearBrandsError } = brandsSlice.actions;
export default brandsSlice.reducer; 