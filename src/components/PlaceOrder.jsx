import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaShippingFast, FaCreditCard, FaExclamationTriangle } from 'react-icons/fa';
import { BsBoxSeam } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { createOrder } from '../redux/slices/orderSlice';
import { fetchUserProfile } from '../redux/slices/userSlice';

const PlaceOrder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const cart = useSelector(state => state.cart);
  const { shippingAddress = {}, paymentMethod = '', items = [] } = cart || {};
  
  const { userInfo } = useSelector(state => state.auth);
  const { order, loading, success, error } = useSelector(state => state.orders || { order: null, loading: false, success: false, error: null });

  // Calculate prices
  const itemsPrice = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0).toFixed(2);
  const shippingPrice = (itemsPrice > 100 ? 0 : 10).toFixed(2);
  const taxPrice = (0.15 * itemsPrice).toFixed(2);
  const totalPrice = (Number(itemsPrice) + Number(shippingPrice) + Number(taxPrice)).toFixed(2);

  useEffect(() => {
    if (!shippingAddress.address) {
      navigate('/shipping');
    } else if (!paymentMethod) {
      navigate('/payment');
    }
  }, [shippingAddress, paymentMethod, navigate]);

  useEffect(() => {
    if (success && order && order._id) {
      dispatch(fetchUserProfile());
      navigate(`/order/${order._id}`);
      toast.success('Order placed successfully!');
    }
    if (error) {
      toast.error(error);
    }
  }, [success, order, error, navigate, dispatch]);

  const placeOrderHandler = () => {
    dispatch(createOrder({
      orderItems: items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice
    }));
  };

  return (
    <StyledPlaceOrder
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Container>
        <h1>Place Order</h1>
        
        <OrderSummary>
          <LeftSection>
            <SummarySection>
              <SummaryHeader>
                <FaShippingFast />
                <h2>Shipping</h2>
              </SummaryHeader>
              <SummaryContent>
                <p><strong>Address:</strong> {shippingAddress.address}, {shippingAddress.city} {shippingAddress.postalCode}, {shippingAddress.country}</p>
              </SummaryContent>
            </SummarySection>

            <SummarySection>
              <SummaryHeader>
                <FaCreditCard />
                <h2>Payment Method</h2>
              </SummaryHeader>
              <SummaryContent>
                <p><strong>Method:</strong> {paymentMethod}</p>
              </SummaryContent>
            </SummarySection>

            <SummarySection>
              <SummaryHeader>
                <BsBoxSeam />
                <h2>Order Items</h2>
              </SummaryHeader>
              <SummaryContent>
                {items.length === 0 ? (
                  <Message variant="info">Your cart is empty</Message>
                ) : (
                  <OrderItems>
                    {items.map((item, index) => (
                      <OrderItem key={index}>
                        <ProductImage src={item.image} alt={item.name} />
                        <ProductDetails>
                          <ProductName>{item.name}</ProductName>
                          <ProductInfo>
                            {item.quantity} x ${item.price} = ${(item.quantity * item.price).toFixed(2)}
                          </ProductInfo>
                        </ProductDetails>
                      </OrderItem>
                    ))}
                  </OrderItems>
                )}
              </SummaryContent>
            </SummarySection>
          </LeftSection>

          <RightSection>
            <OrderSummaryCard>
              <h2>Order Summary</h2>
              <PriceSummary>
                <PriceRow>
                  <span>Items:</span>
                  <span>${itemsPrice}</span>
                </PriceRow>
                <PriceRow>
                  <span>Shipping:</span>
                  <span>${shippingPrice}</span>
                </PriceRow>
                <PriceRow>
                  <span>Tax:</span>
                  <span>${taxPrice}</span>
                </PriceRow>
                <PriceRow className="total">
                  <span>Total:</span>
                  <span>${totalPrice}</span>
                </PriceRow>
                
                {error && (
                  <Message variant="error">
                    <FaExclamationTriangle /> {error}
                  </Message>
                )}
                
                <PlaceOrderButton
                  disabled={items.length === 0 || loading}
                  onClick={placeOrderHandler}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </PlaceOrderButton>
              </PriceSummary>
            </OrderSummaryCard>
          </RightSection>
        </OrderSummary>
      </Container>
    </StyledPlaceOrder>
  );
};

const StyledPlaceOrder = styled(motion.div)`
  padding: 2rem 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  
  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
    font-weight: 600;
  }
`;

const OrderSummary = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const RightSection = styled.div``;

const SummarySection = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
  
  h2 {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
  }
  
  svg {
    color: #4a6cf7;
    font-size: 1.2rem;
  }
`;

const SummaryContent = styled.div`
  padding: 1rem;
  
  p {
    margin: 0;
    line-height: 1.6;
  }
`;

const OrderItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OrderItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProductImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
`;

const ProductDetails = styled.div`
  flex: 1;
`;

const ProductName = styled.p`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const ProductInfo = styled.p`
  color: #666;
  font-size: 0.9rem;
`;

const OrderSummaryCard = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  position: sticky;
  top: 20px;
  
  h2 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #eee;
  }
`;

const PriceSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  
  &.total {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #eee;
    font-weight: 600;
    font-size: 1.1rem;
  }
`;

const PlaceOrderButton = styled.button`
  width: 100%;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #3a5ce5;
  }
  
  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 0.75rem;
  margin: 0.5rem 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => props.variant === 'error' && `
    background-color: #fed7d7;
    color: #c53030;
  `}
  
  ${props => props.variant === 'info' && `
    background-color: #e6f6ff;
    color: #2b6cb0;
  `}
  
  svg {
    font-size: 1rem;
  }
`;

export default PlaceOrder; 