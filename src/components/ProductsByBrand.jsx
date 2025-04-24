import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../redux/slices/productSlice';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { getProductDisplayName } from '../utils/productHelpers';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  text-align: center;
  margin: 2rem 0;
  font-size: 2rem;
  text-transform: capitalize;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  padding: 2rem 0;
`;

const ProductCard = styled(Link)`
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
  text-decoration: none;
  color: inherit;
  display: block;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
  background-color: #f8f9fa;
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

const NoProducts = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const ProductsByBrand = () => {
  const [searchParams] = useSearchParams();
  const brand = searchParams.get('brand');
  const dispatch = useDispatch();
  const { items: products = [], status, error } = useSelector((state) => state.products);

  useEffect(() => {
    // Fetch all products if not already loaded
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products.length]);

  // Filter products by brand client-side for now (case-insensitive)
  const filteredProducts = products.filter(product => 
    product.brand && product.brand.toLowerCase() === brand?.toLowerCase()
  );

  if (status === 'loading') {
    return <LoadingSpinner>Loading products...</LoadingSpinner>;
  }

  if (status === 'failed') {
    return <div>Error: {error}</div>;
  }

  return (
    <Container>
      <Title>{brand} Products</Title>
      {filteredProducts.length > 0 ? (
        <ProductGrid>
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} to={`/product/${product._id}`}>
              <ProductImage 
                src={(product.images && product.images.length > 0) 
                  ? product.images[0] 
                  : (product.image || '/images/placeholder.png')} 
                alt={getProductDisplayName(product)} 
                onError={(e) => {e.target.src = '/images/placeholder.png'}}
              />
              <ProductInfo>
                <ProductName>{getProductDisplayName(product)}</ProductName>
                <ProductPrice>${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</ProductPrice>
              </ProductInfo>
            </ProductCard>
          ))}
        </ProductGrid>
      ) : (
        <NoProducts>No products available for this brand.</NoProducts>
      )}
    </Container>
  );
};

export default ProductsByBrand; 