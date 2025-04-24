import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { fetchProducts } from '../redux/slices/productSlice';
// import { addToCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import AdminProductForm from './admin/AdminProductForm';
import { Container } from 'react-bootstrap';
import axios from 'axios';

const PageWrapper = styled.div`
  padding: 1rem;
  background: #fff;

  @media (min-width: 768px) {
    padding: 2rem 5%;
  }
`;

const Breadcrumb = styled.div`
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 0.9rem;
  
  a {
    color: inherit;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  @media (min-width: 768px) {
    margin-bottom: 2rem;
    font-size: 1rem;
  }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 60px;
`;

const MobileHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    display: none;
  }
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 1rem;

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    font-size: 0.95rem;
    
    &::placeholder {
      color: #999;
    }
  }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  text-align: center;
  margin: 1.5rem 0;

  .stat {
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
    }
    
    p {
      font-size: 0.85rem;
      color: #666;
      margin: 0;
    }
  }

  @media (min-width: 768px) {
    display: none;
  }
`;

const BrandLogos = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  
  img {
    height: 20px;
    margin: 0 0.75rem;
    opacity: 0.7;
  }

  @media (min-width: 768px) {
    display: none;
  }
`;

const FilterTab = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px 8px 0 0;
  margin-bottom: -1px;
  
  h2 {
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    color: #333;
  }

  .filter-icon {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    opacity: 0.7;
  }
`;

const FiltersContainer = styled.div`
  border: 1px solid #dee2e6;
  border-radius: 0 8px 8px 8px;
  padding: 1.5rem;
  background: white;
`;

const FilterGroup = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
    margin-bottom: 1rem;
    padding-bottom: 0;
  }
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  cursor: pointer;
  padding: 0.25rem 0;

  h3 {
    font-size: 0.95rem;
    font-weight: 500;
    margin: 0;
    color: #333;
  }

  span {
    color: #999;
    font-size: 1.2rem;
    line-height: 1;
  }
`;

const PriceRange = styled.div`
  input[type="range"] {
    width: 100%;
    margin: 10px 0;
  }

  .price-values {
    display: flex;
    justify-content: space-between;
    color: #4B5563;
    font-size: 14px;
    margin-top: 12px;
  }
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-top: 16px;
`;

const ColorSwatch = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: ${props => props.color};
  cursor: pointer;
  border: ${props => props.color === '#ffffff' ? '1px solid #E5E7EB' : 'none'};
  box-shadow: ${props => props.selected ? '0 0 0 2px #111827' : 'none'};
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const SizeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 16px;
`;

const SizeButton = styled.button`
  padding: 8px;
  background: ${props => props.selected ? '#111827' : '#fff'};
  color: ${props => props.selected ? '#fff' : '#4B5563'};
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #111827;
    color: ${props => props.selected ? '#fff' : '#111827'};
  }
`;

const ProductsHeader = styled.div`
  display: none;

  @media (min-width: 768px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h1 {
      font-size: 2rem;
      font-weight: 600;
      margin: 0;
    }

    .products-count {
      color: #666;
      font-size: 0.9rem;
    }

    select {
      padding: 0.5rem;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      background: #fff;
    }
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
`;

const AnimatedProductCard = styled(motion.div)`
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  
  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const ProductInfo = styled.div`
  padding: 1rem;

  h3 {
    font-size: 1rem;
    margin: 0 0 0.5rem 0;
  }

  .rating {
    color: #ffc107;
    margin-bottom: 0.5rem;
  }

  .price {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .original {
      color: #666;
      text-decoration: line-through;
    }

    .discount {
      color: #dc3545;
      font-size: 0.9rem;
      padding: 0.2rem 0.4rem;
      background: #dc35451a;
      border-radius: 4px;
    }
  }
`;

const StyledPagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 40px;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  border: 1px solid ${props => props.$active ? '#000' : '#e5e5e5'};
  background: ${props => props.$active ? '#000' : '#fff'};
  color: ${props => props.$active ? '#fff' : '#000'};
  cursor: pointer;
  
  &:hover {
    border-color: #000;
  }
`;

const FilterGroupContent = styled(motion.div)`
  overflow: hidden;
`;

const SearchInput = styled(motion.input)`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #000;
    box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
    outline: none;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const AnimatedButton = styled(motion.button)`
  width: 100%;
  padding: 0.75rem;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.95rem;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const spring = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

const StyledRating = styled(motion.div)`
  color: #ffc107;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  span {
    transition: transform 0.2s ease;
    display: inline-block;
    
    &:hover {
      transform: scale(1.2);
    }
  }
`;

const PriceTag = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .discount {
    background: #dc35451a;
    color: #dc3545;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.9rem;
    transform-origin: center;
  }
`;

const AddProductButton = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 1000;

  &:hover {
    transform: scale(1.1);
  }
`;

const PageContainer = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 60px;
`;

const BreadcrumbNav = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;

  a {
    color: #666;
    text-decoration: none;
    &:hover {
      color: #000;
    }
  }
`;

const Sidebar = styled.div`
  padding-right: 30px;
  border-right: 1px solid #E5E7EB;
`;

const FilterSection = styled.div`
  margin-bottom: 40px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #111827;
  }
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CategoryItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #4B5563;
  font-size: 15px;
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.2s ease;
  
  &:hover {
    color: #111827;
  }

  span:last-child {
    color: #9CA3AF;
    font-size: 14px;
  }
`;

const ApplyFilterButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #000;
  color: #fff;
  border: none;
  margin-top: 20px;
  cursor: pointer;
  
  &:hover {
    background: #333;
  }
`;

const MainContent = styled.div`
  flex: 1;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
`;

const CategoryTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #111827;
`;

const SortSelect = styled.select`
  padding: 10px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 15px;
  color: #4B5563;
  cursor: pointer;
  background: #fff;
  
  &:focus {
    outline: none;
    border-color: #111827;
  }
`;

const ProductCard = styled.div`
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const ProductImage = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  
  img {
    width: 100%;
    height: 360px;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const DiscountBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: #EF4444;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
`;

const ProductName = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 8px;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  color: #FBBF24;
  font-size: 14px;

  span {
    color: #4B5563;
    margin-left: 4px;
  }
`;

const PriceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CurrentPrice = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #111827;
`;

const OriginalPrice = styled.span`
  font-size: 15px;
  color: #9CA3AF;
  text-decoration: line-through;
`;

const CategoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category } = useParams();
  
  const { products, loading, error, totalPages, currentPage } = useSelector(
    (state) => state.products
  );

  const [filters, setFilters] = useState({
    colors: [],
    sizes: [],
    minPrice: '',
    maxPrice: '',
    search: '',
    sort: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'admin' || user?.isAdmin || user?.email === 'admin@example.com';

  const categories = [
    { name: 'T-shirts', count: 12 },
    { name: 'Shorts', count: 8 },
    { name: 'Shirts', count: 15 },
    { name: 'Hoodies', count: 6 },
    { name: 'Jeans', count: 10 }
  ];

  const colors = [
    { name: 'Green', code: '#4CAF50' },
    { name: 'Red', code: '#f44336' },
    { name: 'Yellow', code: '#ffeb3b' },
    { name: 'Orange', code: '#ff9800' },
    { name: 'Blue', code: '#2196f3' },
    { name: 'Purple', code: '#9c27b0' },
    { name: 'Pink', code: '#e91e63' },
    { name: 'White', code: '#ffffff' },
    { name: 'Black', code: '#000000' }
  ];

  const sizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const queryParams = new URLSearchParams({
          category,
          ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
          ...(filters.colors.length && { colors: filters.colors.join(',') }),
          ...(filters.sizes.length && { sizes: filters.sizes.join(',') }),
          ...(filters.sort && { sort: filters.sort })
        });

        const response = await axios.get(`/api/products?${queryParams}`);
        dispatch(fetchProducts(response.data));
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    // Debounce the API call to prevent too many requests
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [dispatch, category, filters]);

  const handleFilterChange = (type, value) => {
    setFilters(prev => {
      let newFilters;
      
      if (type === 'colors' || type === 'sizes') {
        const newValues = prev[type].includes(value)
          ? prev[type].filter(item => item !== value)
          : [...prev[type], value];
        newFilters = { ...prev, [type]: newValues };
      } else {
        newFilters = { ...prev, [type]: value };
      }

      // Update URL with new filters
      const searchParams = new URLSearchParams(window.location.search);
      Object.entries(newFilters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          searchParams.set(key, value.join(','));
        } else if (value && !Array.isArray(value)) {
          searchParams.set(key, value);
        } else {
          searchParams.delete(key);
        }
      });
      
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.pushState({}, '', newUrl);

      return newFilters;
    });
  };

  const handleAddToCart = (product) => {
    // Temporarily disabled while cart is being rebuilt
    toast.info('Cart functionality is being rebuilt');
    // dispatch(addToCart({ ...product, quantity: 1 }));
    // toast.success(`${product.name} added to cart!`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      dispatch(fetchProducts({ ...filters, page: newPage, category }));
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <PageContainer>
      <BreadcrumbNav>
        <a href="/">Home</a> &gt;
        <span>{category}</span>
      </BreadcrumbNav>

      <Layout>
        <Sidebar>
          <FilterSection>
            <h3>Categories</h3>
            <CategoryList>
              {categories.map(cat => (
                <CategoryItem key={cat.name}>
                  <span>{cat.name}</span>
                  <span>{cat.count}</span>
                </CategoryItem>
              ))}
            </CategoryList>
          </FilterSection>

          <FilterSection>
            <h3>Price Range</h3>
            <PriceRange>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.maxPrice || 200}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
              <div className="price-values">
                <span>$0</span>
                <span>${filters.maxPrice || 200}</span>
              </div>
            </PriceRange>
          </FilterSection>

          <FilterSection>
            <h3>Colors</h3>
            <ColorGrid>
              {colors.map(color => (
                <ColorSwatch
                  key={color.name}
                  color={color.code}
                  selected={filters.colors.includes(color.name)}
                  onClick={() => handleFilterChange('colors', color.name)}
                />
              ))}
            </ColorGrid>
          </FilterSection>

          <FilterSection>
            <h3>Size</h3>
            <SizeGrid>
              {sizes.map(size => (
                <SizeButton
                  key={size}
                  selected={filters.sizes.includes(size)}
                  onClick={() => handleFilterChange('sizes', size)}
                >
                  {size}
                </SizeButton>
              ))}
            </SizeGrid>
          </FilterSection>
        </Sidebar>

        <MainContent>
          <Header>
            <CategoryTitle>{category}</CategoryTitle>
            <SortSelect value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)}>
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </SortSelect>
          </Header>

          <ProductGrid>
            {products.map(product => (
              <ProductCard key={product._id} onClick={() => handleProductClick(product._id)}>
                <ProductImage>
                  <img src={product.images[0]} alt={product.title} />
                  {product.discount > 0 && (
                    <DiscountBadge>-{product.discount}%</DiscountBadge>
                  )}
                </ProductImage>
                <ProductInfo>
                  <ProductName>{product.title}</ProductName>
                  <Rating>
                    {'★'.repeat(Math.floor(product.rating))}
                    {'☆'.repeat(5 - Math.floor(product.rating))}
                    <span>{product.rating}</span>
                  </Rating>
                  <PriceInfo>
                    <CurrentPrice>${product.price}</CurrentPrice>
                    {product.originalPrice && (
                      <OriginalPrice>${product.originalPrice}</OriginalPrice>
                    )}
                  </PriceInfo>
                </ProductInfo>
              </ProductCard>
            ))}
          </ProductGrid>

          <StyledPagination>
            <PageButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</PageButton>
            {[1, 2, 3, 4, 5].map(page => (
              <PageButton
                key={page}
                $active={currentPage === page}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </PageButton>
            ))}
            <PageButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</PageButton>
          </StyledPagination>
        </MainContent>
      </Layout>

      {isAdmin && (
        <>
          <AddProductButton onClick={() => setShowAddForm(true)} title="Add New Product">
            +
          </AddProductButton>
          <AdminProductForm
            show={showAddForm}
            handleClose={() => setShowAddForm(false)}
          />
        </>
      )}
    </PageContainer>
  );
};

export default CategoryPage; 