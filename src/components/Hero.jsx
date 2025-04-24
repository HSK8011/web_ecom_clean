import React from 'react';
import styled from 'styled-components';
import siteConfig from '../config/siteConfig';

const HeroSection = styled.section`
  padding: 80px 5%;
  background-color: #fff;
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: 64px;
  font-weight: 900;
  text-transform: uppercase;
  margin-bottom: 20px;
  line-height: 1.1;
  letter-spacing: -2px;
  color: #000;
`;

const HeroDescription = styled.p`
  font-size: 20px;
  margin-bottom: 30px;
  line-height: 1.6;
  color: #666;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const ShopNowButton = styled.button`
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  text-transform: uppercase;
  background-color: #000;
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #333;
    transform: translateY(-2px);
  }
`;

const Hero = () => {
  return (
    <HeroSection>
      <HeroContent>
        <HeroTitle>
          {siteConfig.hero.title}
        </HeroTitle>
        <HeroDescription>
          {siteConfig.hero.description}
        </HeroDescription>
        <ShopNowButton>Shop Now</ShopNowButton>
      </HeroContent>
    </HeroSection>
  );
};

export default Hero; 