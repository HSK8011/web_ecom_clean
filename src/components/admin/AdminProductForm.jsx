import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { addProduct, updateProduct } from '../../redux/slices/productSlice';
import styled from 'styled-components';

const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 12px;
  }
`;

const AdminProductForm = ({ show, handleClose, editProduct = null }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    hasDiscount: false,
    discountPercent: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name || '',
        price: editProduct.price || '',
        image: editProduct.image || '',
        hasDiscount: editProduct.hasDiscount || false,
        discountPercent: editProduct.discountPercent || '',
        category: editProduct.category || '',
        description: editProduct.description || ''
      });
    }
  }, [editProduct]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await dispatch(updateProduct({ id: editProduct.id, ...formData })).unwrap();
      } else {
        await dispatch(addProduct(formData)).unwrap();
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  return (
    <StyledModal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{editProduct ? 'Edit Product' : 'Add New Product'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Product Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Price</Form.Label>
            <Form.Control
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Image URL</Form.Label>
            <Form.Control
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Control
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="hasDiscount"
              label="Has Discount"
              checked={formData.hasDiscount}
              onChange={handleChange}
            />
          </Form.Group>

          {formData.hasDiscount && (
            <Form.Group className="mb-3">
              <Form.Label>Discount Percentage</Form.Label>
              <Form.Control
                type="number"
                name="discountPercent"
                value={formData.discountPercent}
                onChange={handleChange}
                min="0"
                max="100"
                required
              />
            </Form.Group>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editProduct ? 'Update' : 'Add'} Product
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </StyledModal>
  );
};

export default AdminProductForm; 