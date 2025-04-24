import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCheck, FaTruck, FaBox, FaTimes, FaShippingFast } from 'react-icons/fa';
import { getOrderDetails, updateOrderStatus } from '../../redux/slices/adminSlice';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { loading, error, orderDetails, updateLoading, success } = useSelector(state => state.admin);
  const { isAuthenticated, token } = useSelector(state => state.auth);
  
  const [statusUpdate, setStatusUpdate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Check for authentication
  useEffect(() => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to view this page');
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);
  
  // Fetch order details
  useEffect(() => {
    if (id && isAuthenticated) {
      dispatch(getOrderDetails(id));
    }
  }, [dispatch, id, isAuthenticated]);
  
  // Handle success message
  useEffect(() => {
    if (success) {
      toast.success('Order status updated successfully');
      // Refresh order data
      dispatch(getOrderDetails(id));
    }
  }, [success, dispatch, id]);
  
  // Handle error message
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle status update
  const handleStatusUpdate = (e) => {
    e.preventDefault();
    if (!statusUpdate) {
      toast.error('Please select a status');
      return;
    }
    
    dispatch(updateOrderStatus({
      orderId: id,
      status: statusUpdate,
      trackingNumber,
      notes
    }));
  };
  
  if (loading) {
    return <LoadingContainer>Loading order details...</LoadingContainer>;
  }
  
  if (!orderDetails) {
    return <LoadingContainer>Order not found</LoadingContainer>;
  }
  
  return (
    <OrderDetailContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <BackButton onClick={() => navigate('/admin/orders')}>
          <FaArrowLeft /> Back to Orders
        </BackButton>
        <Title>Order #{orderDetails._id?.substring(orderDetails._id?.length - 6)}</Title>
      </Header>
      
      <OrderGrid>
        <OrderInfoSection>
          <SectionTitle>Order Information</SectionTitle>
          <InfoRow>
            <InfoLabel>Order ID:</InfoLabel>
            <InfoValue>{orderDetails._id}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Date Placed:</InfoLabel>
            <InfoValue>{formatDate(orderDetails.createdAt)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Customer:</InfoLabel>
            <InfoValue>
              {orderDetails.user?.name || 'Guest'} {orderDetails.user?.email ? `(${orderDetails.user.email})` : ''}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Status:</InfoLabel>
            <OrderStatus $status={orderDetails.status?.toLowerCase() || 'pending'}>
              {orderDetails.status || 'Pending'}
            </OrderStatus>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Payment Status:</InfoLabel>
            <PaymentStatus $isPaid={orderDetails.isPaid}>
              {orderDetails.isPaid ? 'Paid' : 'Not Paid'}
            </PaymentStatus>
          </InfoRow>
          {orderDetails.isPaid && orderDetails.paidAt && (
            <InfoRow>
              <InfoLabel>Paid On:</InfoLabel>
              <InfoValue>{formatDate(orderDetails.paidAt)}</InfoValue>
            </InfoRow>
          )}
          <InfoRow>
            <InfoLabel>Payment Method:</InfoLabel>
            <InfoValue>{orderDetails.paymentMethod || 'Not specified'}</InfoValue>
          </InfoRow>
          {orderDetails.trackingNumber && (
            <InfoRow>
              <InfoLabel>Tracking Number:</InfoLabel>
              <InfoValue>{orderDetails.trackingNumber}</InfoValue>
            </InfoRow>
          )}
        </OrderInfoSection>
        
        <ShippingSection>
          <SectionTitle>Shipping Information</SectionTitle>
          {orderDetails.shippingAddress ? (
            <>
              <InfoRow>
                <InfoLabel>Name:</InfoLabel>
                <InfoValue>{orderDetails.shippingAddress.name || orderDetails.user?.name || 'N/A'}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Address:</InfoLabel>
                <InfoValue>
                  {orderDetails.shippingAddress.street}, {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zipCode}, {orderDetails.shippingAddress.country}
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Phone:</InfoLabel>
                <InfoValue>{orderDetails.shippingAddress.phone || 'N/A'}</InfoValue>
              </InfoRow>
            </>
          ) : (
            <InfoValue>No shipping information available</InfoValue>
          )}
        </ShippingSection>
        
        <UpdateStatusSection>
          <SectionTitle>Update Order Status</SectionTitle>
          <form onSubmit={handleStatusUpdate}>
            <FormGroup>
              <label htmlFor="status">Status:</label>
              <select 
                id="status" 
                value={statusUpdate} 
                onChange={(e) => setStatusUpdate(e.target.value)}
                required
              >
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="tracking">Tracking Number:</label>
              <input
                id="tracking"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number (optional)"
              />
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="notes">Notes:</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the order (optional)"
                rows={3}
              />
            </FormGroup>
            
            <UpdateButton type="submit" disabled={updateLoading}>
              {updateLoading ? 'Updating...' : 'Update Status'}
            </UpdateButton>
          </form>
        </UpdateStatusSection>
      </OrderGrid>
      
      <OrderItemsSection>
        <SectionTitle>Order Items</SectionTitle>
        <ItemsTable>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orderDetails.items?.map((item) => (
              <tr key={item._id}>
                <ProductCell>
                  <ProductImage src={item.image} alt={item.name} />
                  <ProductDetails>
                    <ProductName>{item.name}</ProductName>
                    {item.size && <ProductMeta>Size: {item.size}</ProductMeta>}
                    {item.color && <ProductMeta>Color: {item.color}</ProductMeta>}
                  </ProductDetails>
                </ProductCell>
                <td>{item.quantity}</td>
                <td>${item.price?.toFixed(2)}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" align="right"><strong>Subtotal:</strong></td>
              <td>${orderDetails.itemsPrice?.toFixed(2) || '0.00'}</td>
            </tr>
            {orderDetails.shippingPrice > 0 && (
              <tr>
                <td colSpan="3" align="right"><strong>Shipping:</strong></td>
                <td>${orderDetails.shippingPrice?.toFixed(2) || '0.00'}</td>
              </tr>
            )}
            {orderDetails.taxPrice > 0 && (
              <tr>
                <td colSpan="3" align="right"><strong>Tax:</strong></td>
                <td>${orderDetails.taxPrice?.toFixed(2) || '0.00'}</td>
              </tr>
            )}
            <tr>
              <td colSpan="3" align="right"><strong>Total:</strong></td>
              <td>${orderDetails.totalAmount?.toFixed(2) || orderDetails.totalPrice?.toFixed(2) || '0.00'}</td>
            </tr>
          </tfoot>
        </ItemsTable>
      </OrderItemsSection>
      
      {orderDetails.notes && (
        <NotesSection>
          <SectionTitle>Order Notes</SectionTitle>
          <NotesContent>{orderDetails.notes}</NotesContent>
        </NotesSection>
      )}
    </OrderDetailContainer>
  );
};

// Styled components
const OrderDetailContainer = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #4a5568;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    color: #2d3748;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const OrderGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
`;

const OrderInfoSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
`;

const ShippingSection = styled(OrderInfoSection)``;

const UpdateStatusSection = styled(OrderInfoSection)``;

const OrderItemsSection = styled(OrderInfoSection)`
  margin-bottom: 24px;
`;

const NotesSection = styled(OrderInfoSection)``;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 12px;
`;

const InfoLabel = styled.div`
  font-weight: 500;
  color: #4a5568;
  width: 40%;
  padding-right: 16px;
`;

const InfoValue = styled.div`
  color: #2d3748;
  flex: 1;
`;

const OrderStatus = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  
  ${props => {
    switch(props.$status) {
      case 'delivered':
        return `
          background-color: #c6f6d5;
          color: #2f855a;
        `;
      case 'shipped':
        return `
          background-color: #bee3f8;
          color: #2b6cb0;
        `;
      case 'processing':
        return `
          background-color: #feebc8;
          color: #c05621;
        `;
      case 'cancelled':
        return `
          background-color: #fed7d7;
          color: #c53030;
        `;
      case 'pending':
      default:
        return `
          background-color: #e2e8f0;
          color: #4a5568;
        `;
    }
  }}
`;

const PaymentStatus = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  background-color: ${props => props.$isPaid ? '#c6f6d5' : '#fed7d7'};
  color: ${props => props.$isPaid ? '#2f855a' : '#c53030'};
`;

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    font-weight: 600;
    color: #4a5568;
  }
  
  tfoot td {
    font-weight: 500;
  }
`;

const ProductCell = styled.td`
  display: flex;
  align-items: center;
`;

const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 12px;
`;

const ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductName = styled.div`
  font-weight: 500;
`;

const ProductMeta = styled.div`
  font-size: 12px;
  color: #718096;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #4a5568;
  }
  
  select, input, textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
    }
  }
`;

const UpdateButton = styled.button`
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #3182ce;
  }
  
  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const NotesContent = styled.p`
  margin: 0;
  white-space: pre-wrap;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 18px;
  color: #4a5568;
`;

export default OrderDetail; 