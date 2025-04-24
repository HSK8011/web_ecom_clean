import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiMail, FiLock } from 'react-icons/fi';
import { login } from '../redux/slices/authSlice';
import { addItemToUserCart, fetchUserCart, switchToUserCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import api from '../config/api';

const LoginContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #000;
    box-shadow: 0 0 0 1px #000;
  }
`;

const Icon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #1a1a1a;
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }
`;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Sync cart after successful login
  const syncCart = async () => {
    console.log("Syncing cart for user:", user);
    
    try {
      // First fetch the user's cart from MongoDB
      const { data } = await api.get('/api/cart');
      console.log("MongoDB cart data:", data);
      
      // If the local cart has items, sync them to the MongoDB cart
      const localCart = localStorage.getItem('guestCartItems') 
        ? JSON.parse(localStorage.getItem('guestCartItems')) 
        : items;
      
      console.log("Local cart:", localCart);
      
      if (localCart && localCart.length > 0) {
        console.log("Syncing local items to MongoDB cart");
        // Upload each local cart item to MongoDB
        for (const item of localCart) {
          console.log("Adding item to MongoDB cart:", item);
          await dispatch(addItemToUserCart({
            _id: item._id || item.product,
            quantity: item.quantity,
            color: item.color,
            size: item.size
          })).unwrap();
        }
        localStorage.removeItem('guestCartItems');
      } else if (data.items && data.items.length > 0) {
        console.log("Using MongoDB cart items");
        // If MongoDB cart has items but local cart is empty, use MongoDB cart
        dispatch(switchToUserCart(data));
      }
    } catch (err) {
      console.error('Error syncing cart:', err);
    }
  };

  useEffect(() => {
    if (user) {
      syncCart();
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      toast.success('Login successful');
      // Cart will be synced in useEffect when user state updates
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <LoginContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center mb-8">Welcome Back</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormGroup>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <InputWrapper>
              <Icon>
                <FiMail />
              </Icon>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </InputWrapper>
          </FormGroup>

          <FormGroup>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <InputWrapper>
              <Icon>
                <FiLock />
              </Icon>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </InputWrapper>
          </FormGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          {error && (
            <motion.p
              className="text-red-500 text-sm mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-black font-medium hover:underline">
            Sign up
          </Link>
        </p>

        <div className="mt-8">
          <p className="text-center text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-black hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-black hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </motion.div>
    </LoginContainer>
  );
};

export default Login; 