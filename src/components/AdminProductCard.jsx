import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import styled from 'styled-components';

const AdminControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 10;

  button {
    background: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    &.edit:hover {
      color: #2196f3;
    }

    &.delete:hover {
      color: #f44336;
    }
  }
`;

const ProductWrapper = styled.div`
  position: relative;
`;

const AdminProductCard = ({ product, onEdit, onDelete, children }) => {
  const handleEdit = (e) => {
    e.preventDefault(); // Prevent card click event
    onEdit(product);
  };

  const handleDelete = (e) => {
    e.preventDefault(); // Prevent card click event
    if (window.confirm('Are you sure you want to delete this product?')) {
      onDelete(product._id);
    }
  };

  return (
    <ProductWrapper>
      <AdminControls>
        <button className="edit" onClick={handleEdit} title="Edit product">
          <FaEdit size={16} />
        </button>
        <button className="delete" onClick={handleDelete} title="Delete product">
          <FaTrash size={16} />
        </button>
      </AdminControls>
      {children}
    </ProductWrapper>
  );
};

export default AdminProductCard; 