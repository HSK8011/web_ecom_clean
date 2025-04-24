import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft, FaTachometerAlt } from 'react-icons/fa';

const AdminContainer = styled.div`
  min-height: calc(100vh - 56px - 90px);
  padding-top: 56px;
  background-color: #f8f9fa;
  position: relative;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.25rem 2rem;
  padding-bottom: 6rem;
  position: relative;
  min-height: calc(100vh - 56px - 90px);
`;

const ContentWrapper = styled.div`
  margin-bottom: 1rem;
`;

const ButtonContainer = styled.div`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: ${props => props.$primary ? 'white' : '#2c3e50'};
  background-color: ${props => props.$primary ? '#2c3e50' : 'white'};
  border: 1px solid ${props => props.$primary ? '#2c3e50' : '#e2e8f0'};
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    background-color: ${props => props.$primary ? '#34495e' : '#f8f9fa'};
    border-color: ${props => props.$primary ? '#34495e' : '#cbd5e0'};
  }

  svg {
    margin-right: 0.75rem;
    font-size: 1.1rem;
  }
`;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAddProduct = location.pathname.includes('/products/new');

  return (
    <AdminContainer>
      <MainContent>
        <ContentWrapper>
          <Outlet />
        </ContentWrapper>
        <ButtonContainer>
          {isAddProduct ? (
            <Button $primary onClick={() => navigate('/admin')}>
              <FaTachometerAlt /> Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate(-1)}>
              <FaArrowLeft /> Back
            </Button>
          )}
        </ButtonContainer>
      </MainContent>
    </AdminContainer>
  );
};

export default AdminLayout; 