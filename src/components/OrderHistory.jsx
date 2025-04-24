import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { getUserOrders } from '../redux/slices/orderSlice';

const OrderHistoryContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background-color: #f8fafc;
  font-weight: 600;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #1a1a1a;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  ${({ status }) => {
    switch (status) {
      case 'Paid':
        return 'background-color: #dcfce7; color: #166534;';
      case 'Delivered':
        return 'background-color: #dbeafe; color: #1e40af;';
      default:
        return 'background-color: #fef2f2; color: #991b1b;';
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
`;

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'Not Available';
  
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const OrderHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { orders, loading } = useSelector((state) => state.order);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    dispatch(getUserOrders());
  }, [dispatch, user, navigate]);

  if (loading) {
    return (
      <OrderHistoryContainer>
        <div className="text-center">Loading...</div>
      </OrderHistoryContainer>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <OrderHistoryContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <EmptyState>
            <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-4">
              You haven't placed any orders yet. Start shopping to see your order history.
            </p>
            <Button onClick={() => navigate('/')}>Start Shopping</Button>
          </EmptyState>
        </motion.div>
      </OrderHistoryContainer>
    );
  }

  return (
    <OrderHistoryContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center mb-8">Order History</h1>

        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Date</Th>
              <Th>Total</Th>
              <Th>Paid</Th>
              <Th>Delivered</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <Td>{order._id}</Td>
                <Td>
                  {formatDate(order.createdAt)}
                </Td>
                <Td>${order.totalPrice}</Td>
                <Td>
                  <StatusBadge status={order.isPaid ? 'Paid' : 'Not Paid'}>
                    {order.isPaid ? formatDate(order.paidAt) : 'Not Paid'}
                  </StatusBadge>
                </Td>
                <Td>
                  <StatusBadge status={order.isDelivered ? 'Delivered' : 'Not Delivered'}>
                    {order.isDelivered
                      ? formatDate(order.deliveredAt)
                      : 'Not Delivered'}
                  </StatusBadge>
                </Td>
                <Td>
                  <Button onClick={() => navigate(`/order/${order._id}`)}>
                    Details
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </motion.div>
    </OrderHistoryContainer>
  );
};

export default OrderHistory; 