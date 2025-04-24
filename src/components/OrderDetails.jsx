import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaMapMarkerAlt, FaCreditCard, FaCheck, FaTimes, FaPrint } from 'react-icons/fa';
import { BsBoxSeam, BsCalendarDate } from 'react-icons/bs';
import { MdLocalShipping } from 'react-icons/md';
import { toast } from 'react-toastify';
import { getOrderDetails } from '../redux/slices/orderSlice';
import { fetchUserProfile } from '../redux/slices/userSlice';

const OrderDetails = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();

  const { order, loading, error } = useSelector(state => state.orders);

  useEffect(() => {
    // Fetch order details when component mounts or orderId changes
    dispatch(getOrderDetails(orderId))
      .unwrap()
      .then(() => {
        // After successfully loading order details, refresh profile data
        dispatch(fetchUserProfile());
      })
      .catch(err => console.error("Error fetching order details:", err));
  }, [dispatch, orderId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) {
    return (
      <LoadingContainer>
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </LoadingContainer>
    );
  }

  if (!order) {
    return (
      <MessageContainer>
        <h2>Order not found</h2>
        <Link to="/profile">Back to Profile</Link>
      </MessageContainer>
    );
  }

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date format:', dateString);
        return 'Not available';
      }
      
      // Format the date
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'for date string:', dateString);
      return 'Not available';
    }
  };
  
  // Shorter date format without time for some displays
  const formatShortDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date format:', dateString);
        return 'Not available';
      }
      
      // Format the date without time
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'for date string:', dateString);
      return 'Not available';
    }
  };

  // Calculate the estimated delivery date (5-7 business days from order date)
  const getEstimatedDeliveryDate = () => {
    if (!order.createdAt) return 'Not available';
    
    try {
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) {
        console.error('Invalid order date:', order.createdAt);
        return 'Not available';
      }
      
      // Add 7 business days
      const deliveryDate = new Date(orderDate);
      let businessDays = 7;
      let currentDate = new Date(orderDate);
      
      while (businessDays > 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        // Skip weekends
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          businessDays--;
        }
      }
      
      return currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error calculating delivery date:', error, 'for date:', order.createdAt);
      return 'Not available';
    }
  };

  // Calculate subtotal from order items
  const calculateSubtotal = () => {
    if (!order.orderItems || order.orderItems.length === 0) return '0.00';
    
    if (order.itemsPrice) {
      return Number(order.itemsPrice).toFixed(2);
    }
    
    const subtotal = order.orderItems.reduce((sum, item) => {
      const quantity = item.quantity || item.qty || 1;
      const price = Number(item.price) || 0;
      return sum + (quantity * price);
    }, 0);
    
    return subtotal.toFixed(2);
  };

  // Update shipping calculation to use value from order if available
  const calculateShipping = () => {
    if (order.shippingPrice) {
      return Number(order.shippingPrice).toFixed(2);
    }
    
    const subtotal = parseFloat(calculateSubtotal());
    // Free shipping for orders $100 or more
    return subtotal >= 100 ? '0.00' : '10.00';
  };

  // Calculate tax based on order tax if available
  const calculateTax = () => {
    if (order.taxPrice) {
      return Number(order.taxPrice).toFixed(2);
    }
    
    const subtotal = parseFloat(calculateSubtotal());
    const taxRate = 0.07; // 7% tax rate
    return (subtotal * taxRate).toFixed(2);
  };

  // Use order total if available, otherwise calculate
  const calculateTotal = () => {
    if (order.totalPrice) {
      return Number(order.totalPrice).toFixed(2);
    }
    
    const subtotal = parseFloat(calculateSubtotal());
    const shipping = parseFloat(calculateShipping());
    const tax = parseFloat(calculateTax());
    
    const total = subtotal + shipping + tax;
    return total.toFixed(2);
  };

  return (
    <StyledOrderDetails
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <OrderConfirmation>
        <ConfirmationContent>
          <ConfirmationIcon>
            <FaCheckCircle />
          </ConfirmationIcon>
          <div>
            <h1>Thank You for Your Purchase</h1>
            <p>Order #<span style={{ fontFamily: 'monospace' }}>{order._id ? order._id.substring(order._id.length - 8).toUpperCase() : 'N/A'}</span></p>
            <ConfirmationDetails>
              <ConfirmationDetail>
                <BsCalendarDate />
                <span>Ordered on {formatShortDate(order.createdAt)}</span>
              </ConfirmationDetail>
              <ConfirmationDetailDivider />
              <ConfirmationDetail>
                <FaCreditCard />
                <span>Payment {order.isPaid ? 'confirmed' : 'pending'}</span>
              </ConfirmationDetail>
            </ConfirmationDetails>
          </div>
        </ConfirmationContent>
      </OrderConfirmation>
      
      <Container>
        <OrderHeader>
          <OrderHeaderTitle>
            <h2>Order Details</h2>
            <OrderId>#{order._id}</OrderId>
          </OrderHeaderTitle>
          <OrderHeaderActions>
            <PrintButton onClick={() => window.print()}>
              <FaPrint /> Print Receipt
            </PrintButton>
          </OrderHeaderActions>
        </OrderHeader>
        
        <OrderStatus>
          <StatusItem $active={true}>
            <StatusIcon $active={true}>
              <FaCheck />
            </StatusIcon>
            <StatusContent>
              <StatusTitle>Order Confirmed</StatusTitle>
              <StatusDate>
                {formatShortDate(order.createdAt)}
              </StatusDate>
            </StatusContent>
          </StatusItem>
          
          <StatusLine $active={order.isPaid} />
          
          <StatusItem $active={order.isPaid}>
            <StatusIcon $active={order.isPaid}>
              {order.isPaid ? <FaCheck /> : <span>2</span>}
            </StatusIcon>
            <StatusContent>
              <StatusTitle>Payment {order.isPaid ? 'Complete' : 'Pending'}</StatusTitle>
              <StatusDate>
                {order.isPaid ? formatShortDate(order.paidAt) : 'Awaiting payment'}
              </StatusDate>
            </StatusContent>
          </StatusItem>
          
          <StatusLine $active={order.isDelivered} />
          
          <StatusItem $active={order.isDelivered}>
            <StatusIcon $active={order.isDelivered}>
              {order.isDelivered ? <FaCheck /> : <span>3</span>}
            </StatusIcon>
            <StatusContent>
              <StatusTitle>
                {order.isDelivered ? 'Delivered' : 'In Transit'}
              </StatusTitle>
              <StatusDate>
                {order.isDelivered 
                  ? formatShortDate(order.deliveredAt)
                  : `Estimated: ${getEstimatedDeliveryDate()}`
                }
              </StatusDate>
            </StatusContent>
          </StatusItem>
        </OrderStatus>
        
        <OrderContent>
          <LeftSection>
            <SummarySection>
              <SummaryHeader>
                <FaMapMarkerAlt />
                <h2>Shipping Address</h2>
              </SummaryHeader>
              <SummaryContent>
                <p><strong>Name:</strong> {order.user?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
                <p><strong>Address:</strong> {order.shippingAddress?.address || 'N/A'}, 
                {order.shippingAddress?.city || ''} {order.shippingAddress?.postalCode || ''}, 
                {order.shippingAddress?.country || ''}</p>
                
                <DeliveryStatus $delivered={order.isDelivered}>
                  {order.isDelivered ? (
                    <>
                      <FaCheck /> Delivered on {formatShortDate(order.deliveredAt)}
                    </>
                  ) : (
                    <>
                      <MdLocalShipping /> Estimated delivery by {getEstimatedDeliveryDate()}
                    </>
                  )}
                </DeliveryStatus>
              </SummaryContent>
            </SummarySection>

            <SummarySection>
              <SummaryHeader>
                <FaCreditCard />
                <h2>Payment Information</h2>
              </SummaryHeader>
              <SummaryContent>
                <p><strong>Method:</strong> {order.paymentMethod || 'Credit Card'}</p>
                {order.isPaid && <p><strong>Date:</strong> {formatShortDate(order.paidAt)}</p>}
                
                <PaymentStatus $paid={order.isPaid}>
                  {order.isPaid ? (
                    <><FaCheck /> Payment successful</>
                  ) : (
                    <><FaTimes /> Payment pending</>
                  )}
                </PaymentStatus>
                
                {order.paymentResult && (
                  <PaymentDetails>
                    <p><strong>Transaction ID:</strong> {order.paymentResult.id}</p>
                    <p><strong>Status:</strong> {order.paymentResult.status}</p>
                  </PaymentDetails>
                )}
              </SummaryContent>
            </SummarySection>

            <SummarySection>
              <SummaryHeader>
                <BsBoxSeam />
                <h2>Order Items</h2>
              </SummaryHeader>
              <SummaryContent>
                {!order.orderItems || order.orderItems.length === 0 ? (
                  <Message>Your order is empty</Message>
                ) : (
                  <OrderItems>
                    {order.orderItems.map((item, index) => (
                      <OrderItem key={`${item.product}-${item.size}-${item.color}-${index}`}>
                        <ProductImage src={item.image || '/images/placeholder.png'} alt={item.name} />
                        <ProductDetails>
                          <ProductName>
                            <Link to={`/product/${item.product}`}>
                              {item.name}
                            </Link>
                          </ProductName>
                          <ProductMeta>
                            {item.size && <MetaItem>Size: {item.size}</MetaItem>}
                            {item.color && <MetaItem>Color: {item.color}</MetaItem>}
                            <MetaItem>
                              <strong>Quantity:</strong> {item.quantity || item.qty || 1}
                            </MetaItem>
                          </ProductMeta>
                          <PriceDetails>
                            <QuantityLabel>
                              Quantity: <QuantityValue>{item.quantity || item.qty || 1}</QuantityValue>
                            </QuantityLabel>
                            <ProductPrice>
                              <UnitPrice>${Number(item.price || 0).toFixed(2)}</UnitPrice>
                              <TotalPrice>
                                ${((item.quantity || item.qty || 1) * (Number(item.price) || 0)).toFixed(2)}
                              </TotalPrice>
                            </ProductPrice>
                          </PriceDetails>
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
              <SummaryCardHeader>Order Summary</SummaryCardHeader>
              
              <PriceSummary>
                <PriceRow>
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal()}</span>
                </PriceRow>
                <PriceRow>
                  <span>Shipping:</span>
                  <ShippingPrice>${calculateShipping()}</ShippingPrice>
                </PriceRow>
                <PriceRow>
                  <span>Tax (7%):</span>
                  <span>${calculateTax()}</span>
                </PriceRow>
                <TotalRow>
                  <span>Total:</span>
                  <TotalAmount>${calculateTotal()}</TotalAmount>
                </TotalRow>
              </PriceSummary>
              
              {order.isPaid ? (
                <PaymentInfo>
                  <PaymentInfoIcon>
                    <FaCheck />
                  </PaymentInfoIcon>
                  <PaymentInfoText>
                    <h3>Payment Complete</h3>
                    <p>Thank you for your purchase</p>
                  </PaymentInfoText>
                </PaymentInfo>
              ) : (
                <PaymentInfo>
                  <PaymentInfoIcon style={{ backgroundColor: '#e53e3e' }}>
                    <FaTimes />
                  </PaymentInfoIcon>
                  <PaymentInfoText>
                    <h3>Payment Pending</h3>
                    <p>Your payment is being processed</p>
                  </PaymentInfoText>
                </PaymentInfo>
              )}
              
              <ShippingNote>
                {parseFloat(calculateSubtotal()) >= 100 ? (
                  <FreeShippingMessage>
                    <MdLocalShipping />
                    <span>Free shipping applied to your order!</span>
                  </FreeShippingMessage>
                ) : (
                  <ShippingMessage>
                    <MdLocalShipping />
                    <span>Free shipping on orders over $100</span>
                  </ShippingMessage>
                )}
              </ShippingNote>
              
              {!order.isDelivered && (
                <DeliveryInfo>
                  <DeliveryInfoHeader>
                    <MdLocalShipping />
                    <h3>Shipping Information</h3>
                  </DeliveryInfoHeader>
                  <DeliveryInfoContent>
                    <DeliveryInfoItem>
                      <strong>Carrier:</strong> {order.carrier || 'Standard Shipping'}
                    </DeliveryInfoItem>
                    <DeliveryInfoItem>
                      <strong>Estimated Delivery:</strong> {getEstimatedDeliveryDate()}
                    </DeliveryInfoItem>
                    
                    {order.trackingNumber && (
                      <>
                        <DeliveryInfoItem>
                          <strong>Tracking #:</strong> {order.trackingNumber}
                        </DeliveryInfoItem>
                        <TrackButton 
                          href={`https://example.com/track/${order.trackingNumber}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Track Shipment
                        </TrackButton>
                      </>
                    )}
                  </DeliveryInfoContent>
                </DeliveryInfo>
              )}
              
              <ActionButtonsGroup>
                <ViewAllOrdersButton to="/profile">
                  View All Orders
                </ViewAllOrdersButton>
                <ContinueShoppingButton to="/products">
                  Continue Shopping
                </ContinueShoppingButton>
              </ActionButtonsGroup>
              
              <SupportInfo>
                <p>Questions about your order?</p>
                <Link to="/support">Contact Customer Support</Link>
              </SupportInfo>
            </OrderSummaryCard>
          </RightSection>
        </OrderContent>
      </Container>
    </StyledOrderDetails>
  );
};

const StyledOrderDetails = styled(motion.div)`
  padding: 2rem 0;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const OrderConfirmation = styled.div`
  background-color: #4a6cf7;
  color: white;
  padding: 2.5rem 0;
  margin-bottom: 2rem;
`;

const ConfirmationContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ConfirmationIcon = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    font-size: 2.5rem;
  }
`;

const ConfirmationDetails = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    justify-content: center;
    flex-wrap: wrap;
  }
`;

const ConfirmationDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  svg {
    font-size: 1rem;
    opacity: 0.8;
  }
`;

const ConfirmationDetailDivider = styled.div`
  width: 1px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.3);
  margin: 0 1rem;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const OrderHeaderTitle = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1rem;
  
  h2 {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0;
  }
`;

const OrderId = styled.div`
  font-size: 1.1rem;
  color: #666;
  font-weight: 500;
  font-family: monospace;
`;

const OrderHeaderActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const PrintButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e9ecef;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const OrderStatus = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  max-width: 800px;
  margin: 3rem auto;
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  width: 33%;
  opacity: ${props => props.$active ? 1 : 0.6};
  
  @media (max-width: 768px) {
    width: auto;
  }
`;

const StatusIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.$active ? '#4a6cf7' : '#e2e8f0'};
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$active ? '0 4px 6px rgba(74, 108, 247, 0.2)' : 'none'};
  
  svg {
    font-size: 1.2rem;
  }
  
  span {
    font-weight: 600;
  }
`;

const StatusContent = styled.div`
  text-align: center;
`;

const StatusTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const StatusDate = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const StatusLine = styled.div`
  flex: 1;
  height: 4px;
  background-color: ${props => props.$active ? '#4a6cf7' : '#e2e8f0'};
  position: relative;
  top: -24px;
  z-index: 1;
  transition: all 0.3s ease;
`;

const OrderContent = styled.div`
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
    margin: 0 0 0.5rem 0;
    line-height: 1.6;
  }
`;

const DeliveryStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  margin-top: 1rem;
  border-radius: 4px;
  font-weight: 500;
  background-color: ${props => props.$delivered ? '#c6f6d5' : '#ebf8ff'};
  color: ${props => props.$delivered ? '#2f855a' : '#2b6cb0'};
  
  svg {
    font-size: 1.2rem;
  }
`;

const PaymentStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  background-color: ${props => props.$paid ? '#e6fffa' : '#fff5f5'};
  color: ${props => props.$paid ? '#38b2ac' : '#e53e3e'};
  
  svg {
    font-size: 1rem;
  }
`;

const PaymentDetails = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #edf2f7;
  
  p {
    margin: 0.5rem 0;
    color: #4a5568;
    
    strong {
      color: #2d3748;
      margin-right: 0.5rem;
    }
  }
`;

const OrderItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OrderItem = styled.div`
  display: flex;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProductImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1.5rem;
  border: 1px solid #eee;
`;

const ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductName = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ProductMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const MetaItem = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const PriceDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuantityLabel = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const QuantityValue = styled.div`
  font-weight: 600;
`;

const ProductPrice = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UnitPrice = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const TotalPrice = styled.div`
  font-weight: 600;
`;

const OrderSummaryCard = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const SummaryCardHeader = styled.div`
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

const PriceSummary = styled.div`
  padding: 1rem;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ShippingPrice = styled.div`
  font-weight: 600;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  border-top: 1px solid #eee;
`;

const TotalAmount = styled.div`
  font-weight: 600;
`;

const PaymentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #f9f9f9;
`;

const PaymentInfoIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #4a6cf7;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PaymentInfoText = styled.div`
  flex: 1;
`;

const ShippingNote = styled.div`
  padding: 1rem;
  background-color: #f9f9f9;
`;

const FreeShippingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  background-color: #ebf8ff;
  color: #2b6cb0;
  
  svg {
    font-size: 1.2rem;
  }
`;

const ShippingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  background-color: #ebf8ff;
  color: #2b6cb0;
  
  svg {
    font-size: 1.2rem;
  }
`;

const DeliveryInfo = styled.div`
  padding: 1rem;
  background-color: #f9f9f9;
`;

const DeliveryInfoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  
  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
  }
  
  svg {
    color: #4a6cf7;
    font-size: 1.2rem;
  }
`;

const DeliveryInfoContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const DeliveryInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const TrackButton = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a6cf7;
  text-decoration: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    text-decoration: underline;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const ActionButtonsGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9f9f9;
`;

const ViewAllOrdersButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a6cf7;
  text-decoration: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    text-decoration: underline;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const ContinueShoppingButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a6cf7;
  text-decoration: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    text-decoration: underline;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const SupportInfo = styled.div`
  padding: 1rem;
  background-color: #f9f9f9;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-left-color: #4a6cf7;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const Message = styled.div`
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #666;
  text-align: center;
  font-size: 0.95rem;
`;

export default OrderDetails;