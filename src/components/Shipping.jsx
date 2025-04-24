import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaUser, FaCity, FaMapPin, FaGlobe, FaArrowRight } from 'react-icons/fa';
import { saveShippingAddress } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';

const Shipping = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { shippingAddress } = useSelector((state) => state.cart);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Initialize form with existing shipping address if available
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (shippingAddress) {
      setFormData({
        fullName: shippingAddress.fullName || '',
        address: shippingAddress.address || '',
        city: shippingAddress.city || '',
        postalCode: shippingAddress.postalCode || '',
        country: shippingAddress.country || ''
      });
    }
  }, [shippingAddress, user, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch(saveShippingAddress(formData));
      toast.success('Shipping address saved');
      navigate('/payment');
    } else {
      toast.error('Please fill in all required fields');
    }
  };
  
  return (
    <ShippingContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormContainer>
        <h1>
          <FaMapMarkerAlt />
          Shipping Address
        </h1>
        
        <CheckoutSteps>
          <Step $completed>Cart</Step>
          <StepConnector $completed />
          <Step $active>Shipping</Step>
          <StepConnector />
          <Step>Payment</Step>
          <StepConnector />
          <Step>Place Order</Step>
        </CheckoutSteps>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="fullName">
              <FaUser />
              Full Name
            </Label>
            <Input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              $error={errors.fullName}
            />
            {errors.fullName && <ErrorMessage>{errors.fullName}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="address">
              <FaMapMarkerAlt />
              Address
            </Label>
            <Input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your street address"
              $error={errors.address}
            />
            {errors.address && <ErrorMessage>{errors.address}</ErrorMessage>}
          </FormGroup>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="city">
                <FaCity />
                City
              </Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter your city"
                $error={errors.city}
              />
              {errors.city && <ErrorMessage>{errors.city}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="postalCode">
                <FaMapPin />
                Postal Code
              </Label>
              <Input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="Enter postal code"
                $error={errors.postalCode}
              />
              {errors.postalCode && <ErrorMessage>{errors.postalCode}</ErrorMessage>}
            </FormGroup>
          </FormRow>
          
          <FormGroup>
            <Label htmlFor="country">
              <FaGlobe />
              Country
            </Label>
            <Input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Enter your country"
              $error={errors.country}
            />
            {errors.country && <ErrorMessage>{errors.country}</ErrorMessage>}
          </FormGroup>
          
          <ButtonGroup>
            <BackButton type="button" onClick={() => navigate('/cart')}>
              Back to Cart
            </BackButton>
            <SubmitButton type="submit">
              Proceed to Payment
              <FaArrowRight />
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </FormContainer>
    </ShippingContainer>
  );
};

// Styled Components
const ShippingContainer = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const FormContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  
  h1 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #2d3748;
  }
`;

const CheckoutSteps = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Step = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => {
    if (props.$active) return '#3182ce';
    if (props.$completed) return '#48bb78';
    return '#a0aec0';
  }};
  position: relative;
  padding: 0 0.5rem;
`;

const StepConnector = styled.div`
  flex-grow: 1;
  height: 2px;
  background-color: ${props => props.$completed ? '#48bb78' : '#e2e8f0'};
  margin: 0 0.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1.25rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #4a5568;
  
  svg {
    color: #4299e1;
    font-size: 0.9rem;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${props => props.$error ? '#e53e3e' : '#e2e8f0'};
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
  
  &::placeholder {
    color: #a0aec0;
  }
`;

const ErrorMessage = styled.p`
  color: #e53e3e;
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const BackButton = styled.button`
  padding: 0.75rem 1.25rem;
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #edf2f7;
  }
  
  @media (max-width: 480px) {
    order: 2;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2c5282;
  }
  
  @media (max-width: 480px) {
    order: 1;
  }
`;

export default Shipping; 