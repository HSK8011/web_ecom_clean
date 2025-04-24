import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaEye, FaSearch, FaTimes, FaFilter, FaSort, FaDownload, FaShippingFast } from 'react-icons/fa';
import { getAdminOrders, updateOrderStatus, getAllOrders } from '../../redux/slices/adminSlice';

// Order status mapping with colors
const ORDER_STATUS = {
  'pending': { label: 'Pending', color: '#f6ad55' },
  'processing': { label: 'Processing', color: '#4299e1' },
  'shipped': { label: 'Shipped', color: '#68d391' },
  'delivered': { label: 'Delivered', color: '#38a169' },
  'cancelled': { label: 'Cancelled', color: '#e53e3e' }
};

const OrderList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, orders } = useSelector(state => state.admin);
  const { token, isAuthenticated } = useSelector(state => state.auth);

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to access the admin area');
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);
  
  // Fetch orders when component mounts or filter/page changes
  useEffect(() => {
    if (isAuthenticated && token) {
      dispatch(getAllOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter
      }));
    }
  }, [dispatch, currentPage, statusFilter, isAuthenticated, token]);
  
  // Show error if any
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Change page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Apply filters
  const handleFilterApply = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  // Clear filters
  const handleClearFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
    
  // Get order list to display
  const orderList = orders?.orders || [];
  const totalPages = orders?.pages || 1;

  // Filter orders by search query (client-side filtering)
  const filteredOrders = searchQuery
    ? orderList.filter(order => 
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.user?.name && order.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.user?.email && order.user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : orderList;

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <h1>Orders</h1>
        <Controls>
          <SearchForm onSubmit={handleFilterApply}>
            <SearchInput
              type="text"
              placeholder="Search by order ID or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchButton type="submit">
                <FaSearch />
            </SearchButton>
          </SearchForm>
          
          <FilterContainer>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          
            {(statusFilter || searchQuery) && (
              <ClearFiltersButton onClick={handleClearFilters}>
                <FaTimes /> Clear Filters
              </ClearFiltersButton>
          )}
          </FilterContainer>
        </Controls>
      </Header>

      {loading ? (
        <LoadingMessage>Loading orders...</LoadingMessage>
      ) : (
        <>
          <OrdersTable>
              <thead>
                <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
                </tr>
              </thead>
              <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
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
                        <FaEye /> View
                        </ActionButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">No orders found</td>
                </tr>
              )}
              </tbody>
          </OrdersTable>
          
          {totalPages > 1 && (
            <Pagination>
              <PaginationButton 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </PaginationButton>
              
              {[...Array(totalPages).keys()].map(page => (
                <PageNumber
                  key={page + 1}
                  $active={currentPage === page + 1}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </PageNumber>
              ))}
              
              <PaginationButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </PaginationButton>
            </Pagination>
          )}
        </>
      )}
    </PageContainer>
  );
};

// Styled components
const PageContainer = styled(motion.div)`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    
    h1 {
      margin-bottom: 16px;
    }
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;

const SearchForm = styled.form`
  display: flex;
  width: 300px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`;

const SearchButton = styled.button`
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 0 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #3182ce;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  select {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 14px;
    min-width: 150px;
    
    &:focus {
      outline: none;
      border-color: #4299e1;
  }
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
    
    select {
      flex: 1;
    }
  }
`;

const ClearFiltersButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  color: #a0aec0;
  cursor: pointer;
  
  &:hover {
    background-color: #f7fafc;
    color: #4a5568;
  }
`;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
  
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    font-weight: 600;
    color: #4a5568;
    white-space: nowrap;
  }
  
  tbody tr:hover {
    background-color: #f7fafc;
  }
  
  @media (max-width: 1024px) {
    display: block;
    overflow-x: auto;
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

const ActionButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  background-color: ${props => props.disabled ? '#e2e8f0' : '#4299e1'};
  color: ${props => props.disabled ? '#a0aec0' : 'white'};
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &:hover:not(:disabled) {
    background-color: #3182ce;
  }
`;

const PageNumber = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${props => props.$active ? '#4299e1' : 'white'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  border: 1px solid ${props => props.$active ? '#4299e1' : '#e2e8f0'};
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$active ? '#3182ce' : '#f7fafc'};
  }
`;

const LoadingMessage = styled.div`
  padding: 48px;
  text-align: center;
  color: #4a5568;
`;

export default OrderList; 