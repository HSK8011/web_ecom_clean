import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../constants';

// Async thunk for fetching site configuration
export const fetchSiteConfig = createAsyncThunk(
  'siteConfig/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API_URL}/site-config`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Network error' });
    }
  }
);

// Async thunk for updating hero image
export const updateHeroImage = createAsyncThunk(
  'siteConfig/updateHeroImage',
  async (imageFile, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const { data } = await axios.post(`${API_URL}/site-config/hero-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Network error' });
    }
  }
);

const initialState = {
  hero: {
    title: '',
    description: '',
    image: ''
  },
  stats: [],
  brands: [],
  loading: false,
  error: null
};

const siteConfigSlice = createSlice({
  name: 'siteConfig',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSiteConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSiteConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.hero = action.payload.hero;
        state.stats = action.payload.stats;
        state.brands = action.payload.brands;
      })
      .addCase(fetchSiteConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch site configuration';
      })
      .addCase(updateHeroImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHeroImage.fulfilled, (state, action) => {
        state.loading = false;
        state.hero = action.payload.hero;
      })
      .addCase(updateHeroImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update hero image';
      });
  },
});

export default siteConfigSlice.reducer; 