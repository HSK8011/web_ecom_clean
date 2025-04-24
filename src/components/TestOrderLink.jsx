import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const TestOrderLink = () => {
  return (
    <Container>
      <h1>Test Order Details</h1>
      <p>Click the buttons below to view a sample order:</p>
      
      <ButtonContainer>
        <StyledLink to="/order/12345678">
          View Sample Order #12345678
        </StyledLink>
        
        <StyledLink to="/debug-order/12345678" className="debug">
          Debug Sample Order #12345678
        </StyledLink>
      </ButtonContainer>
      
      <InfoSection>
        <h2>Troubleshooting</h2>
        <p>If you're seeing a white screen on the regular order page:</p>
        <ol>
          <li>Try the Debug version to see the raw Redux state</li>
          <li>Check if the Redux state shows the order data correctly</li>
          <li>Look for errors in the browser console</li>
        </ol>
      </InfoSection>
    </Container>
  );
};

const Container = styled.div`
  max-width: 600px;
  margin: 100px auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
  
  @media (min-width: 500px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const StyledLink = styled(Link)`
  display: inline-block;
  background-color: #4a6cf7;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #3451b2;
  }
  
  &.debug {
    background-color: #f7754a;
    
    &:hover {
      background-color: #e55e34;
    }
  }
`;

const InfoSection = styled.div`
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 1.5rem;
  text-align: left;
  
  h2 {
    font-size: 1.2rem;
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  ol {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
`;

export default TestOrderLink; 