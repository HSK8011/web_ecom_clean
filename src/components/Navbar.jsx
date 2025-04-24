import React, { useState, useEffect } from 'react';
import { Navbar as BootstrapNavbar, Container, Nav, Form, Badge, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faUser, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { fetchProducts } from '../redux/slices/productSlice';
import { toast } from 'react-toastify';
import styled from 'styled-components';

const StyledDropdown = styled(Dropdown)`
  .dropdown-toggle::after {
    display: none;
  }
  .dropdown-menu {
    border-radius: 8px;
    border: 1px solid #eee;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 0.5rem;
  }
  .dropdown-item {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    &:hover {
      background-color: #f8f9fa;
    }
  }
  .view-all-item {
    display: flex;
    justify-content: center;
    border-top: 1px solid #eee;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
  display: ${props => props.$show ? 'block' : 'none'};
`;

const SearchResultItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ResultImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
`;

const ResultInfo = styled.div`
  flex: 1;
`;

const ResultName = styled.div`
  font-weight: 500;
`;

const ResultMeta = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const NoResults = styled.div`
  padding: 1rem;
  text-align: center;
  color: #666;
`;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { items: products = [] } = useSelector((state) => state.products);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Fetch products if not already loaded
  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products.length]);

  // Get unique brands from products and filter out empty/null values
  const uniqueBrands = [...new Set(products
    .map(product => product.brand)
    .filter(Boolean)
    .filter(brand => brand.trim() !== '')
  )].sort();

  const handleBrandClick = (brand) => {
    navigate(`/products?brand=${brand}`);
  };

  // Debug logs
  useEffect(() => {
    console.log('Current user:', user);
    console.log('Is admin?:', user?.role === 'admin');
    console.log('User role:', user?.role);
    console.log('Local storage user:', JSON.parse(localStorage.getItem('userData')));
  }, [user]);

  // Calculate total items in cart
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleNewArrivalsClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: 'new-arrivals' } });
    } else {
      const newArrivalsSection = document.getElementById('new-arrivals');
      if (newArrivalsSection) {
        newArrivalsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    const results = products.filter(product => {
      const matchName = product.name?.toLowerCase().includes(normalizedQuery);
      const matchBrand = product.brand?.toLowerCase().includes(normalizedQuery);
      const matchColor = product.colors?.some(color => 
        color.toLowerCase().includes(normalizedQuery)
      );
      const matchCategory = product.category?.toLowerCase().includes(normalizedQuery);
      
      return matchName || matchBrand || matchColor || matchCategory;
    });

    setSearchResults(results);
    setShowResults(true);
  };

  const handleResultClick = (productId) => {
    navigate(`/product/${productId}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <BootstrapNavbar bg="white" expand="lg" className="py-3 border-bottom">
      <Container>
        <Link to="/" className="navbar-brand fw-bold fs-4" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em', textDecoration: 'none' }}>
          SHOP.CO
        </Link>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-4">
            <StyledDropdown>
              <Dropdown.Toggle as={Nav.Link} className="me-4">
                Shop
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/category/casual">Casual</Dropdown.Item>
                <Dropdown.Item as={Link} to="/category/formal">Formal</Dropdown.Item>
                <Dropdown.Item as={Link} to="/category/party">Party</Dropdown.Item>
                <Dropdown.Item as={Link} to="/category/gym">Gym</Dropdown.Item>
              </Dropdown.Menu>
            </StyledDropdown>
            <Nav.Link onClick={handleNewArrivalsClick} className="me-4" style={{ cursor: 'pointer' }}>
              New Arrivals
            </Nav.Link>
            <StyledDropdown>
              <Dropdown.Toggle as={Nav.Link} className="me-4">
                Brands
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {uniqueBrands.length > 0 ? (
                  uniqueBrands.map((brand) => (
                    <Dropdown.Item 
                      key={brand} 
                      onClick={() => handleBrandClick(brand)}
                    >
                      {brand}
                    </Dropdown.Item>
                  ))
                ) : (
                  <Dropdown.Item disabled>Loading brands...</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </StyledDropdown>
            {user?.role === 'admin' && (
              <Link to="/admin/products/new" className="nav-link">Add Product</Link>
            )}
          </Nav>
          <div className="d-flex align-items-center flex-grow-1">
            <div className="position-relative flex-grow-1 mx-4 search-container">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="position-absolute text-secondary"
                style={{ left: '15px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <Form.Control
                type="search"
                id="site-search"
                name="site-search"
                placeholder="Search by product, brand, color, or category..."
                className="ps-5 rounded-pill border-0 bg-light"
                style={{ backgroundColor: '#F0F0F0' }}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                aria-label="Search products"
                aria-expanded={showResults}
                aria-controls="search-results"
                role="searchbox"
                autoComplete="off"
              />
              <SearchResults 
                $show={showResults} 
                id="search-results"
                role="listbox"
                aria-label="Search results"
              >
                {searchResults.length > 0 ? (
                  searchResults.map(product => (
                    <SearchResultItem
                      key={product._id}
                      to={`/product/${product._id}`}
                      onClick={() => handleResultClick(product._id)}
                      role="option"
                    >
                      <ResultImage 
                        src={(product.images && product.images.length > 0) 
                          ? product.images[0] 
                          : (product.image || '/images/placeholder.png')} 
                        alt={product.name || product.title} 
                        onError={(e) => {e.target.src = '/images/placeholder.png'}}
                      />
                      <ResultInfo>
                        <ResultName>{product.title || product.name}</ResultName>
                        <ResultMeta>{product.brand || product.category}</ResultMeta>
                      </ResultInfo>
                    </SearchResultItem>
                  ))
                ) : (
                  <NoResults>No results found</NoResults>
                )}
              </SearchResults>
            </div>
            <div className="d-flex align-items-center">
              <Link to="/cart" className="text-dark me-4 position-relative">
                <FontAwesomeIcon icon={faShoppingCart} size="lg" />
                {cartItemCount > 0 && (
                  <Badge 
                    bg="danger" 
                    pill 
                    className="position-absolute"
                    style={{ 
                      top: '-8px', 
                      right: '-8px',
                      fontSize: '0.6rem'
                    }}
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
              
              <Dropdown align="end">
                <Dropdown.Toggle 
                  as="div" 
                  id="user-dropdown"
                  style={{ cursor: 'pointer' }}
                  className="text-dark"
                >
                  <FontAwesomeIcon icon={faUser} size="lg" />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {user ? (
                    <>
                      <Dropdown.Item as={Link} to="/profile">
                        My Profile
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout}>
                        Logout
                      </Dropdown.Item>
                    </>
                  ) : (
                    <>
                      <Dropdown.Item as={Link} to="/login">
                        Login
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/register">
                        Register
                      </Dropdown.Item>
                    </>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar; 