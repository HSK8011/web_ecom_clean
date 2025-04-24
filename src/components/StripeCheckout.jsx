import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { FaLock, FaCreditCard } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import axios from 'axios';
import { API_URL } from '../constants';
import { clearCart } from '../redux/slices/cartSlice';

// Initialize Stripe with a test publishable key
// This is a test key so it's safe to hardcode
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const CheckoutForm = ({ orderId, totalAmount }) => {
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };
        
        const { data } = await axios.post(
          `${API_URL}/stripe/create-payment-intent`,
          { orderId },
          config
        );
        
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast.error(error.response?.data?.message || 'Failed to initialize payment');
      }
    };
    
    createPaymentIntent();
  }, [orderId, token]);
  
  const handleChange = async (event) => {
    // Listen for changes in the CardElement
    // and display any errors as the customer types their card details
    setDisabled(event.empty);
    setError(event.error ? event.error.message : '');
  };
  
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    
    if (!stripe || !elements || !cardHolder) {
      return;
    }
    
    setProcessing(true);
    
    try {
      const payload = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: cardHolder,
          },
        },
      });
      
      if (payload.error) {
        setError(`Payment failed: ${payload.error.message}`);
        setProcessing(false);
      } else {
        // Payment succeeded
        setError(null);
        setProcessing(false);
        setSucceeded(true);
        
        // Confirm payment with our backend immediately
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };
        
        await axios.post(
          `${API_URL}/stripe/confirm-payment`,
          { 
            orderId,
            paymentIntentId: payload.paymentIntent.id 
          },
          config
        );
        
        toast.success('Payment processed successfully!');
        
        // Clear the cart
        dispatch(clearCart());
        
        // Redirect to order confirmation
        setTimeout(() => {
          navigate(`/orders/${orderId}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('An unexpected error occurred. Please try again.');
      setProcessing(false);
    }
  };
  
  return (
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
          <FaCreditCard /> Card Details
        </Label>
        <CardElementContainer>
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
              hidePostalCode: true,
            }}
            onChange={handleChange}
          />
        </CardElementContainer>
      </FormGroup>
      
      <TotalAmount>
        Total: ${totalAmount.toFixed(2)}
      </TotalAmount>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Button 
        type="submit"
        disabled={processing || disabled || succeeded}
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </Button>
      
      <SecureNotice>
        <FaLock /> Secure payment processed by Stripe
      </SecureNotice>
    </Form>
  );
};

const StripeCheckout = ({ orderId, totalAmount }) => {
  return (
    <Container>
      <h2>Complete Payment</h2>
      <Elements stripe={stripePromise}>
        <CheckoutForm orderId={orderId} totalAmount={totalAmount} />
      </Elements>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  h2 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: #2d3748;
    text-align: center;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a5568;
  
  svg {
    color: #3182ce;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 1px #4299e1;
  }
`;

const CardElementContainer = styled.div`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  transition: border-color 0.2s;
  
  &:focus-within {
    border-color: #4299e1;
    box-shadow: 0 0 0 1px #4299e1;
  }
`;

const TotalAmount = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  color: #2d3748;
  margin-top: 0.5rem;
`;

const Button = styled.button`
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #3182ce;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: #2c5282;
  }
  
  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  padding: 0.5rem;
  background-color: #fff5f5;
  border-left: 3px solid #e53e3e;
  font-size: 0.9rem;
`;

const SecureNotice = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #718096;
  margin-top: 1rem;
  
  svg {
    color: #48bb78;
  }
`;

export default StripeCheckout; 