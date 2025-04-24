import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { createProduct } from '../../redux/slices/productsSlice';

const StyledContainer = styled(Container)`
  padding-top: 2rem;
  padding-bottom: 2rem;
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const AddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: '',
    category: '',
    price: '',
    countInStock: '',
    sizes: [],
    colors: [],
    images: [''],
    discount: {
      isActive: false,
      percentage: 0,
      startDate: '',
      endDate: ''
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('discount.')) {
      const discountField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          [discountField]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name === 'sizes' || name === 'colors') {
      const arrayValue = value.split(',').map(item => item.trim());
      setFormData(prev => ({
        ...prev,
        [name]: arrayValue
      }));
    } else if (name === 'images') {
      const imageUrls = value.split(',').map(url => url.trim());
      setFormData(prev => ({
        ...prev,
        images: imageUrls
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createProduct(formData)).unwrap();
      toast.success('Product added successfully!');
      navigate('/admin/products');
    } catch (error) {
      toast.error(error || 'Failed to add product');
    }
  };

  return (
    <StyledContainer>
      <StyledCard>
        <Card.Body>
          <h2 className="mb-4">Add New Product</h2>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Brand</Form.Label>
                  <Form.Control
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
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
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Count</Form.Label>
                  <Form.Control
                    type="number"
                    name="countInStock"
                    value={formData.countInStock}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sizes (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="sizes"
                    value={formData.sizes.join(', ')}
                    onChange={handleChange}
                    placeholder="S, M, L, XL"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Colors (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="colors"
                    value={formData.colors.join(', ')}
                    onChange={handleChange}
                    placeholder="Red, Blue, Black"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Image URLs (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                name="images"
                value={formData.images.join(', ')}
                onChange={handleChange}
                required
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
            </Form.Group>

            <Card className="mb-3">
              <Card.Body>
                <h5>Discount Information</h5>
                <Form.Check
                  type="checkbox"
                  label="Apply Discount"
                  name="discount.isActive"
                  checked={formData.discount.isActive}
                  onChange={handleChange}
                  className="mb-3"
                />

                {formData.discount.isActive && (
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Discount Percentage</Form.Label>
                        <Form.Control
                          type="number"
                          name="discount.percentage"
                          value={formData.discount.percentage}
                          onChange={handleChange}
                          min="0"
                          max="100"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="discount.startDate"
                          value={formData.discount.startDate}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>End Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="discount.endDate"
                          value={formData.discount.endDate}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => navigate('/admin/products')}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Product
              </Button>
            </div>
          </Form>
        </Card.Body>
      </StyledCard>
    </StyledContainer>
  );
};

export default AddProduct; 