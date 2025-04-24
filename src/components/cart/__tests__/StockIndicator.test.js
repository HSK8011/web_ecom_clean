import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StockIndicator from '../StockIndicator';

// Mock Redux store
const createMockStore = (initialState) => {
  return configureStore({
    reducer: {
      cart: (state = initialState, action) => state
    },
    preloadedState: {
      cart: initialState
    }
  });
};

describe('StockIndicator Component', () => {
  test('renders "Out of Stock" when stock is 0', () => {
    const item = { _id: '1', size: 'M', quantity: 2 };
    const stockLevels = { '1-M': 0 };
    const store = createMockStore({ stockLevels });
    
    render(
      <Provider store={store}>
        <StockIndicator item={item} stockLevels={stockLevels} />
      </Provider>
    );
    
    const statusEl = screen.getByTestId('stock-status');
    expect(statusEl).toHaveTextContent('Out of Stock');
    expect(statusEl).toHaveStyle('color: #e53e3e');
  });
  
  test('renders "Only X in stock" when quantity exceeds stock', () => {
    const item = { _id: '1', size: 'M', quantity: 5 };
    const stockLevels = { '1-M': 3 };
    const store = createMockStore({ stockLevels });
    
    render(
      <Provider store={store}>
        <StockIndicator item={item} stockLevels={stockLevels} />
      </Provider>
    );
    
    const statusEl = screen.getByTestId('stock-status');
    expect(statusEl).toHaveTextContent('Only 3 in stock!');
    expect(statusEl).toHaveStyle('color: #d69e2e');
  });
  
  test('renders "Low Stock" when stock is 5 or less', () => {
    const item = { _id: '1', size: 'M', quantity: 2 };
    const stockLevels = { '1-M': 5 };
    const store = createMockStore({ stockLevels });
    
    render(
      <Provider store={store}>
        <StockIndicator item={item} stockLevels={stockLevels} />
      </Provider>
    );
    
    const statusEl = screen.getByTestId('stock-status');
    expect(statusEl).toHaveTextContent('Low Stock: 5 left');
    expect(statusEl).toHaveStyle('color: #d69e2e');
  });
  
  test('renders "In Stock" when stock is sufficient', () => {
    const item = { _id: '1', size: 'M', quantity: 2 };
    const stockLevels = { '1-M': 20 };
    const store = createMockStore({ stockLevels });
    
    render(
      <Provider store={store}>
        <StockIndicator item={item} stockLevels={stockLevels} />
      </Provider>
    );
    
    const statusEl = screen.getByTestId('stock-status');
    expect(statusEl).toHaveTextContent('In Stock: 20 available');
    expect(statusEl).toHaveStyle('color: #38b2ac');
  });
  
  test('renders "Stock: Checking..." when stock is undefined', () => {
    const item = { _id: '1', size: 'M', quantity: 2 };
    const stockLevels = {}; // No stock info
    const store = createMockStore({ stockLevels });
    
    render(
      <Provider store={store}>
        <StockIndicator item={item} stockLevels={stockLevels} />
      </Provider>
    );
    
    const statusEl = screen.getByTestId('stock-status');
    expect(statusEl).toHaveTextContent('Stock: Checking...');
    expect(statusEl).toHaveStyle('color: #718096');
  });
  
  test('falls back to Redux store when stockLevels not provided as prop', () => {
    const item = { _id: '1', size: 'M', quantity: 2 };
    const store = createMockStore({ 
      stockLevels: { '1-M': 50 } 
    });
    
    render(
      <Provider store={store}>
        <StockIndicator item={item} />
      </Provider>
    );
    
    const statusEl = screen.getByTestId('stock-status');
    expect(statusEl).toHaveTextContent('In Stock: 50 available');
    expect(statusEl).toHaveStyle('color: #38b2ac');
  });
}); 