import React from 'react';
import styled from 'styled-components';

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-left: 1rem;
  font-size: 1.1rem;
  color: #333;
`;

const LoadingSpinner = ({ children }) => {
  return (
    <SpinnerContainer>
      <Spinner />
      {children && <LoadingText>{children}</LoadingText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner; 