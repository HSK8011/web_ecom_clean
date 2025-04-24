import React from 'react';
import styled from 'styled-components';

/**
 * StockIndicator - A reusable component to display stock status for a product
 * 
 * @param {Object} props
 * @param {Object} props.item - The cart item or product object
 * @param {string} props.item._id - The product ID
 * @param {string} props.item.size - The selected size
 * @param {Object} props.stockLevels - Stock levels data keyed by productId-size
 */
const StockIndicator = ({ item, stockLevels = {} }) => {
  if (!item || !item.size) return null;
  
  // Create a stock key using product ID and size
  const productId = item._id || item.productId;
  const stockKey = `${productId}-${item.size}`;
  
  // Get available stock for this product/size combination
  const availableStock = stockLevels[stockKey];
  
  // If stock data is missing, assume in stock for simplicity
  if (availableStock === undefined) {
    return <StatusText data-testid="stock-status" $status="success">In Stock</StatusText>;
  }
  
  if (availableStock <= 0) {
    return <StatusText data-testid="stock-status" $status="error">Out of Stock</StatusText>;
  }
  
  if (item.quantity && item.quantity > availableStock) {
    return (
      <StatusText data-testid="stock-status" $status="warning">
        Only {availableStock} in stock!
      </StatusText>
    );
  }
  
  if (availableStock <= 5) {
    return <StatusText data-testid="stock-status" $status="warning">Low Stock: {availableStock} left</StatusText>;
  }
  
  return <StatusText data-testid="stock-status" $status="success">In Stock: {availableStock} available</StatusText>;
};

// Styled component for status text
const StatusText = styled.div`
  display: inline-block;
  font-size: 13px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  margin-top: 6px;
  
  background-color: ${props => {
    switch (props.$status) {
      case 'success':
        return '#e6fffa';
      case 'warning':
        return '#fffbea';
      case 'error':
        return '#fff5f5';
      default:
        return '#f7fafc';
    }
  }};
  
  color: ${props => {
    switch (props.$status) {
      case 'success':
        return '#38b2ac';
      case 'warning':
        return '#d69e2e';
      case 'error':
        return '#e53e3e';
      default:
        return '#718096';
    }
  }};
`;

export default StockIndicator; 