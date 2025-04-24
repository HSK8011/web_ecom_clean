import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

const NotFound = () => {
  return (
    <NotFoundContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ErrorCode>404</ErrorCode>
      <Title>Page Not Found</Title>
      <Description>
        The page you are looking for might have been removed, had its name changed, 
        or is temporarily unavailable.
      </Description>
      
      <IllustrationContainer>
        <img 
          src="/images/not-found.svg" 
          alt="Page not found" 
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </IllustrationContainer>
      
      <ButtonContainer>
        <BackButton to={-1}>
          <FaArrowLeft /> Go Back
        </BackButton>
        <HomeButton to="/">
          <FaHome /> Back to Home
        </HomeButton>
      </ButtonContainer>
    </NotFoundContainer>
  );
};

const NotFoundContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
`;

const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: 700;
  color: #3182ce;
  margin: 0;
  line-height: 1;
  background: linear-gradient(135deg, #3182ce 0%, #805ad5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 2.5rem;
  color: #2d3748;
  margin: 1rem 0 1.5rem;
`;

const Description = styled.p`
  font-size: 1.125rem;
  color: #718096;
  max-width: 600px;
  line-height: 1.6;
  margin-bottom: 2.5rem;
`;

const IllustrationContainer = styled.div`
  max-width: 400px;
  margin: 0 auto 3rem;
  
  img {
    width: 100%;
    height: auto;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
`;

const Button = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  text-decoration: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const BackButton = styled(Button)`
  background-color: white;
  color: #3182ce;
  border: 2px solid #e2e8f0;
  
  &:hover {
    background-color: #f7fafc;
    border-color: #cbd5e0;
  }
`;

const HomeButton = styled(Button)`
  background-color: #3182ce;
  color: white;
  border: 2px solid #3182ce;
  
  &:hover {
    background-color: #2c5282;
    border-color: #2c5282;
  }
`;

export default NotFound; 