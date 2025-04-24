import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaEdit, FaShippingFast, FaRegCreditCard, FaMapMarkerAlt, FaUser, FaDollarSign, FaTruck } from 'react-icons/fa';
import { getOrderDetails, updateOrderStatus, markOrderAsPaid } from '../../redux/slices/adminSlice';

// Order status mapping with colors (matching OrderList)
const ORDER_STATUS = {
  'pending': { label: 'Pending', color: '#f6ad55' },
  'processing': { label: 'Processing', color: '#4299e1' },
  'shipped': { label: 'Shipped', color: '#68d391' },
  'delivered': { label: 'Delivered', color: '#38a169' },
  'cancelled': { label: 'Cancelled', color: '#e53e3e' }
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Local state
  const [newStatus, setNewStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentId, setPaymentId] = useState('');
  
  // Redux state
  const { orderDetails: order, loading, error } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  
  // Calculate the subtotal from order items
  const calculateSubtotal = () => {
    if (!order || !order.orderItems || !order.orderItems.length) {
      return 0;
    }
    
    const subtotal = order.orderItems.reduce((sum, item) => {
      return sum + (item.price * (item.qty || item.quantity || 1));
    }, 0);
    
    return subtotal.toFixed(2);
  };
  
  useEffect(() => {
    if (!user || !(user.isAdmin || user.role === 'admin')) {
      navigate('/login');
      return;
    }
    
    if (orderId) {
      dispatch(getOrderDetails(orderId));
    }
  }, [dispatch, orderId, user, navigate]);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  useEffect(() => {
    if (order) {
      setNewStatus(order.status || 'pending');
      setTrackingNumber(order.trackingNumber || '');
      setNotes(order.notes || '');
    }
  }, [order]);
  
  const openStatusModal = () => {
    setShowStatusModal(true);
  };
  
  const closeStatusModal = () => {
    setShowStatusModal(false);
  };
  
  const openPaymentModal = () => {
    setPaymentMethod(order.paymentMethod || '');
    setShowPaymentModal(true);
  };
  
  const closePaymentModal = () => {
    setShowPaymentModal(false);
  };
  
  const handleStatusUpdate = () => {
    // Ensure status is lowercase to match the backend enum values
    const statusToSend = newStatus ? newStatus.toLowerCase() : 'pending';
    
    dispatch(updateOrderStatus({
      orderId,
      status: statusToSend,
      trackingNumber,
      notes
    }))
      .unwrap()
      .then(() => {
        toast.success(`Order status updated to ${ORDER_STATUS[statusToSend]?.label || statusToSend}`);
        closeStatusModal();
      })
      .catch(err => {
        toast.error(err || 'Failed to update status');
      });
  };
  
  const handlePaymentUpdate = () => {
    dispatch(markOrderAsPaid({
      orderId,
      paymentResult: {
        id: paymentId,
        status: 'completed',
        update_time: new Date().toISOString(),
        email_address: order.user?.email || ''
      }
    }))
      .unwrap()
      .then(() => {
        toast.success('Payment status updated successfully');
        closePaymentModal();
      })
      .catch(err => {
        toast.error(err || 'Failed to update payment status');
      });
  };
  
  const goBack = () => {
    navigate('/admin/orders');
  };
  
  if (loading || !order) {
    return (
      <Container>
        <LoadingMessage>Loading order details...</LoadingMessage>
      </Container>
    );
  }
  
  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <BackButton onClick={goBack}>
          <FaArrowLeft /> Back to Orders
        </BackButton>
        <h1>Order Details</h1>
        <OrderId>ID: {orderId}</OrderId>
      </Header>
      
      <OrderGrid>
        <OrderInfoSection>
          <SectionTitle>Order Information</SectionTitle>
          <InfoCard>
            <InfoRow>
              <InfoLabel>Order ID</InfoLabel>
              <InfoValue>{order._id}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Date Placed</InfoLabel>
              <InfoValue>
                {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>
                <StatusBadge $status={order.status}>
                  {ORDER_STATUS[order.status]?.label || order.status}
                </StatusBadge>
                <EditButton onClick={openStatusModal}>
                  <FaEdit /> Update
                </EditButton>
              </InfoValue>
            </InfoRow>
            {order.trackingNumber && (
              <InfoRow>
                <InfoLabel>Tracking</InfoLabel>
                <InfoValue>{order.trackingNumber}</InfoValue>
              </InfoRow>
            )}
            {order.notes && (
              <InfoRow>
                <InfoLabel>Notes</InfoLabel>
                <InfoValue>{order.notes}</InfoValue>
              </InfoRow>
            )}
          </InfoCard>
        </OrderInfoSection>
        
        <CustomerSection>
          <SectionTitle>
            <FaUser /> Customer Information
          </SectionTitle>
          <InfoCard>
            <InfoRow>
              <InfoLabel>Name</InfoLabel>
              <InfoValue>{order.user?.name || 'Guest'}</InfoValue>
            </InfoRow>
            {order.user?.email && (
              <InfoRow>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>
                  <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
                </InfoValue>
              </InfoRow>
            )}
            <InfoRow>
              <InfoLabel>Customer ID</InfoLabel>
              <InfoValue>{order.user?._id || 'Guest Checkout'}</InfoValue>
            </InfoRow>
          </InfoCard>
        </CustomerSection>
        
        <PaymentSection>
          <SectionTitle>
            <FaRegCreditCard /> Payment Details
          </SectionTitle>
          <InfoCard>
            <InfoRow>
              <InfoLabel>Method</InfoLabel>
              <InfoValue>{order.paymentMethod}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>
                <PaymentStatus $isPaid={order.isPaid}>
                  {order.isPaid ? 'Paid' : 'Not Paid'}
                </PaymentStatus>
                {!order.isPaid && (
                  <EditButton onClick={openPaymentModal}>
                    <FaEdit /> Mark as Paid
                  </EditButton>
                )}
              </InfoValue>
            </InfoRow>
            {order.isPaid && (
              <>
                <InfoRow>
                  <InfoLabel>Date</InfoLabel>
                  <InfoValue>
                    {new Date(order.paidAt).toLocaleDateString()}
                  </InfoValue>
                </InfoRow>
                {order.paymentResult?.id && (
                  <InfoRow>
                    <InfoLabel>Transaction ID</InfoLabel>
                    <InfoValue>{order.paymentResult.id}</InfoValue>
                  </InfoRow>
                )}
              </>
            )}
          </InfoCard>
        </PaymentSection>
        
        <ShippingSection>
          <SectionTitle>
            <FaMapMarkerAlt /> Shipping Address
          </SectionTitle>
          <InfoCard>
            {order.shippingAddress ? (
              <>
                <InfoRow>
                  <InfoLabel>Name</InfoLabel>
                  <InfoValue>{order.shippingAddress.name}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Address</InfoLabel>
                  <InfoValue>
                    {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                    {order.shippingAddress.state} {order.shippingAddress.postalCode},{' '}
                    {order.shippingAddress.country}
                  </InfoValue>
                </InfoRow>
                {order.shippingAddress.phone && (
                  <InfoRow>
                    <InfoLabel>Phone</InfoLabel>
                    <InfoValue>{order.shippingAddress.phone}</InfoValue>
                  </InfoRow>
                )}
                <InfoRow>
                  <InfoLabel>Delivery</InfoLabel>
                  <InfoValue>
                    <DeliveryStatus $isDelivered={order.isDelivered}>
                      {order.isDelivered ? 'Delivered' : 'Not Delivered'}
                    </DeliveryStatus>
                    {order.isDelivered && order.deliveredAt && (
                      <span>on {new Date(order.deliveredAt).toLocaleDateString()}</span>
                    )}
                  </InfoValue>
                </InfoRow>
              </>
            ) : (
              <EmptyState>No shipping information available</EmptyState>
            )}
          </InfoCard>
        </ShippingSection>
      </OrderGrid>
      
      <OrderItems>
        <SectionTitle>
          <FaShippingFast /> Order Items ({order.orderItems?.length || 0})
        </SectionTitle>
        
        <ItemsTable>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.orderItems?.map((item) => (
              <tr key={item._id || item.product}>
                <td>
                  <ProductInfo>
                    {item.image && (
                      <ProductImage src={item.image} alt={item.name} />
                    )}
                    <div>
                      <ProductName>{item.name}</ProductName>
                      {item.size && <ProductMeta>Size: {item.size}</ProductMeta>}
                      {item.color && (
                        <ProductMeta>
                          Color: <ColorDot style={{ backgroundColor: item.color }} /> {item.colorName || item.color}
                        </ProductMeta>
                      )}
                    </div>
                  </ProductInfo>
                </td>
                <td>${item.price.toFixed(2)}</td>
                <td>{item.qty}</td>
                <td>${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </ItemsTable>
      </OrderItems>
      
      <OrderSummary>
        <SectionTitle>
          <FaDollarSign /> Order Summary
        </SectionTitle>
        <SummaryCard>
          <SummaryRow>
            <SummaryLabel>Items Total</SummaryLabel>
            <SummaryValue>${calculateSubtotal()}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Shipping</SummaryLabel>
            <SummaryValue>${order.shippingPrice?.toFixed(2)}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Tax</SummaryLabel>
            <SummaryValue>${order.taxPrice?.toFixed(2)}</SummaryValue>
          </SummaryRow>
          {order.discountApplied && (
            <SummaryRow>
              <SummaryLabel>Discount</SummaryLabel>
              <SummaryValue className="discount">-${order.discountApplied?.toFixed(2)}</SummaryValue>
            </SummaryRow>
          )}
          <SummaryDivider />
          <SummaryRow className="total">
            <SummaryLabel>Total</SummaryLabel>
            <SummaryValue>${order.totalPrice?.toFixed(2)}</SummaryValue>
          </SummaryRow>
        </SummaryCard>
      </OrderSummary>
      
      {showStatusModal && (
        <Modal>
          <ModalContent>
            <h3>Update Order Status</h3>
            <FormGroup>
              <label>Order Status</label>
              <SelectField
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {Object.entries(ORDER_STATUS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </SelectField>
            </FormGroup>
            
            <FormGroup>
              <label>Tracking Number</label>
              <InputField
                type="text"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </FormGroup>
            
            <FormGroup>
              <label>Order Notes</label>
              <TextareaField
                placeholder="Add notes about this order"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </FormGroup>
            
            <ModalButtons>
              <Button onClick={closeStatusModal} secondary>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} primary>
                Update Status
              </Button>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
      
      {showPaymentModal && (
        <Modal>
          <ModalContent>
            <h3>Mark Order as Paid</h3>
            <p>Update payment status for order #{orderId.substring(0, 8)}...</p>
            
            <FormGroup>
              <label>Payment Method</label>
              <InputField
                type="text"
                placeholder="Payment method"
                value={paymentMethod}
                disabled
              />
            </FormGroup>
            
            <FormGroup>
              <label>Transaction ID</label>
              <InputField
                type="text"
                placeholder="Enter transaction ID"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
              />
            </FormGroup>
            
            <ModalButtons>
              <Button onClick={closePaymentModal} secondary>
                Cancel
              </Button>
              <Button 
                onClick={handlePaymentUpdate} 
                primary
                disabled={!paymentId}
              >
                Mark as Paid
              </Button>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

const Container = styled(motion.div)`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  
  h1 {
    font-size: 1.5rem;
    margin: 0;
    color: #2d3748;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    
    h1 {
      position: static;
      transform: none;
    }
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f7fafc;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #4a5568;
  cursor: pointer;
  
  &:hover {
    background-color: #edf2f7;
  }
`;

const OrderId = styled.div`
  font-family: monospace;
  font-size: 0.875rem;
  color: #718096;
`;

const OrderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  color: #2d3748;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    color: #4299e1;
  }
`;

const InfoCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background-color: #fafafa;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const InfoLabel = styled.div`
  font-weight: 500;
  color: #4a5568;
  width: 120px;
  flex-shrink: 0;
  
  @media (max-width: 640px) {
    width: 100%;
    margin-bottom: 0.25rem;
  }
`;

const InfoValue = styled.div`
  color: #2d3748;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  a {
    color: #3182ce;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.75rem;
  background-color: ${props => {
    const statusConfig = ORDER_STATUS[props.$status];
    return statusConfig ? statusConfig.color : '#a0aec0';
  }};
  color: white;
`;

const PaymentStatus = styled.span`
  font-weight: 500;
  color: ${props => props.$isPaid ? '#38a169' : '#e53e3e'};
`;

const DeliveryStatus = styled.span`
  font-weight: 500;
  color: ${props => props.$isDelivered ? '#38a169' : '#e53e3e'};
  margin-right: 0.5rem;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background-color: #edf2f7;
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
  font-size: 0.75rem;
  color: #4a5568;
  cursor: pointer;
  
  &:hover {
    background-color: #e2e8f0;
  }
  
  svg {
    font-size: 0.7rem;
  }
`;

const OrderInfoSection = styled.div`
  grid-column: 1;
`;

const CustomerSection = styled.div`
  grid-column: 2;
`;

const PaymentSection = styled.div`
  grid-column: 1;
`;

const ShippingSection = styled.div`
  grid-column: 2;
`;

const OrderItems = styled.div`
  margin-bottom: 2rem;
`;

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    font-weight: 600;
    color: #4a5568;
    background-color: #f7fafc;
  }
  
  td:last-child {
    text-align: right;
  }
  
  th:last-child {
    text-align: right;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
`;

const ProductName = styled.div`
  font-weight: 500;
  color: #2d3748;
`;

const ProductMeta = styled.div`
  font-size: 0.75rem;
  color: #718096;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.25rem;
`;

const ColorDot = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const OrderSummary = styled.div`
  width: 100%;
  max-width: 400px;
  margin-left: auto;
`;

const SummaryCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background-color: #fafafa;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  
  &.total {
    font-weight: 600;
    font-size: 1.125rem;
    color: #2d3748;
  }
  
  .discount {
    color: #e53e3e;
  }
`;

const SummaryLabel = styled.div`
  color: #4a5568;
`;

const SummaryValue = styled.div`
  color: #2d3748;
`;

const SummaryDivider = styled.hr`
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 1rem 0;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  
  h3 {
    margin-top: 0;
    color: #2d3748;
  }
  
  p {
    color: #4a5568;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4a5568;
  }
`;

const InputField = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
  
  &:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
  }
`;

const SelectField = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
`;

const TextareaField = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  
  background-color: ${props => {
    if (props.danger) return '#e53e3e';
    if (props.secondary) return '#edf2f7';
    if (props.primary) return '#3182ce';
    return '#3182ce';
  }};
  
  color: ${props => {
    if (props.secondary) return '#4a5568';
    return 'white';
  }};
  
  &:hover {
    background-color: ${props => {
      if (props.danger) return '#c53030';
      if (props.secondary) return '#e2e8f0';
      if (props.primary) return '#2b6cb0';
      return '#2b6cb0';
    }};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #4a5568;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 1rem;
  color: #718096;
  font-style: italic;
`;

export default OrderDetails; 