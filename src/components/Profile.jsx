import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaPen, FaClock, FaShoppingBag } from 'react-icons/fa';
import { fetchUserProfile, updateProfile, clearProfile } from '../redux/slices/userSlice';
import { toast } from 'react-toastify';

const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  @media (min-width: 768px) {
    grid-template-columns: 1fr 2fr;
  }
`;

const ProfileCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const OrdersCard = styled(ProfileCard)`
  overflow: hidden;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e0e0e0;
    color: #333;
  }

  svg {
    font-size: 0.9rem;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
`;

const InfoIcon = styled.span`
  color: #666;
  margin-right: 1rem;
  width: 20px;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin: 0;
`;

const InfoValue = styled.p`
  color: #333;
  font-weight: 500;
  margin: 0.25rem 0 0;
`;

const OrdersList = styled.div`
  margin-top: 1rem;
`;

const OrderItem = styled.div`
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #f9f9f9;

  &:last-child {
    margin-bottom: 0;
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const OrderDate = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const OrderStatus = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'delivered':
      case 'completed':
        return '#e1f7e1';
      case 'shipped':
        return '#e1f0ff';
      case 'processing':
        return '#fff3e1';
      case 'cancelled':
        return '#ffe1e1';
      default:
        return '#f0f0f0';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'delivered':
      case 'completed':
        return '#2e7d32';
      case 'shipped':
        return '#1565c0';
      case 'processing':
        return '#ed6c02';
      case 'cancelled':
        return '#d32f2f';
      default:
        return '#666';
    }
  }};
`;

const OrderAmount = styled.div`
  font-weight: 600;
  color: #333;
`;

const OrderSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const SummaryItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
`;

const SummaryLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const SummaryValue = styled.div`
  color: #333;
  font-weight: 600;
  font-size: 1.2rem;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  text-align: center;
  padding: 1rem;
  background: #ffebee;
  border-radius: 8px;
  margin: 1rem 0;
`;

const EditModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const Form = styled.form`
  display: grid;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 1px #4a90e2;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background: #4a90e2;
    color: white;

  &:hover {
      background: #357abd;
    }
  }

  &.secondary {
    background: #e2e8f0;
    color: #4a5568;

    &:hover {
      background: #cbd5e0;
    }
  }
`;

const Profile = () => {
  const dispatch = useDispatch();
  const { user, recentOrders, orderSummary, status, error } = useSelector((state) => state.user);
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, token]);

  useEffect(() => {
    if (user) {
      console.log('User data in profile:', user);
      console.log('Address data:', user.address);
      
      // Ensure we have proper defaults for all form fields
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || ''
        }
      });
      
      // Verify form data was set correctly
      setTimeout(() => {
        console.log('Form data after init:', formData);
      }, 100);
    }
  }, [user]);

  // Log order data when it changes
  useEffect(() => {
    if (recentOrders) {
      console.log('Recent orders in profile:', recentOrders);
      console.log('Recent orders count:', recentOrders.length);
      console.log('Order summary data:', orderSummary);
      
      // If recentOrders exists but orderSummary is missing or incorrect, calculate it locally
      if (recentOrders.length > 0 && (!orderSummary || orderSummary.totalOrders !== recentOrders.length)) {
        const calculatedSummary = {
          totalOrders: recentOrders.length,
          totalSpent: recentOrders.reduce((sum, order) => 
            sum + (Number(order.totalAmount) || Number(order.totalPrice) || 0), 0)
        };
        
        console.log('Calculated summary locally:', calculatedSummary);
      }
    }
  }, [recentOrders, orderSummary]);

  const handleEdit = () => {
    // Set form data again when editing starts to ensure latest values
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || ''
        }
      });
    }
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const updated = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
        console.log('Updated form data:', updated);
        return updated;
      });
    } else {
      setFormData(prev => {
        const updated = {
          ...prev,
          [name]: value
        };
        console.log('Updated form data:', updated);
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Log complete form data before submission
      console.log('Form data before submit:', formData);
      
      // Create the formatted data for API ensuring all fields are included
      const apiData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '', // Ensure phone is never undefined
        address: {
          street: formData.address?.street || '',
          city: formData.address?.city || '',
          state: formData.address?.state || '',
          zipCode: formData.address?.zipCode || '',
          country: formData.address?.country || ''
        }
      };

      console.log('Submitting profile data:', apiData);
      
      // Store original user data for comparison
      const originalUserData = { ...user };
      console.log('BEFORE UPDATE - Original user data:', originalUserData);
      
      const result = await dispatch(updateProfile(apiData)).unwrap();
      console.log('AFTER UPDATE - Profile update result (raw):', result);
      
      // Determine the updated user data based on the response structure
      const userData = result && result.user ? result.user : result;
      
      if (result && result.user) {
        console.log('AFTER UPDATE - User data from result:', result.user);
        console.log('AFTER UPDATE - Received phone:', result.user.phone);
        console.log('AFTER UPDATE - Received address:', result.user.address);
      } else {
        console.log('AFTER UPDATE - Direct result data:', result);
        console.log('AFTER UPDATE - Received phone:', result.phone);
        console.log('AFTER UPDATE - Received address:', result.address);
      }
      
      // Compare what changed
      console.log('COMPARISON - Phone changed:', {
        before: originalUserData.phone,
        after: userData.phone,
        changed: originalUserData.phone !== userData.phone
      });
      
      console.log('COMPARISON - Address changed:', {
        before: JSON.stringify(originalUserData.address),
        after: JSON.stringify(userData.address),
        changed: JSON.stringify(originalUserData.address) !== JSON.stringify(userData.address)
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
      
      // Force window reload to ensure all state is fresh
      window.location.reload();
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(err.message || 'Failed to update profile');
    }
  };

  if (!isAuthenticated || !token) {
    return (
      <ProfileContainer>
        <ErrorMessage>Please log in to view your profile</ErrorMessage>
      </ProfileContainer>
    );
  }

  if (status === 'loading' && !user) {
    return (
      <ProfileContainer>
        <LoadingSpinner>Loading your profile...</LoadingSpinner>
      </ProfileContainer>
    );
  }

  if (status === 'failed') {
    return (
      <ProfileContainer>
        <ErrorMessage>
          {error || 'Failed to load profile. Please try logging in again.'}
        </ErrorMessage>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <ProfileGrid>
        <div>
          <ProfileCard>
            <Title>
              Personal Information
              <EditButton onClick={handleEdit}>
                <FaPen /> Edit Profile
              </EditButton>
            </Title>
            <InfoItem>
              <InfoIcon>
                <FaUser />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Name</InfoLabel>
                <InfoValue>{user?.name || 'Not provided'}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <FaEnvelope />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{user?.email || 'Not provided'}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <FaPhone />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Phone</InfoLabel>
                <InfoValue>{user?.phone || 'Not provided'}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <FaMapMarkerAlt />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Address</InfoLabel>
                <InfoValue>
                  {user?.address ? (
                    <>
                      {user.address.street}, {user.address.city}<br />
                      {user.address.state}, {user.address.zipCode}<br />
                      {user.address.country}
                    </>
                  ) : (
                    'Not provided'
                  )}
                </InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <FaClock />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Member Since</InfoLabel>
                <InfoValue>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Not available'}
                </InfoValue>
              </InfoContent>
            </InfoItem>
          </ProfileCard>

          <ProfileCard style={{ marginTop: '2rem' }}>
            <Title>Order Summary</Title>
            <OrderSummary>
              <SummaryItem>
                <SummaryLabel>Total Orders</SummaryLabel>
                <SummaryValue>
                  {(recentOrders && recentOrders.length > 0 && (!orderSummary || orderSummary.totalOrders < recentOrders.length)) 
                    ? recentOrders.length 
                    : orderSummary?.totalOrders || 0}
                </SummaryValue>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Total Spent</SummaryLabel>
                <SummaryValue>
                  ${(recentOrders && recentOrders.length > 0 && (!orderSummary || orderSummary.totalOrders < recentOrders.length))
                    ? recentOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || Number(order.totalPrice) || 0), 0).toFixed(2)
                    : orderSummary?.totalSpent?.toFixed(2) || '0.00'}
                </SummaryValue>
              </SummaryItem>
            </OrderSummary>
          </ProfileCard>
        </div>

        <OrdersCard>
          <Title>Recent Orders</Title>
          <OrdersList>
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <OrderItem key={order._id}>
                  <OrderHeader>
                    <OrderDate>
                      {order.orderDate 
                        ? new Date(order.orderDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                    </OrderDate>
                    <OrderStatus status={order.status}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </OrderStatus>
                  </OrderHeader>
                  <div>
                    <InfoLabel>Order ID: {order._id}</InfoLabel>
                    <OrderAmount>${order.totalAmount.toFixed(2)}</OrderAmount>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <InfoLabel>Items: {order.items.length}</InfoLabel>
                    <InfoValue>
                      {order.items.map((item, index) => (
                        <span key={item._id}>
                          {item.name}
                          {index < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </InfoValue>
                  </div>
                </OrderItem>
              ))
            ) : (
              <InfoValue style={{ textAlign: 'center', padding: '2rem' }}>
                No orders found
              </InfoValue>
            )}
          </OrdersList>
        </OrdersCard>
      </ProfileGrid>

      {isEditing && (
        <EditModal>
          <ModalContent>
            <Title>Edit Profile</Title>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <label htmlFor="name">Name</label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="email">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="phone">Phone</label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel" // Add type for better mobile keyboard
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </FormGroup>
              
              <h4>Address</h4>
              <FormGroup>
                <label htmlFor="address.street">Street</label>
                <Input
                  id="address.street"
                  name="address.street"
                  value={formData.address?.street || ''}
                  onChange={handleChange}
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="address.city">City</label>
                <Input
                  id="address.city"
                  name="address.city"
                  value={formData.address?.city || ''}
                  onChange={handleChange}
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="address.state">State</label>
                <Input
                  id="address.state"
                  name="address.state"
                  value={formData.address?.state || ''}
                  onChange={handleChange}
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="address.zipCode">Postal Code</label>
                <Input
                  id="address.zipCode"
                  name="address.zipCode"
                  value={formData.address?.zipCode || ''}
                  onChange={handleChange}
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="address.country">Country</label>
                <Input
                  id="address.country"
                  name="address.country"
                  value={formData.address?.country || ''}
                  onChange={handleChange}
                />
              </FormGroup>
              
              <ButtonGroup>
                <Button type="submit" className="primary">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  className="secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </EditModal>
      )}
    </ProfileContainer>
  );
};

export default Profile; 