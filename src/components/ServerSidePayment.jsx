import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { FaLock, FaCreditCard, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../constants';
import { clearCart, clearUserCart } from '../redux/slices/cartSlice';
import { getOrderDetails, updateOrderPayment } from '../redux/slices/orderSlice';

const ServerSidePayment = ({ orderId, totalAmount, onClose }) => {
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
          Authorization: `Bearer ${token}`,
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
      
      // Process the payment with the token
      const { data } = await axios.post(
        `${API_URL}/stripe/process-payment`,
        { 
          orderId,
          token: testToken,
          amount: Math.round(Number(totalAmount) * 100) // Convert to cents for Stripe
        },
        config
      );
      
      if (data.success) {
        toast.success(data.message || 'Payment successful!');
        
        // Update Redux store with the paid order data
        if (data.order) {
          const paymentResult = {
            id: data.order.paymentResult?.id || 'test_payment',
            status: 'COMPLETED',
            update_time: new Date().toISOString(),
            email_address: data.order.user?.email || '',
            amount: totalAmount
          };
          
          // Dispatch the update payment action to update Redux state
          await dispatch(updateOrderPayment({ 
            orderId, 
            paymentResult 
          })).unwrap();
        } else {
          // If no order data was returned, fetch fresh order data
          await dispatch(getOrderDetails(orderId)).unwrap();
        }
        
        // Clear the cart in Redux and optionally on the backend
        dispatch(clearCart());
        
        // If user is authenticated, also clear the cart on the backend
        if (token) {
          dispatch(clearUserCart());
        }
        
        // Close the payment form
        onClose();
        
        // No need to navigate since we're in a modal and already on the order page
        // Just refresh the current page to show the updated payment status
        // navigate(`/orders/${orderId}`);
      } else if (data.requires_action) {
        // Handle 3D Secure authentication if needed
        toast.info(data.message || 'Additional authentication required');
        // Redirect to a page to handle 3D Secure
        window.location.href = data.next_action.redirect_to_url.url;
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.error || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <Container>
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
        
        <CancelButton type="button" onClick={onClose}>
          Cancel
        </CancelButton>
      </Form>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
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

const CancelButton = styled(Button)`
  color: #4a5568;
  background-color: transparent;
  border: 1.5px solid #e2e8f0;
  
  &:hover:not(:disabled) {
    background-color: #f7fafc;
    border-color: #cbd5e0;
    transform: translateY(-1px);
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

export default ServerSidePayment; 