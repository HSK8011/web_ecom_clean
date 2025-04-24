import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import siteConfig from '../config/siteConfig';

const FooterContainer = styled.footer`
  background-color: #fff;
  padding: 60px 0 30px;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr repeat(4, 1fr);
  gap: 40px;
  margin-bottom: 40px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FooterSection = styled.div`
  h3 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  p {
    color: #666;
    line-height: 1.6;
    margin-bottom: 20px;
  }
`;

const FooterLinks = styled.div`
  h5 {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 12px;
  }

  a {
    color: #666;
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: #000;
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 16px;

  a {
    color: #000;
    font-size: 20px;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.7;
    }
  }
`;

const FooterBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 30px;
  border-top: 1px solid #eee;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: #666;
  margin: 0;
`;

const PaymentMethods = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PaymentIcon = styled.img`
  height: 20px;
  width: auto;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterGrid>
          <FooterSection>
            <h3>SHOP.CO</h3>
            <p>We have clothes that suits your style and which you're proud to wear. From women to men.</p>
            <SocialLinks>
              <a href="#"><FontAwesomeIcon icon={faFacebookF} /></a>
              <a href="#"><FontAwesomeIcon icon={faTwitter} /></a>
              <a href="#"><FontAwesomeIcon icon={faInstagram} /></a>
            </SocialLinks>
          </FooterSection>

          <FooterLinks>
            <h5>COMPANY</h5>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Features</a></li>
              <li><a href="#">Works</a></li>
              <li><a href="#">Career</a></li>
            </ul>
          </FooterLinks>

          <FooterLinks>
            <h5>HELP</h5>
            <ul>
              <li><a href="#">Customer Support</a></li>
              <li><a href="#">Delivery Details</a></li>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </FooterLinks>

          <FooterLinks>
            <h5>FAQ</h5>
            <ul>
              <li><a href="#">Account</a></li>
              <li><a href="#">Manage Deliveries</a></li>
              <li><a href="#">Orders</a></li>
              <li><a href="#">Payments</a></li>
            </ul>
          </FooterLinks>

          <FooterLinks>
            <h5>RESOURCES</h5>
            <ul>
              <li><a href="#">Free eBooks</a></li>
              <li><a href="#">Development Tutorial</a></li>
              <li><a href="#">How to - Blog</a></li>
              <li><a href="#">Youtube Playlist</a></li>
            </ul>
          </FooterLinks>
        </FooterGrid>

        <FooterBottom>
          <Copyright>Shop.co © 2000-2023, All Rights Reserved</Copyright>
          <PaymentMethods>
            {siteConfig.paymentMethods.map((method, index) => (
              <PaymentIcon 
                key={index}
                src={method.icon} 
                alt={method.name} 
              />
            ))}
          </PaymentMethods>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer; 