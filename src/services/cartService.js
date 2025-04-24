import axios from 'axios';
import { API_URL } from '../constants';

// Get user cart
export const getUserCart = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(`${API_URL}/cart`, config);
  return response.data;
};

// Add item to user cart
export const addToUserCart = async (productData, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(
    `${API_URL}/cart`,
    productData,
    config
  );
  return response.data;
};

// Update item in user cart
export const updateUserCartItem = async (itemData, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(
    `${API_URL}/cart/${itemData.itemId}`,
    { quantity: itemData.quantity },
    config
  );
  return response.data;
};

// Remove item from user cart
export const removeFromUserCart = async (itemId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.delete(`${API_URL}/cart/${itemId}`, config);
  return response.data;
};

// Merge guest cart with user cart after login
export const mergeGuestCart = async (guestCartItems, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(
    `${API_URL}/cart/merge`,
    { items: guestCartItems },
    config
  );
  return response.data;
};

// Clear user cart
export const clearUserCart = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.delete(`${API_URL}/cart`, config);
  return response.data;
}; 