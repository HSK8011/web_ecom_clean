import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaCreditCard, FaPaypal, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { savePaymentMethod } from '../redux/slices/cartSlice';
import { API_URL } from '../constants';
import DirectStripePayment from './DirectStripePayment';
import { getUserOrders } from '../redux/slices/orderSlice.js';

// Payment method constants
const PAYMENT_METHODS = {
  CREDIT_CARD: 'Credit Card',
  PAYPAL: 'PayPal',
  CASH_ON_DELIVERY: 'Cash on Delivery'
};

const Payment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { shippingAddress = {}, paymentMethod: savedPaymentMethod, items = [] } = useSelector(state => state.cart || {});
  const { isAuthenticated, loading: authLoading } = useSelector(state => state.auth);
  const { orders = [] } = useSelector(state => state.orders || { orders: [] });
  
  const [paymentMethod, setPaymentMethod] = useState(savedPaymentMethod || PAYMENT_METHODS.CREDIT_CARD);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Calculate totals for payment
  const itemsPrice = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  const shippingPrice = itemsPrice >= 100 ? 0 : 10;
  const taxPrice = Math.round((itemsPrice * 0.07) * 100) / 100; // 7% tax rate with proper rounding
  const totalAmount = (itemsPrice + shippingPrice + taxPrice).toFixed(2);
  
  useEffect(() => {
    // Redirect if shipping address not set
    if (!shippingAddress || !shippingAddress.address) {
      toast.error('Please enter shipping address first');
      navigate('/shipping');
    }
    
    // Fetch user orders if authenticated
    if (isAuthenticated && !authLoading) {
      dispatch(getUserOrders());
    }
  }, [shippingAddress, navigate, isAuthenticated, authLoading, dispatch]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    
    if (paymentMethod === PAYMENT_METHODS.CREDIT_CARD) {
      // Show payment form for credit card
      setShowPaymentForm(true);
    } else {
      // For other payment methods, go to place order
      navigate('/place-order');
    }
  };
  
  return (
    <PaymentContainer>
      <h1>Payment Method</h1>
      
      <FormContainer onSubmit={handleSubmit}>
        <PaymentOption>
          <RadioButton 
            type="radio" 
            id="creditCard" 
            name="paymentMethod" 
            value={PAYMENT_METHODS.CREDIT_CARD}
            checked={paymentMethod === PAYMENT_METHODS.CREDIT_CARD}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <Label htmlFor="creditCard">
            <FaCreditCard />
            <span>Credit / Debit Card</span>
          </Label>
        </PaymentOption>
        
        <PaymentOption>
          <RadioButton 
            type="radio" 
            id="paypal" 
            name="paymentMethod" 
            value={PAYMENT_METHODS.PAYPAL}
            checked={paymentMethod === PAYMENT_METHODS.PAYPAL}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <Label htmlFor="paypal">
            <FaPaypal />
            <span>PayPal</span>
          </Label>
        </PaymentOption>
        
        <PaymentOption>
          <RadioButton 
            type="radio" 
            id="cashOnDelivery" 
            name="paymentMethod" 
            value={PAYMENT_METHODS.CASH_ON_DELIVERY}
            checked={paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <Label htmlFor="cashOnDelivery">
            <FaMoneyBillWave />
            <span>Cash on Delivery</span>
          </Label>
        </PaymentOption>
        
        <Button type="submit">
          {paymentMethod === PAYMENT_METHODS.CREDIT_CARD 
            ? 'Continue to Payment' 
            : 'Continue to Place Order'}
        </Button>
      </FormContainer>
      
      {showPaymentForm && (
        <Modal>
          <ModalContent>
            <DirectStripePayment 
              totalAmount={totalAmount} 
              shippingAddress={shippingAddress}
              items={items}
              onClose={() => setShowPaymentForm(false)} 
            />
          </ModalContent>
        </Modal>
      )}
    </PaymentContainer>
  );
};

const PaymentContainer = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  h1 {
    font-size: 1.5rem;
    margin-bottom: 2rem;
    color: #2d3748;
    text-align: center;
  }
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PaymentOption = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #cbd5e0;
    background: #f7fafc;
  }
`;

const RadioButton = styled.input`
  margin-right: 1rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  font-size: 1rem;
  cursor: pointer;
  
  svg {
    margin-right: 10px;
    font-size: 1.5rem;
    color: #4a5568;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #3182ce;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2c5282;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

export default Payment;