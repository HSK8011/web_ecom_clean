import React from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle } from 'react-icons/fa';

/**
 * CartErrorHandler - A component to display error messages in the cart
 * 
 * @param {Object} props
 * @param {string|Object} props.error - Error message or object to display
 */
const CartErrorHandler = ({ error }) => {
  if (!error) return null;

  // Extract error message from error object or use error directly if it's a string
  const errorMessage = typeof error === 'object' 
    ? (error.message || error.error || 'An unknown error occurred') 
    : error;
  
  return (
    <ErrorContainer>
      <ErrorIcon>
        <FaExclamationTriangle />
      </ErrorIcon>
      <ErrorContent>
        <ErrorTitle>Error</ErrorTitle>
        <ErrorMessage>{errorMessage}</ErrorMessage>
      </ErrorContent>
    </ErrorContainer>
  );
};

const ErrorContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 15px;
  background-color: #fff5f5;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #e53e3e;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
`;

const ErrorIcon = styled.div`
  font-size: 20px;
  color: #e53e3e;
  flex-shrink: 0;
  margin-top: 3px;
`;

const ErrorContent = styled.div`
  flex: 1;
`;

const ErrorTitle = styled.h4`
  margin: 0 0 5px;
  color: #e53e3e;
  font-size: 16px;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: #4a5568;
  font-size: 14px;
  line-height: 1.5;
`;

export default CartErrorHandler; 