import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaTruck, FaCreditCard, FaEdit } from 'react-icons/fa';
import { createOrder } from '../redux/slices/orderSlice';
import { fetchUserProfile } from '../redux/slices/userSlice';
import { clearCart } from '../redux/cartSlice';

const ReviewOrder = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [shippingErrors, setShippingErrors] = useState({});
  
  const { user } = useSelector((state) => state.auth);
  const { items: cartItems, shippingAddress, paymentMethod } = useSelector((state) => state.cart);
  const { loading, success, error } = useSelector((state) => state.orders);
  
  // Calculate prices
  const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingPrice = itemsPrice > 100 ? 0 : 10;
  const taxPrice = Number((0.15 * itemsPrice).toFixed(2));
  const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2);
  
  // Validation helpers
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
    return phoneRegex.test(phone);
  };
  
  const validatePostalCode = (postalCode, country) => {
    if (country === "US") {
      const usZipRegex = /^\d{5}(-\d{4})?$/;
      return usZipRegex.test(postalCode);
    } else if (country === "CA") {
      const caPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      return caPostalRegex.test(postalCode);
    }
    // Default validation for other countries
    return postalCode.length >= 3;
  };
  
  const validateShippingForm = () => {
    const errors = {};
    
    // Required fields
    if (!shippingAddress.fullName) errors.fullName = "Full name is required";
    if (!shippingAddress.address) errors.address = "Address is required";
    if (!shippingAddress.city) errors.city = "City is required";
    if (!shippingAddress.postalCode) errors.postalCode = "Postal code is required";
    if (!shippingAddress.country) errors.country = "Country is required";
    if (!shippingAddress.phone) errors.phone = "Phone number is required";
    
    // Format validation
    if (shippingAddress.phone && !validatePhoneNumber(shippingAddress.phone)) {
      errors.phone = "Invalid phone number format";
    }
    
    if (shippingAddress.postalCode && !validatePostalCode(shippingAddress.postalCode, shippingAddress.country)) {
      errors.postalCode = "Invalid postal code format";
    }
    
    return errors;
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      toast.error('Please login to continue');
      return;
    }
    
    // Redirect if cart is empty
    if (cartItems.length === 0) {
      navigate('/');
      toast.info('Your cart is empty');
      return;
    }
    
    // Redirect if shipping address is not set
    if (!shippingAddress || !shippingAddress.address) {
      navigate('/shipping');
      toast.error('Please enter shipping address first');
      return;
    }
    
    // Redirect if payment method is not set
    if (!paymentMethod) {
      navigate('/payment');
      toast.error('Please select payment method first');
      return;
    }
  }, [navigate, user, cartItems, shippingAddress, paymentMethod]);
  
  useEffect(() => {
    if (success) {
      // Refresh profile data when order is successful
      dispatch(fetchUserProfile());
      navigate('/order-success');
    }
  }, [success, navigate, dispatch]);
  
  const placeOrderHandler = () => {
    // Validate shipping information
    const errors = validateShippingForm();
    if (Object.keys(errors).length > 0) {
      setShippingErrors(errors);
      return;
    }
    
    setIsPlacingOrder(true);
    
    // Place order logic here
    setTimeout(() => {
      setIsPlacingOrder(false);
      dispatch(clearCart());
      navigate("/order-success");
    }, 2000);
  };
  
  return (
    <ReviewContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <OrderSummary>
        <SectionTitle>
          <FaShoppingCart />
          <h2>Order Summary</h2>
        </SectionTitle>
        
        <ItemsContainer>
          {cartItems.map((item) => (
            <OrderItem key={`${item.id}-${item.size}-${item.color}`}>
              <ItemImage>
                <img src={item.image} alt={item.name} />
              </ItemImage>
              <ItemDetails>
                <h3>{item.name}</h3>
                <p>Size: {item.size} | Color: {item.color}</p>
                <p>Quantity: {item.qty}</p>
              </ItemDetails>
              <ItemPrice>${(item.price * item.qty).toFixed(2)}</ItemPrice>
            </OrderItem>
          ))}
        </ItemsContainer>
        
        <SectionTitle>
          <FaTruck />
          <h2>Shipping</h2>
          <EditButton onClick={() => navigate('/shipping')}>
            <FaEdit />
          </EditButton>
        </SectionTitle>
        
        <AddressCard>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Address:</strong> {shippingAddress.address}</p>
          <p><strong>City:</strong> {shippingAddress.city}, {shippingAddress.postalCode}</p>
          <p><strong>Country:</strong> {shippingAddress.country}</p>
          <p><strong>Phone:</strong> {shippingAddress.phone}</p>
        </AddressCard>
        
        <SectionTitle>
          <FaCreditCard />
          <h2>Payment</h2>
          <EditButton onClick={() => navigate('/payment')}>
            <FaEdit />
          </EditButton>
        </SectionTitle>
        
        <PaymentCard>
          <p><strong>Method:</strong> {paymentMethod}</p>
        </PaymentCard>
      </OrderSummary>
      
      <OrderTotal>
        <TotalCard>
          <h2>Order Total</h2>
          
          <PriceRow>
            <span>Items:</span>
            <span>${itemsPrice.toFixed(2)}</span>
          </PriceRow>
          
          <PriceRow>
            <span>Shipping:</span>
            <span>${shippingPrice.toFixed(2)}</span>
          </PriceRow>
          
          <PriceRow>
            <span>Tax:</span>
            <span>${taxPrice.toFixed(2)}</span>
          </PriceRow>
          
          <TotalRow>
            <span>Total:</span>
            <span>${totalPrice}</span>
          </TotalRow>
          
          {Object.keys(shippingErrors).length > 0 && (
            <ErrorMessage>Please fix the validation errors in your shipping information</ErrorMessage>
          )}
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <PlaceOrderButton 
            onClick={placeOrderHandler} 
            disabled={isPlacingOrder || loading}
          >
            {isPlacingOrder || loading ? 'Processing...' : 'Place Order'}
          </PlaceOrderButton>
          
          <BackButton onClick={() => navigate('/payment')}>
            Back to Payment
          </BackButton>
        </TotalCard>
        
        <SecureCheckout>
          <p>Your payment information is processed securely. We do not store credit card details nor have access to your payment information.</p>
        </SecureCheckout>
      </OrderTotal>
    </ReviewContainer>
  );
};

// Styled Components
const ReviewContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const OrderSummary = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  
  h2 {
    font-size: 1.25rem;
    color: #2d3748;
    margin: 0;
  }
  
  svg {
    color: #4299e1;
    font-size: 1.25rem;
  }
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: #4299e1;
  cursor: pointer;
  margin-left: auto;
  padding: 0.25rem;
  
  &:hover {
    color: #2b6cb0;
  }
`;

const ItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OrderItem = styled.div`
  display: flex;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemImage = styled.div`
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }
`;

const ItemDetails = styled.div`
  flex: 1;
  
  h3 {
    font-size: 1rem;
    margin: 0 0 0.5rem 0;
    color: #2d3748;
  }
  
  p {
    margin: 0.25rem 0;
    color: #718096;
    font-size: 0.875rem;
  }
`;

const ItemPrice = styled.div`
  font-weight: 600;
  color: #2d3748;
  font-size: 1rem;
`;

const AddressCard = styled.div`
  background-color: #f7fafc;
  border-radius: 6px;
  padding: 1rem;
  
  p {
    margin: 0.5rem 0;
    color: #4a5568;
    font-size: 0.9rem;
  }
`;

const PaymentCard = styled.div`
  background-color: #f7fafc;
  border-radius: 6px;
  padding: 1rem;
  
  p {
    margin: 0.5rem 0;
    color: #4a5568;
    font-size: 0.9rem;
  }
`;

const OrderTotal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TotalCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  
  h2 {
    font-size: 1.25rem;
    color: #2d3748;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0.75rem 0;
  color: #4a5568;
  font-size: 0.9rem;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 1.5rem 0 1rem 0;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
  font-weight: 600;
  color: #2d3748;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  background-color: #fed7d7;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem 0;
  font-size: 0.9rem;
`;

const PlaceOrderButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  
  &:hover {
    background-color: #2c5282;
  }
  
  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.75rem;
  
  &:hover {
    background-color: #edf2f7;
  }
`;

const SecureCheckout = styled.div`
  background-color: #f0fff4;
  border: 1px solid #c6f6d5;
  border-radius: 6px;
  padding: 1rem;
  
  p {
    margin: 0;
    color: #2f855a;
    font-size: 0.8rem;
    text-align: center;
  }
`;

export default ReviewOrder; 