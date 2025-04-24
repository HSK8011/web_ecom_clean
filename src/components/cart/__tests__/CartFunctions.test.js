import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import Cart from '../../Cart';
import cartReducer, { 
  removeFromGuestCart, 
  updateGuestCartItem,
  removeUserCartItem,
  updateUserCartItem
} from '../../../redux/slices/cartSlice';
import authReducer from '../../../redux/slices/authSlice';
import { toast } from 'react-toastify';

// Mock toast
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

// Create a mock store
const createMockStore = (initialState) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      auth: authReducer
    },
    preloadedState: initialState
  });
};

// Test for autoFixInventoryIssues function
describe('Cart Inventory Functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('autoFixInventoryIssues should remove out of stock items and adjust quantities', () => {
    // Mock initial state with stock issues
    const initialState = {
      cart: {
        items: [
          { _id: '1', name: 'Out of Stock Product', price: 10, quantity: 2, size: 'M' },
          { _id: '2', name: 'Low Stock Product', price: 20, quantity: 5, size: 'L' },
          { _id: '3', name: 'Good Stock Product', price: 30, quantity: 3, size: 'XL' }
        ],
        loading: false,
        error: null,
        isUserCart: false,
        stockLevels: {
          '1-M': 0,      // Out of stock
          '2-L': 3,      // Less than requested quantity (5)
          '3-XL': 10     // More than requested quantity (3)
        }
      },
      auth: {
        isAuthenticated: false,
        user: null
      }
    };
    
    const store = createMockStore(initialState);
    
    // Mock dispatch actions
    store.dispatch = jest.fn(store.dispatch);
    
    // Render the component with our mock store
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );
    
    // Get the component instance and call autoFixInventoryIssues
    const component = screen.getByText('Shopping Cart').closest('div').parentElement;
    component.props.autoFixInventoryIssues();
    
    // Check that the right actions were dispatched
    expect(store.dispatch).toHaveBeenCalledWith(removeFromGuestCart({ _id: '1', name: 'Out of Stock Product', price: 10, quantity: 2, size: 'M' }));
    expect(store.dispatch).toHaveBeenCalledWith(updateGuestCartItem({ _id: '2', name: 'Low Stock Product', price: 20, quantity: 3, size: 'L' }));
    
    // Check that a success toast was shown
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Removed 1 out-of-stock item'));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Adjusted quantities for 1 item'));
  });
  
  test('autoFixInventoryIssues should handle user cart differently', () => {
    // Mock initial state with user cart
    const initialState = {
      cart: {
        items: [
          { _id: '1', name: 'Out of Stock Product', price: 10, quantity: 2, size: 'M' },
          { _id: '2', name: 'Low Stock Product', price: 20, quantity: 5, size: 'L' }
        ],
        loading: false,
        error: null,
        isUserCart: true,
        stockLevels: {
          '1-M': 0,  // Out of stock
          '2-L': 3   // Less than requested quantity
        }
      },
      auth: {
        isAuthenticated: true,
        user: { _id: 'user1', name: 'Test User' }
      }
    };
    
    const store = createMockStore(initialState);
    
    // Mock dispatch actions
    store.dispatch = jest.fn(store.dispatch);
    
    // Render the component with our mock store
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );
    
    // Get the component instance and call autoFixInventoryIssues
    const component = screen.getByText('Shopping Cart').closest('div').parentElement;
    component.props.autoFixInventoryIssues();
    
    // Check that the right actions were dispatched for user cart
    expect(store.dispatch).toHaveBeenCalledWith(removeUserCartItem('1'));
    expect(store.dispatch).toHaveBeenCalledWith(updateUserCartItem({
      itemId: '2',
      quantity: 3
    }));
  });
  
  test('autoFixInventoryIssues should show info message when no issues found', () => {
    // Mock initial state with no stock issues
    const initialState = {
      cart: {
        items: [
          { _id: '3', name: 'Good Stock Product', price: 30, quantity: 3, size: 'XL' }
        ],
        loading: false,
        error: null,
        isUserCart: false,
        stockLevels: {
          '3-XL': 10  // More than requested quantity
        }
      },
      auth: {
        isAuthenticated: false,
        user: null
      }
    };
    
    const store = createMockStore(initialState);
    
    // Render the component with our mock store
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );
    
    // Get the component instance and call autoFixInventoryIssues
    const component = screen.getByText('Shopping Cart').closest('div').parentElement;
    component.props.autoFixInventoryIssues();
    
    // Check that an info toast was shown
    expect(toast.info).toHaveBeenCalledWith('No inventory issues found');
  });
}); 