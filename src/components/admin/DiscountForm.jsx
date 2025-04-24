import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { fetchProductById, updateProduct } from '../../redux/slices/productSlice';

const DiscountForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedProduct, status } = useSelector(state => state.products);

  const [formData, setFormData] = useState({
    hasDiscount: false,
    discountPercent: ''
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct && id) {
      setFormData({
        hasDiscount: selectedProduct.hasDiscount || false,
        discountPercent: selectedProduct.discountPercent || ''
      });
    }
  }, [selectedProduct, id]);

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
      await dispatch(updateProduct({ 
        id, 
        ...selectedProduct,
        ...formData
      })).unwrap();
      toast.success('Discount updated successfully');
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.message || 'Failed to update discount');
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!selectedProduct) {
    return <div>Product not found</div>;
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <h2 className="mb-4">Update Discount for {selectedProduct.name}</h2>
          <Form onSubmit={handleSubmit}>
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
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/products')}
                type="button"
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Update Discount
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default DiscountForm; 