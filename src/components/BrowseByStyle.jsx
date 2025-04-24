import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { fetchCategories } from '../redux/slices/categoriesSlice';

const OuterSection = styled.div`
  padding: 4rem 0;
  background-color: #f8f9fa;
`;

const Section = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const StyleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3rem;
  margin-top: 2rem;
  
  & > div:nth-child(3) {
    width: 150%;
  }
  
  & > div:nth-child(4) {
    width: 50%;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    
    & > div {
      width: 100% !important;
    }
  }
`;

const StyleCard = styled.div`
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  background: linear-gradient(135deg, #6B73FF 0%, #000DFF 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const StyleTitle = styled.h3`
  font-size: 2rem;
  font-weight: 600;
  color: white;
  margin: 0;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #000;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #dc3545;
`;

const NoProductsMessage = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  font-size: 1.5rem;
  color: #666;
  background: #f8f9fa;
  border-radius: 1rem;
  margin: 2rem 0;
`;

const BrowseByStyle = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: categories, status, error } = useSelector((state) => state.categories);

  React.useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.slug}`);
  };

  // Sort categories in the desired order
  const sortedCategories = React.useMemo(() => {
    if (!categories) return [];
    const order = ['casual', 'formal', 'party', 'gym'];
    return [...categories].sort((a, b) => {
      return order.indexOf(a.slug.toLowerCase()) - order.indexOf(b.slug.toLowerCase());
    });
  }, [categories]);

  if (status === 'loading') {
    return (
      <OuterSection>
        <Section>
          <SectionTitle>Browse By Dress Style</SectionTitle>
          <LoadingMessage>Loading categories...</LoadingMessage>
        </Section>
      </OuterSection>
    );
  }

  if (error) {
    return (
      <OuterSection>
        <Section>
          <SectionTitle>Browse By Dress Style</SectionTitle>
          <ErrorMessage>{error}</ErrorMessage>
        </Section>
      </OuterSection>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <OuterSection>
        <Section>
          <SectionTitle>Browse By Dress Style</SectionTitle>
          <NoProductsMessage>No categories found</NoProductsMessage>
        </Section>
      </OuterSection>
    );
  }

  return (
    <OuterSection>
      <Section>
        <SectionTitle>Browse By Dress Style</SectionTitle>
        <StyleGrid>
          {sortedCategories.map((category) => (
            <StyleCard 
              key={category._id} 
              onClick={() => handleCategoryClick(category)}
            >
              <StyleTitle>{category.name}</StyleTitle>
            </StyleCard>
          ))}
        </StyleGrid>
      </Section>
    </OuterSection>
  );
};

export default BrowseByStyle; 