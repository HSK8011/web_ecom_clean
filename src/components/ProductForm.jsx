import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { fetchProductById, updateProduct, addProduct } from '../redux/slices/productSlice';
import styled from 'styled-components';

// Styled components for drag & drop
const DropZone = styled.div`
  border: 2px dashed #cccccc;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  background: ${props => props.isDragActive ? '#e9ecef' : '#f8f9fa'};
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 15px;

  &:hover {
    border-color: #666;
    background: #e9ecef;
  }
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
`;

const ImagePreview = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
`;

const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  line-height: 1;

  &:hover {
    background: rgba(255, 0, 0, 0.9);
  }
`;

const ProductForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedProduct, status } = useSelector(state => state.products);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: '',
    images: [],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White'],
    stock: 100
  });

  const [isDragActive, setIsDragActive] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct && id) {
      setFormData({
        title: selectedProduct.title || '',
        price: selectedProduct.price || '',
        description: selectedProduct.description || '',
        category: selectedProduct.category || '',
        images: selectedProduct.images || [],
        sizes: selectedProduct.sizes || ['S', 'M', 'L', 'XL'],
        colors: selectedProduct.colors || ['Black', 'White'],
        stock: selectedProduct.stock || 100
      });
      // Set image previews for existing images
      if (selectedProduct.images) {
        setImagePreviewUrls(selectedProduct.images.map(img => ({ url: img, isExisting: true })));
      }
    }
  }, [selectedProduct, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFiles = (files) => {
    const newFiles = Array.from(files);
    
    // Filter for image files
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== newFiles.length) {
      toast.warning('Some files were skipped as they are not images');
    }

    // Update image files state
    setImageFiles(prev => [...prev, ...imageFiles]);

    // Create and set preview URLs
    const newPreviews = imageFiles.map(file => ({
      url: URL.createObjectURL(file),
      isExisting: false
    }));

    setImagePreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const { files } = e.dataTransfer;
    processFiles(files);
  };

  const handleFileInput = (e) => {
    const { files } = e.target;
    processFiles(files);
  };

  const handleRemoveImage = (index) => {
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // If it's an existing image, remove it from formData.images as well
    if (imagePreviewUrls[index].isExisting) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create FormData object for file upload
      const productFormData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'images') {
          productFormData.append(key, formData[key]);
        }
      });

      // Append new image files
      imageFiles.forEach(file => {
        productFormData.append('images', file);
      });

      // Append existing image URLs
      const existingImages = imagePreviewUrls
        .filter(img => img.isExisting)
        .map(img => img.url);
      productFormData.append('existingImages', JSON.stringify(existingImages));

      console.log('About to submit product data:', Object.fromEntries(productFormData.entries()));

      if (id) {
        try {
          const result = await dispatch(updateProduct({ id, productData: productFormData })).unwrap();
          console.log('Update successful:', result);
          toast.success('Product updated successfully');
          navigate('/admin/products');
        } catch (updateError) {
          console.error('Product update error:', updateError);
          const errorMessage = typeof updateError === 'string' 
            ? updateError 
            : updateError?.message || 'Failed to update product';
          toast.error(errorMessage);
        }
      } else {
        try {
          const result = await dispatch(addProduct(productFormData)).unwrap();
          console.log('Creation successful:', result);
          toast.success('Product created successfully');
          navigate('/admin/products');
        } catch (createError) {
          console.error('Product creation error:', createError);
          const errorMessage = typeof createError === 'string' 
            ? createError 
            : createError?.message || 'Failed to create product';
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Product form submission error:', error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || 'An unexpected error occurred';
      toast.error(errorMessage);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <h2 className="mb-4">{id ? 'Edit Product' : 'Add New Product'}</h2>
          <Form onSubmit={handleSubmit}>
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
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Images</Form.Label>
              <DropZone
                onDrop={handleDrop}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                isDragActive={isDragActive}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
                <p>Drag & drop images here or click to select files</p>
              </DropZone>

              <ImagePreviewContainer>
                {imagePreviewUrls.map((image, index) => (
                  <ImagePreview key={index}>
                    <PreviewImg src={image.url} alt={`Preview ${index + 1}`} />
                    <DeleteButton onClick={() => handleRemoveImage(index)}>×</DeleteButton>
                  </ImagePreview>
                ))}
              </ImagePreviewContainer>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/products')}
                type="button"
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {id ? 'Update' : 'Create'} Product
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductForm; 