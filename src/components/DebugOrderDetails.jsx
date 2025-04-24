import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { getOrderDetails } from '../redux/slices/orderSlice';

const DebugOrderDetails = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  
  // Use orders (plural) to match the store configuration
  const orderState = useSelector(state => state.orders);
  const [stateSnapshot, setStateSnapshot] = useState(null);
  
  // Take a snapshot of the state for debugging
  useEffect(() => {
    setStateSnapshot(orderState);
  }, [orderState]);

  useEffect(() => {
    console.log('Fetching order with ID:', orderId);
    dispatch(getOrderDetails(orderId));
  }, [dispatch, orderId]);
  
  return (
    <Container>
      <h1>Debug Order Details</h1>
      <p>Order ID: {orderId}</p>
      
      <DebugSection>
        <h2>Redux State</h2>
        <pre>{JSON.stringify(stateSnapshot, null, 2)}</pre>
      </DebugSection>
      
      <BackLink to="/test-order">
        Back to Test Page
      </BackLink>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const DebugSection = styled.div`
  margin: 2rem 0;
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 4px;
  
  h2 {
    margin-top: 0;
    color: #333;
  }
  
  pre {
    background: #f8f8f8;
    padding: 1rem;
    overflow: auto;
    border-radius: 4px;
    border: 1px solid #ddd;
  }
`;

const BackLink = styled(Link)`
  display: inline-block;
  background-color: #4a6cf7;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  
  &:hover {
    background-color: #3451b2;
  }
`;

export default DebugOrderDetails; 