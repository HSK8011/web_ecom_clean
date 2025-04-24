import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../redux/slices/productSlice';
import { fetchCategories } from '../redux/slices/categoriesSlice';
import { fetchSiteConfig } from '../redux/slices/siteConfigSlice';
import siteConfig from '../config/siteConfig';
import { FaPen } from 'react-icons/fa';

const Container = styled.div`
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
`;

const HeroSection = styled.div`
  display: flex;
  background-color: #f8f8f8;
  color: #000;
  padding: 60px 80px;
  position: relative;
  overflow: hidden;
  min-height: 580px;
  align-items: center;
  justify-content: flex-start;

  @media (max-width: 1024px) {
    padding: 40px 40px;
    min-height: 500px;
  }

  @media (max-width: 768px) {
    min-height: auto;
    padding: 40px 20px;
  }
`;

const HeroContent = styled.div`
  width: 45%;
  position: relative;
  z-index: 2;
  margin-right: 50px;

  @media (max-width: 768px) {
    width: 100%;
    margin-right: 0;
    text-align: center;
  }
`;

const HeroTitle = styled.h1`
  font-size: 48px;
  font-weight: 900;
  margin-bottom: 20px;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: -0.5px;

  @media (max-width: 1024px) {
    font-size: 40px;
  }

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const HeroText = styled.p`
  font-size: 16px;
  margin-bottom: 32px;
  line-height: 1.6;
  color: #666;
  max-width: 440px;

  @media (max-width: 768px) {
    font-size: 15px;
    margin: 0 auto 24px;
  }
`;

const HeroImageContainer = styled.div`
  position: absolute;
  right: 80px;
  top: 0;
  height: 100%;
  z-index: 1;
  background-image: url('/images/products/hero.png');
  background-size: contain;
  background-position: right center;
  background-repeat: no-repeat;
  width: auto;
  aspect-ratio: 3/4;

  @media (max-width: 1200px) {
    right: 40px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const ShopButton = styled.button`
  background-color: #000;
  color: #fff;
  padding: 14px 32px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    background-color: #333;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 12px 28px;
    font-size: 14px;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 40px;
  gap: 40px;

  @media (max-width: 768px) {
    justify-content: center;
    gap: 24px;
    margin-top: 32px;
  }
`;

const StatItem = styled.div`
  text-align: left;

  @media (max-width: 768px) {
    text-align: center;
  }
`;

const StatNumber = styled.div`
  font-size: 36px;
  font-weight: 800;
  color: #000;
  line-height: 1;
  margin-bottom: 6px;

  @media (max-width: 1024px) {
    font-size: 32px;
  }
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const BrandsSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px;
  background-color: #000;
  gap: 20px;
`;

const BrandLogo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    max-width: 180px;
    width: 100%;
    height: auto;
    filter: brightness(0) invert(1);
    transition: opacity 0.3s ease;
    
    &:hover {
      opacity: 0.8;
    }
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin: 60px 0 30px;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
  padding: 0 40px;
  margin: 30px auto;
  max-width: 1200px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 0 30px;
  }
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 0 20px;
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 0 15px;
  }
`;

const ProductCard = styled(Link)`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  text-decoration: none;
  color: inherit;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const ProductImage = styled.div`
  width: 100%;
  padding-top: 100%;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 15px;
  background-color: #f0f0f0;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProductName = styled.h3`
  font-size: 1rem;
  margin-bottom: 8px;
  color: #333;
  flex-grow: 1;
  font-weight: 500;
  line-height: 1.4;
`;

const ProductPrice = styled.div`
  font-weight: bold;
  color: #000;
  font-size: 1.1rem;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const DiscountedPrice = styled.span`
  color: #ff4444;
  font-size: 1.1rem;
`;

const OriginalPrice = styled.span`
  text-decoration: line-through;
  color: #999;
  font-size: 0.9rem;
`;

const DiscountTag = styled.span`
  background: #ff4444;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const ViewAllContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 30px 0;
`;

const ViewAllButton = styled.button`
  background: white;
  border: 1px solid #e5e5e5;
  color: #000;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 24px;
  border-radius: 30px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f8f8;
    transform: translateY(-2px);
    border-color: #000;
  }
`;

const StyleCategories = styled.div`
  background-color: #f8f9fa;
  padding: 2.5rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  
  @media (max-width: 1200px) {
    margin: 2rem 30px;
  }
  
  @media (max-width: 900px) {
    margin: 2rem 20px;
  }
  
  @media (max-width: 600px) {
    margin: 2rem 15px;
  }

  ${SectionTitle} {
    margin: 0 0 30px;
  }
`;

const StyleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  padding: 0;
  
  & > a:nth-child(1) {
    grid-column: 1 / 5;
  }
  
  & > a:nth-child(2) {
    grid-column: 5 / 13;
  }
  
  & > a:nth-child(3) {
    grid-column: 1 / 9;
  }
  
  & > a:nth-child(4) {
    grid-column: 9 / 13;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    
    & > a {
      grid-column: 1 / -1 !important;
    }
  }
`;

const StyleCard = styled(Link)`
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  height: 200px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  }
`;

const StyleCardOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
`;

const StyleCardTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 500;
  margin: 0;
  text-align: center;
  color: #fff;
  z-index: 2;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TestimonialsSection = styled.div`
  margin: 0 40px 50px;
`;

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const TestimonialCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
`;

const Rating = styled.div`
  color: #FFD700;
  margin-bottom: 10px;
`;

const CustomerName = styled.h4`
  margin: 0 0 10px;
`;

const TestimonialText = styled.p`
  color: #666;
  font-size: 14px;
  line-height: 1.6;
`;

const NewsletterSection = styled.div`
  background-color: #000;
  color: white;
  padding: 25px 30px;
  border-radius: 6px;
  margin: 0 30px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 20px 25px;
  }
`;

const NewsletterTitle = styled.h3`
  margin: 0;
  text-transform: uppercase;
  font-size: 1.2rem;
`;

const NewsletterForm = styled.form`
  display: flex;
  
  @media (max-width: 768px) {
    margin-top: 20px;
    width: 100%;
  }
`;

const NewsletterInput = styled.input`
  padding: 8px 12px;
  border-radius: 20px 0 0 20px;
  border: none;
  min-width: 220px;
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    flex: 1;
  }
`;

const NewsletterButton = styled.button`
  background-color: #fff;
  color: #000;
  padding: 8px 12px;
  border: none;
  border-radius: 0 20px 20px 0;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
`;

const PaymentMethodsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PaymentIcon = styled.img`
  height: 25px;
  width: 40px;
  object-fit: contain;
  background: #fff;
  border-radius: 4px;
  padding: 2px;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 20px;
  font-size: 18px;
  color: #666;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #ff0000;
  font-size: 16px;
`;

// Update mockCategories with proper images and styling
const mockCategories = [
  {
    _id: '1',
    name: 'Casual',
    image: '/images/categories/casual.jpg',
    style: { gridColumn: '1 / 5' }
  },
  {
    _id: '2',
    name: 'Formal',
    image: '/images/categories/formal.jpg',
    style: { gridColumn: '5 / 13' }
  },
  {
    _id: '3',
    name: 'Party',
    image: '/images/categories/party.jpg',
    style: { gridColumn: '1 / 9' }
  },
  {
    _id: '4',
    name: 'Gym',
    image: '/images/categories/gym.jpg',
    style: { gridColumn: '9 / 13' }
  }
];

const SimplePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { items: products = [], status, error } = useSelector((state) => state.products);
  const { 
    items: categories = mockCategories,
    status: categoriesStatus, 
    error: categoriesError 
  } = useSelector((state) => state.categories);
  const { brands = [], loading: siteConfigLoading } = useSelector((state) => state.siteConfig);

  // Add state for expanded sections
  const [expandedSections, setExpandedSections] = React.useState({
    newArrivals: false,
    topSelling: false
  });

  useEffect(() => {
    // Fetch all products initially
    dispatch(fetchProducts({ limit: 50 }));
    dispatch(fetchCategories());
    dispatch(fetchSiteConfig());

    // Handle scroll to section if coming from navigation
    if (location.state?.scrollTo === 'new-arrivals') {
      const newArrivalsSection = document.getElementById('new-arrivals');
      if (newArrivalsSection) {
        setTimeout(() => {
          newArrivalsSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [dispatch, location.state]);

  // Get unique brands from products for display in BrandsSection
  const uniqueBrands = useMemo(() => {
    if (brands && brands.length > 0) {
      return brands;
    }
    
    // Fallback - get brands from products
    return [...new Set(products
      .map(product => product.brand)
      .filter(Boolean)
      .filter(brand => brand.trim() !== '')
    )].map(brandName => ({ 
      name: brandName, 
      logo: null 
    }));
  }, [products, brands]);

  // Filter new arrivals (products created within last 30 days OR marked as new)
  const newArrivals = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log('Filtering for new arrivals, cutoff date:', thirtyDaysAgo);
    
    // Better date handling for comparison
    const filtered = products?.filter(product => {
      // Check if product is explicitly marked as new
      if (product.isNew === true) {
        return true;
      }
      
      // Check creation date
      const productDate = new Date(product.createdAt);
      const isNew = productDate >= thirtyDaysAgo;
      
      // Debug log for a specific product
      if (product.title === 'Green shirt') {
        console.log('Green shirt found:', {
          title: product.title,
          createdAt: product.createdAt,
          productDate,
          thirtyDaysAgo,
          isNew,
          isNewField: product.isNew
        });
      }
      
      return isNew;
    }) || [];
    
    console.log(`Found ${filtered.length} new arrivals out of ${products?.length || 0} total products`);
    return filtered;
  }, [products]);
  
  // For now, all products are top selling
  const topSelling = useMemo(() => products || [], [products]);

  const handleViewAll = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.toLowerCase()}`);
  };

  const handleShopClick = () => {
    navigate('/shop');
  };

  const renderProductGrid = (products, title, section) => {
    if (status === 'loading') {
      return <LoadingSpinner>Loading products...</LoadingSpinner>;
    }

    if (status === 'failed') {
      return <ErrorMessage>{error || 'Failed to load products'}</ErrorMessage>;
    }

    const productsToShow = expandedSections[section] ? products : products.slice(0, 4);

    return (
      <section id={section === 'newArrivals' ? 'new-arrivals' : section}>
        <SectionTitle>{title}</SectionTitle>
        <ProductGrid>
          {productsToShow.map(product => (
            <ProductCard key={product._id} to={`/product/${product._id}`}>
              <ProductImage>
                {product.image || (product.images && product.images.length > 0) ? (
                  <img 
                    src={product.image || (product.images && product.images.length > 0 ? product.images[0] : null)} 
                    alt={product.title || product.name} 
                    loading="lazy"
                  />
                ) : (
                  <div>No Image Available</div>
                )}
              </ProductImage>
              <ProductName>{product.title || product.name}</ProductName>
              <ProductPrice>
                {product.discount?.isActive ? (
                  <>
                    <DiscountedPrice>
                      ${(product.price * (1 - product.discount.percentage / 100)).toFixed(2)}
                    </DiscountedPrice>
                    <OriginalPrice>${product.price}</OriginalPrice>
                    <DiscountTag>-{product.discount.percentage}%</DiscountTag>
                  </>
                ) : (
                  <span>${product.price}</span>
                )}
              </ProductPrice>
            </ProductCard>
          ))}
        </ProductGrid>
        {products.length > 4 && (
          <ViewAllContainer>
            <ViewAllButton onClick={() => handleViewAll(section)}>
              {expandedSections[section] ? 'Show Less' : 'View All'}
            </ViewAllButton>
          </ViewAllContainer>
        )}
      </section>
    );
  };

  const renderCategories = () => {
    if (categoriesStatus === 'loading') {
      return <LoadingSpinner>Loading categories...</LoadingSpinner>;
    }

    if (categoriesStatus === 'failed') {
      console.error('Failed to load categories:', categoriesError);
      return (
        <StyleGrid>
          {mockCategories.map(category => (
            <StyleCard 
              key={category._id} 
              to={`/category/${category.name.toLowerCase()}`}
              style={{ 
                ...category.style,
                backgroundImage: `url(${category.image})`
              }}
            >
              <StyleCardOverlay />
              <StyleCardTitle>{category.name}</StyleCardTitle>
            </StyleCard>
          ))}
        </StyleGrid>
      );
    }

    return (
      <StyleGrid>
        {(categories.length > 0 ? categories : mockCategories).map(category => (
          <StyleCard 
            key={category._id} 
            to={`/category/${category.name.toLowerCase()}`}
            style={{ 
              ...category.style,
              backgroundImage: `url(${category.image})`
            }}
          >
            <StyleCardOverlay />
            <StyleCardTitle>{category.name}</StyleCardTitle>
          </StyleCard>
        ))}
      </StyleGrid>
    );
  };

  const renderHero = () => (
      <HeroSection>
        <HeroContent>
        <HeroTitle>Find Clothes That Matches Your Style</HeroTitle>
        <HeroText>
          Browse through our diverse range of meticulously crafted garments, designed
          to bring out your individuality and cater to your sense of style.
        </HeroText>
        <ShopButton onClick={() => navigate('/shop')}>Shop Now</ShopButton>
          <StatsContainer>
            <StatItem>
            <StatNumber>200+</StatNumber>
            <StatLabel>International Brands</StatLabel>
            </StatItem>
            <StatItem>
            <StatNumber>2,000+</StatNumber>
            <StatLabel>High-Quality Products</StatLabel>
            </StatItem>
            <StatItem>
            <StatNumber>30,000+</StatNumber>
            <StatLabel>Happy Customers</StatLabel>
            </StatItem>
          </StatsContainer>
        </HeroContent>
        <HeroImageContainer />
      </HeroSection>
  );

  return (
    <Container>
      {renderHero()}
      
      <BrandsSection>
        {uniqueBrands.map((brand, index) => (
          <BrandLogo 
            key={index}
            onClick={() => navigate(`/products?brand=${brand.name}`)}
          >
            {brand.logo ? (
              <img 
                src={brand.logo} 
                alt={brand.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/placeholder.png';
                }}
              />
            ) : (
              brand.name
            )}
          </BrandLogo>
        ))}
      </BrandsSection>
      
      {renderProductGrid(newArrivals, 'NEW ARRIVALS', 'newArrivals')}
      {renderProductGrid(topSelling, 'TOP SELLING', 'topSelling')}
      
      <StyleCategories>
        <SectionTitle>Browse By Dress Style</SectionTitle>
        {renderCategories()}
      </StyleCategories>
      
      <SectionTitle>Our Happy Customers</SectionTitle>
      <TestimonialsSection>
        <TestimonialsGrid>
          {/* Testimonials will be fetched from the backend */}
        </TestimonialsGrid>
      </TestimonialsSection>
      
      <NewsletterSection>
        <NewsletterTitle>Stay up to date about our latest offers</NewsletterTitle>
        <NewsletterForm onSubmit={(e) => e.preventDefault()}>
          <NewsletterInput 
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address" 
          />
          <NewsletterButton 
            type="submit"
            id="newsletter-submit"
            name="newsletter-submit"
          >
            Subscribe to Newsletter
          </NewsletterButton>
        </NewsletterForm>
      </NewsletterSection>
    </Container>
  );
};

export default SimplePage; 