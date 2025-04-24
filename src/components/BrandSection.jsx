import React from 'react';
import styled from 'styled-components';
import siteConfig from '../config/siteConfig';

const BrandSectionContainer = styled.section`
  background: #000000;
  padding: 40px 0;
  margin: 40px 0;
`;

const BrandGrid = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  gap: 20px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 30px;
  }
`;

const BrandLogo = styled.img`
  height: 30px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1); // Makes logos white
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const BrandSection = () => {
  return (
    <BrandSectionContainer>
      <BrandGrid>
        {siteConfig.brands.map((brand) => (
          <BrandLogo
            key={brand.name}
            src={brand.logo}
            alt={`${brand.name} logo`}
          />
        ))}
      </BrandGrid>
    </BrandSectionContainer>
  );
};

export default BrandSection; 