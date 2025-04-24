import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import adminReducer from './slices/adminSlice';
import userReducer from './slices/userSlice';
import brandsReducer from './slices/brandsSlice';
import categoriesReducer from './slices/categoriesSlice';
import siteConfigReducer from './slices/siteConfigSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    orders: orderReducer,
    admin: adminReducer,
    user: userReducer,
    brands: brandsReducer,
    categories: categoriesReducer,
    siteConfig: siteConfigReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store; 