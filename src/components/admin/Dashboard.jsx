import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FaBox, FaUsers, FaShoppingBag, FaDollarSign, 
  FaChartLine, FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getAdminProducts, getAdminDashboard } from '../../redux/slices/adminSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboardData, loading, error } = useSelector(state => state.admin);
  const { user, token, isAuthenticated } = useSelector(state => state.auth);
  
  // Check authentication status
  useEffect(() => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to access the admin dashboard');
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);
  
  // Fetch data when component mounts
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('Dispatching admin dashboard fetch');
      dispatch(getAdminDashboard());
    }
  }, [dispatch, isAuthenticated, token]);
  
  // Show error if any
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  // Extract data from the dashboard response
  const metrics = dashboardData?.metrics || {};
  const recentOrders = dashboardData?.recentOrders || [];
  
  // Calculate statistics
  const totalProducts = metrics?.products?.totalProducts || 0;
  const inStockProducts = metrics?.products?.inStockProducts || 0;
  const outOfStockProducts = metrics?.products?.outOfStockProducts || 0;
  const lowStockProducts = metrics?.products?.lowStockProducts || 0;
  const totalCustomers = metrics?.counts?.totalCustomers || 0;
  const totalRevenue = metrics?.revenue?.totalRevenue || 0;
  
  // Get the user name from auth state
  const userName = user?.name || 'Admin';
  
  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <WelcomeHeader>
        <h1>Dashboard</h1>
        <WelcomeMessage>Welcome back, {userName}</WelcomeMessage>
      </WelcomeHeader>
      
      {loading ? (
        <LoadingMessage>Loading dashboard data...</LoadingMessage>
      ) : (
        <>
          <MetricsGrid>
            <MetricCard>
              <MetricIconContainer $bgColor="#4299e1">
                <FaBox />
              </MetricIconContainer>
              <MetricContent>
                <MetricValue>{totalProducts}</MetricValue>
                <MetricLabel>Total Products</MetricLabel>
              </MetricContent>
            </MetricCard>
            
            <MetricCard>
              <MetricIconContainer $bgColor="#48bb78">
                <FaShoppingBag />
              </MetricIconContainer>
              <MetricContent>
                <MetricValue>{inStockProducts}</MetricValue>
                <MetricLabel>In Stock Products</MetricLabel>
              </MetricContent>
            </MetricCard>
            
            <MetricCard>
              <MetricIconContainer $bgColor="#ed8936">
                <FaUsers />
              </MetricIconContainer>
              <MetricContent>
                <MetricValue>{totalCustomers}</MetricValue>
                <MetricLabel>Total Customers</MetricLabel>
              </MetricContent>
            </MetricCard>
            
            <MetricCard>
              <MetricIconContainer $bgColor="#e53e3e">
                <FaExclamationTriangle />
              </MetricIconContainer>
              <MetricContent>
                <MetricValue>{outOfStockProducts}</MetricValue>
                <MetricLabel>Out of Stock</MetricLabel>
              </MetricContent>
            </MetricCard>
            
            <MetricCard>
              <MetricIconContainer $bgColor="#805ad5">
                <FaDollarSign />
              </MetricIconContainer>
              <MetricContent>
                <MetricValue>${totalRevenue.toLocaleString()}</MetricValue>
                <MetricLabel>Total Revenue</MetricLabel>
              </MetricContent>
            </MetricCard>
          </MetricsGrid>
          
          <DashboardSections>
            <DashboardSection>
              <SectionHeader>
                <h2>Recent Orders</h2>
                <ViewAllLink as={Link} to="/admin/orders">View All</ViewAllLink>
              </SectionHeader>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {recentOrders && recentOrders.length > 0 ? (
                      recentOrders.map(order => (
                        <tr key={order._id}>
                          <td>#{order._id.substring(order._id.length - 6)}</td>
                          <td>{order.user?.name || 'Guest'}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <OrderStatus $status={order.status?.toLowerCase() || 'pending'}>
                              {order.status || 'Pending'}
                            </OrderStatus>
                          </td>
                          <td>${order.totalAmount?.toFixed(2) || order.totalPrice?.toFixed(2) || '0.00'}</td>
                          <td>
                            <ActionButton as={Link} to={`/admin/orders/${order._id}`}>
                              View
                            </ActionButton>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center' }}>No recent orders found</td>
                      </tr>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DashboardSection>
            
            <DashboardSection>
              <SectionHeader>
                <h2>Inventory Status</h2>
                <ViewAllLink as={Link} to="/admin/products">Manage Products</ViewAllLink>
              </SectionHeader>
              
              <InventoryStats>
                <InventoryStat>
                  <StatValue>{inStockProducts}</StatValue>
                  <StatLabel>Products In Stock</StatLabel>
                </InventoryStat>
                
                <InventoryStat>
                  <StatValue>{outOfStockProducts}</StatValue>
                  <StatLabel>Out of Stock Products</StatLabel>
                </InventoryStat>
                
                <InventoryStat>
                  <StatValue>{lowStockProducts}</StatValue>
                  <StatLabel>Low Stock Products</StatLabel>
                </InventoryStat>
              </InventoryStats>
              
              <LowStockWarning $visible={lowStockProducts > 0}>
                <FaExclamationTriangle /> {lowStockProducts} products are running low on inventory
              </LowStockWarning>
            </DashboardSection>
          </DashboardSections>
        </>
      )}
    </DashboardContainer>
  );
};

// Styled Components
const DashboardContainer = styled(motion.div)`
  width: 100%;
`;

const WelcomeHeader = styled.div`
  margin-bottom: 24px;
  
  h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    margin-bottom: 8px;
  }
`;

const WelcomeMessage = styled.p`
  color: #718096;
  margin: 0;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const MetricCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  display: flex;
  align-items: center;
`;

const MetricIconContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: ${props => props.$bgColor || '#4299e1'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 16px;
`;

const MetricContent = styled.div`
  flex: 1;
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  color: #718096;
  font-size: 14px;
`;

const DashboardSections = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const DashboardSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
`;

const ViewAllLink = styled.a`
  color: #4299e1;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  border-bottom: 2px solid #e2e8f0;
  
  th {
    text-align: left;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #4a5568;
  }
`;

const TableBody = styled.tbody`
  td {
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 14px;
  }
`;

const OrderStatus = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
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
      case 'pending':
        return `
          background-color: #e2e8f0;
          color: #4a5568;
        `;
      default:
        return `
          background-color: #e2e8f0;
          color: #4a5568;
        `;
    }
  }}
`;

const ActionButton = styled.a`
  display: inline-block;
  padding: 6px 12px;
  background-color: #ebf8ff;
  color: #3182ce;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  
  &:hover {
    background-color: #bee3f8;
  }
`;

const InventoryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
`;

const InventoryStat = styled.div`
  text-align: center;
  padding: 16px;
  background-color: #f7fafc;
  border-radius: 8px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  color: #718096;
  font-size: 14px;
`;

const LowStockWarning = styled.div`
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #fff5f5;
  color: #e53e3e;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
`;

const LoadingMessage = styled.div`
  padding: 48px;
  text-align: center;
  color: #4a5568;
`;

export default Dashboard; 