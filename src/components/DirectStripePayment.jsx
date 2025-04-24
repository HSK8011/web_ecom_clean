import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { FaLock, FaCreditCard, FaCalendarAlt, FaShieldAlt, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../constants';
import { clearCart, clearUserCart } from '../redux/slices/cartSlice';
import { createOrder } from '../redux/slices/orderSlice';

const DirectStripePayment = ({ totalAmount, shippingAddress, items, onClose }) => {
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  
  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Format expiry date as MM/YY
  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    return v;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!cardHolder || !expiry || !cvc) {
      setError('Please fill in all card details');
      return;
    }
    
    // Parse expiry date
    const [expMonth, expYear] = expiry.split('/');
    
    // Format validation
    if (!expMonth || !expYear || expMonth < 1 || expMonth > 12) {
      setError('Please enter a valid expiry date (MM/YY)');
      return;
    }
    
    const currentYear = new Date().getFullYear() % 100;
    if (parseInt(expYear) < currentYear) {
      setError('Please enter a valid year');
      return;
    }
    
    if (cvc.length < 3) {
      setError('Please enter a valid CVC');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // Use a test token based on the card number
      // For a real implementation, you'd need to use Stripe.js to create a token
      let testToken;
      if (cardNumber.startsWith('4242')) {
        // Success case - Valid card
        testToken = 'tok_visa';
      } else if (cardNumber.startsWith('4000000000000341')) {
        // Attaching this token to a charge will fail with a card_declined error
        testToken = 'tok_chargeDeclined';
      } else if (cardNumber.startsWith('4000000000000002')) {
        // Card declined with insufficient_funds code
        testToken = 'tok_visa_declined';
      } else if (cardNumber.startsWith('4000000000000069')) {
        // Card that will be declined with an expired_card code
        testToken = 'tok_visa_expired';
      } else {
        // Default to a valid test token
        testToken = 'tok_visa';
      }
      
      // Log payment attempt details
      console.log('Submitting payment:', {
        amount: Math.round(Number(totalAmount) * 100),
        token: testToken
      });
      
      // Process the payment with the token
      const { data: paymentData } = await axios.post(
        `${API_URL}/stripe/direct-payment-guest`,
        { 
          amount: Math.round(Number(totalAmount) * 100), // Convert to cents for Stripe
          token: testToken
        },
        config
      );
      
      if (paymentData.success) {
        // Create order with payment already processed
        const itemsPrice = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
        const shippingPrice = itemsPrice >= 100 ? 0 : 10;
        const taxPrice = Math.round((itemsPrice * 0.07) * 100) / 100; // 7% tax rate with proper rounding
        const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2);
        
        // Format the order data to match server expectations
        const orderData = {
          orderItems: items.map(item => ({
            product: item._id || item.product || item.id,
            name: item.name,
            qty: item.quantity || 1,
            price: item.price,
            image: item.image || '',
            size: item.size || '',
            color: item.color || ''
          })),
          totalPrice: totalPrice,
          totalAmount: totalPrice, // Send both formats to be safe
          shippingAddress: shippingAddress,
          paymentMethod: 'Credit Card',
          paymentResult: {
            id: paymentData.paymentIntentId,
            status: 'succeeded',
            update_time: new Date().toISOString()
          },
          isPaid: true,
          paidAt: new Date().toISOString(),
          taxPrice: taxPrice.toFixed(2),
          shippingPrice: shippingPrice.toFixed(2),
          itemsPrice: itemsPrice.toFixed(2)
        };
        
        // Log the order data for debugging
        console.log('Creating order with data:', orderData);
        
        try {
          const result = await dispatch(createOrder(orderData)).unwrap();
          
          // Clear the cart
          dispatch(clearCart());
          if (token) {
            dispatch(clearUserCart());
          }
          
          toast.success('Payment successful! Order has been created.');
          navigate(`/order/${result._id}`);
        } catch (orderError) {
          console.error('Failed to create order:', orderError);
          setError(`Failed to create order: ${orderError}`);
          // Payment was successful but order creation failed, consider handling this case
        }
      } else if (paymentData.requires_action) {
        // Handle 3D Secure authentication if needed
        toast.info(paymentData.message || 'Additional authentication required');
        // Redirect to a page to handle 3D Secure
        window.location.href = paymentData.next_action.redirect_to_url.url;
      } else {
        setError(paymentData.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      // More detailed error handling
      let errorMessage = 'Payment processing failed. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        errorMessage = error.response.data.error || 
                      error.response.data.message || 
                      `Server error (${error.response.status})`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <Container>
      <CloseButton onClick={onClose}>
        <FaTimes />
      </CloseButton>
      
      <h2>Complete Payment</h2>
      
      <TotalAmount>
        ${totalAmount}
      </TotalAmount>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>
            <FaCreditCard /> Card Holder Name
          </Label>
          <Input
            type="text"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            placeholder="Name as it appears on card"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>
            <FaCreditCard /> Card Number
          </Label>
          <Input
            type="text"
            value={formatCardNumber(cardNumber)}
            onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
            placeholder="4242 4242 4242 4242"
            maxLength="19"
            disabled
          />
          <small>Using test card: 4242 4242 4242 4242</small>
        </FormGroup>
        
        <FormGroup className="card-details">
          <FormGroup>
            <Label>
              <FaCalendarAlt /> Expiry Date
            </Label>
            <Input
              type="text"
              value={expiry}
              onChange={(e) => {
                const formatted = formatExpiry(e.target.value);
                if (formatted.length <= 5) {
                  setExpiry(formatted);
                }
              }}
              placeholder="MM/YY"
              maxLength="5"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>
              <FaShieldAlt /> CVC
            </Label>
            <Input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              maxLength="4"
              required
            />
          </FormGroup>
        </FormGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Button 
          type="submit"
          disabled={processing}
        >
          {processing ? 'Processing...' : `Pay $${totalAmount}`}
        </Button>
        
        <SecureNotice>
          <FaLock /> Secure payment processed by Stripe
        </SecureNotice>
      </Form>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  position: relative;
  max-width: 500px;
  margin: 0 auto;
  padding: 2.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  
  h2 {
    margin-bottom: 1.5rem;
    font-size: 1.75rem;
    color: #1a202c;
    text-align: center;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #a0aec0;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0.5rem;
  border-radius: 50%;
  
  &:hover {
    color: #4a5568;
    background-color: #f7fafc;
  }
`;

const TotalAmount = styled.div`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  color: #1a202c;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  small {
    color: #718096;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  &.card-details {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1rem;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d3748;
  
  svg {
    color: #4299e1;
  }
`;

const Input = styled.input`
  padding: 0.875rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;
  background-color: #fff;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }

  &:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const Button = styled.button`
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background-color: #4299e1;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
  
  &:hover:not(:disabled) {
    background-color: #3182ce;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  padding: 1rem;
  background-color: #fff5f5;
  border-left: 4px solid #e53e3e;
  font-size: 0.95rem;
  border-radius: 4px;
  margin: 0.5rem 0;
`;

const SecureNotice = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #4a5568;
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  
  svg {
    color: #48bb78;
  }
`;

export default DirectStripePayment; 