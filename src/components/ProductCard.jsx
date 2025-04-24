import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaEdit, FaTrash } from 'react-icons/fa';
import styled from 'styled-components';
import { deleteProduct } from '../redux/slices/productSlice';
import AdminProductForm from './admin/AdminProductForm';
import { useNavigate } from 'react-router-dom';
import { getProductDisplayName } from '../utils/productHelpers';

const StyledCard = styled(Card)`
  position: relative;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-5px);
  }
`;

const AdminControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;

  ${StyledCard}:hover & {
    opacity: 1;
  }

  button {
    background: white;
    border: none;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    &.edit:hover {
      color: #2196f3;
      background: #e3f2fd;
    }

    &.delete:hover {
      color: #f44336;
      background: #ffebee;
    }
  }
`;

const ProductImage = styled(Card.Img)`
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;

  ${StyledCard}:hover & {
    transform: scale(1.05);
  }
`;

const DiscountBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: #f44336;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: bold;
  z-index: 1;
`;

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const { user } = useSelector(state => state.auth);
  
  // Check if user is admin (both role and isAdmin checks for compatibility)
  const isAdmin = user?.role === 'admin' || user?.isAdmin || user?.email === 'admin@example.com';

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent card click
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteProduct(product._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click
    setShowEditForm(true);
  };

  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };

  const discountedPrice = product.hasDiscount 
    ? product.price * (1 - product.discountPercent / 100) 
    : product.price;

  // Get the consistent product name
  const productName = getProductDisplayName(product);

  return (
    <>
      <StyledCard onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        {isAdmin && (
          <AdminControls>
            <button className="edit" onClick={handleEdit} title="Edit product">
              <FaEdit size={16} />
            </button>
            <button className="delete" onClick={handleDelete} title="Delete product">
              <FaTrash size={16} />
            </button>
          </AdminControls>
        )}
        {product.hasDiscount && (
          <DiscountBadge>
            -{product.discountPercent}%
          </DiscountBadge>
        )}
        <ProductImage 
          variant="top" 
          src={product.image} 
          alt={productName}
        />
        <Card.Body>
          <Card.Title>{productName}</Card.Title>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {product.hasDiscount ? (
                <>
                  <span className="text-muted text-decoration-line-through me-2">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-danger fw-bold">
                    ${discountedPrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="fw-bold">${product.price.toFixed(2)}</span>
              )}
            </div>
            <Button variant="outline-primary" size="sm">
              View Details
            </Button>
          </div>
        </Card.Body>
      </StyledCard>

      {isAdmin && (
        <AdminProductForm
          show={showEditForm}
          handleClose={() => setShowEditForm(false)}
          editProduct={product}
        />
      )}
    </>
  );
};

export default ProductCard; 