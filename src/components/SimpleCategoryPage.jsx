import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../redux/slices/productSlice';
import { addToGuestCart, addItemToUserCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { Container, Row, Col } from 'react-bootstrap';
import LoadingSpinner from './LoadingSpinner';

const CategoryTitle = styled.h1`
  text-align: center;
  margin: 2rem 0;
  font-size: 2.5rem;
  text-transform: capitalize;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  padding: 2rem 0;
`;

const ProductCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
`;

const ProductInfo = styled.div`
  padding: 1rem;
`;

const ProductName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const ProductPrice = styled.p`
  margin: 0.5rem 0;
  font-weight: bold;
  color: #333;
`;

const AddToCartButton = styled.button`
  width: 100%;
  padding: 0.5rem;
  background-color: #000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #333;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 0;
  
  h2 {
    margin-bottom: 1rem;
  }
  
  p {
    color: #666;
    margin-bottom: 2rem;
  }
`;

const SimpleCategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: products = [], status, error } = useSelector((state) => state.products);
  const { userInfo } = useSelector((state) => state.auth);
  const { isUserCart } = useSelector((state) => state.cart);

  useEffect(() => {
    if (category) {
      // Convert category to proper format (capitalize first letter)
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      console.log(`Fetching products for category: ${formattedCategory}`);
      dispatch(fetchProducts({ category: formattedCategory, limit: 50 }));
    } else {
      // If no category is specified (on /shop route), fetch all products
      console.log('Fetching all products');
      dispatch(fetchProducts({ limit: 50 }));
    }
  }, [dispatch, category]);

  const handleAddToCart = (product) => {
    const item = { ...product, quantity: 1 };
    
    if (isUserCart) {
      dispatch(addItemToUserCart(item));
    } else {
      dispatch(addToGuestCart(item));
    }
    
    toast.success('Added to cart!');
  };

  const navigateToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (status === 'loading') {
    return <LoadingSpinner>Loading products...</LoadingSpinner>;
  }

  if (status === 'failed') {
    return <div>Error: {error}</div>;
  }

  return (
    <Container>
      <CategoryTitle>{category || 'All Products'}</CategoryTitle>
      
      {products.length === 0 ? (
        <EmptyState>
          <h2>No products found</h2>
          <p>We couldn't find any products in the {category} category.</p>
        </EmptyState>
      ) : (
        <ProductGrid>
          {products.map((product) => (
            <ProductCard 
              key={product._id}
              onClick={() => navigateToProduct(product._id)}
            >
              <ProductImage 
                src={product.image || (product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg')} 
                alt={product.title || product.name} 
              />
              <ProductInfo>
                <ProductName>{product.title || product.name}</ProductName>
                <ProductPrice>${product.price}</ProductPrice>
                <AddToCartButton 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation when clicking the button
                    handleAddToCart(product);
                  }}
                >
                  Add to Cart
                </AddToCartButton>
              </ProductInfo>
            </ProductCard>
          ))}
        </ProductGrid>
      )}
    </Container>
  );
};

export default SimpleCategoryPage; 