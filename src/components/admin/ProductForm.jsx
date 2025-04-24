import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Spinner, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { createProduct, updateProduct, resetAdminSuccess } from '../../redux/slices/adminSlice';
import axios from 'axios';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';

const StyledContainer = styled(Container)`
  padding-top: 2rem;
  padding-bottom: 2rem;
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
`;

const CardHeader = styled(Card.Header)`
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  padding: 1.25rem 1.5rem;
  
  h2 {
    margin-bottom: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const CardBody = styled(Card.Body)`
  padding: 1.5rem;
`;

const StyledFormGroup = styled(Form.Group)`
  margin-bottom: 1.5rem;
  
  label {
    font-weight: 500;
    color: #344767;
    margin-bottom: 0.5rem;
  }
  
  .form-control, .form-select {
    border: 1px solid #d2d6da;
    padding: 0.6rem 1rem;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
    
    &:focus {
      border-color: #4a6cf7;
      box-shadow: 0 0 0 0.2rem rgba(74, 108, 247, 0.25);
    }
  }
  
  .text-muted {
    font-size: 0.8rem;
  }
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
`;

const ImagePreview = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  margin-right: 10px;
  margin-bottom: 10px;
  
  img {
  width: 100%;
  height: 100%;
  object-fit: cover;
    border-radius: 4px;
  }

  .remove-image-btn {
  position: absolute;
    top: -8px;
    right: -8px;
    background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 50%;
    width: 24px;
    height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);

  &:hover {
      background-color: #ff7875;
    }
    
    &:focus {
      outline: 2px solid #1890ff;
      outline-offset: 2px;
    }
  }
`;

const SubmitButton = styled(Button)`
  background-color: #4a6cf7;
  border-color: #4a6cf7;
  font-weight: 500;
  padding: 0.6rem 1.5rem;
  transition: all 0.2s;
  
  &:hover, &:focus {
    background-color: #3a5de0;
    border-color: #3a5de0;
    box-shadow: 0 4px 10px rgba(74, 108, 247, 0.25);
  }
  
  &:disabled {
    background-color: #ccd4f7;
    border-color: #ccd4f7;
  }
`;

const ColorChip = styled(Badge)`
  display: inline-block;
  margin-right: 5px;
  margin-bottom: 5px;
  padding: 8px 10px;
  border-radius: 20px;
  background-color: ${props => props.$color && isValidHexColor(props.$color) ? props.$color : '#000000'};
  color: ${props => isLightColor(props.$color) ? '#212529' : '#fff'};
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

// Function to check if a string is a valid hex color
function isValidHexColor(color) {
  return color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Function to determine if a color is light or dark
function isLightColor(color) {
  // Default to dark if color is not valid
  if (!isValidHexColor(color)) return false;
  
  // For named colors, have a predefined list
  const lightColors = ['yellow', 'lime', 'aqua', 'cyan', 'lavender', 'white', 'ivory', 'beige'];
  if (lightColors.includes(color.toLowerCase())) return true;
  
  // For hex colors
  const hex = color.substring(1);
  const rgb = parseInt(hex, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

const DiscountSection = styled.div`
  background-color: ${props => props.$active ? 'rgba(25, 135, 84, 0.05)' : 'transparent'};
  border-radius: 8px;
  padding: ${props => props.$active ? '1rem' : '0'};
  margin-bottom: 1.25rem;
  border: ${props => props.$active ? '1px solid rgba(25, 135, 84, 0.2)' : 'none'};
  transition: all 0.3s ease;
`;

const FormContainer = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const FormHeader = styled.div`
  margin-bottom: 2rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 1rem;
  
  h2 {
    font-weight: 600;
    color: #344767;
  }
  
  p {
    color: #67748e;
    margin-bottom: 0.5rem;
  }
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
  
  h4 {
    font-weight: 600;
    color: #344767;
    margin-bottom: 1.25rem;
    font-size: 1.1rem;
  }
`;

const ColorPreview = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 0.5rem;
  display: inline-block;
  border: 1px solid #dee2e6;
`;

const CancelButton = styled(Button)`
  font-weight: 500;
  padding: 0.6rem 1.5rem;
  transition: all 0.2s;
  margin-right: 1rem;
`;

const DropzoneContainer = styled.div`
  border: 2px dashed #d2d6da;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
  
  &:hover, &.active {
    border-color: #4a6cf7;
  }
  
  p {
    margin-bottom: 0.5rem;
    color: #67748e;
  }
  
  svg {
    color: #4a6cf7;
    margin-bottom: 0.5rem;
  }
`;

const SizeCheckboxContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
`;

const SizeCheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${props => props.checked ? '#007bff' : '#ffffff'};
  color: ${props => props.checked ? '#ffffff' : '#212529'};

  &:hover {
    background-color: ${props => props.checked ? '#0069d9' : '#f8f9fa'};
  }
  
  input {
    margin-right: 6px;
  }
`;

const StockInputsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const StockInputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const StockInputLabel = styled.label`
  font-weight: 500;
  margin-bottom: 5px;
`;

// Category options
const CATEGORIES = ['Casual', 'Formal', 'Party', 'Gym'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ProductForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const { loading, error, createSuccess, updateSuccess } = useSelector((state) => state.admin);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    sizes: [],
    sizeInventory: {},
    colors: [],
    discount: {
      isActive: false,
      percentage: 0,
      startDate: '',
      endDate: ''
    },
    isNew: false
  });

  const [isDragActive, setIsDragActive] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showColorInput, setShowColorInput] = useState(false);
  const [newColor, setNewColor] = useState('#000000');

  // Fetch product data if in edit mode
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (id) {
        try {
          const response = await axios.get(`/api/products/${id}`);
          const productData = response.data;
          
          // Create sizeInventory object from sizes and existing inventory if available
          const sizeInventory = {};
          const sizes = productData.sizes || [];
          
          // Initialize inventory for each size
          sizes.forEach(size => {
            // If product has sizeInventory data, use it, otherwise use total stock / number of sizes as default
            if (productData.sizeInventory && productData.sizeInventory[size] !== undefined) {
              sizeInventory[size] = Number(productData.sizeInventory[size]);
            } else {
              // If we don't have specific size inventory data, distribute evenly
              const defaultStock = sizes.length > 0 && productData.countInStock ? 
                Math.floor(productData.countInStock / sizes.length) : 0;
              sizeInventory[size] = defaultStock;
            }
          });
          
          // Log the size inventory for debugging
          console.log('Loaded size inventory:', sizeInventory);
          
          setFormData({
            name: productData.title || productData.name || '',
            description: productData.description || '',
            price: productData.price || '',
            category: productData.category || '',
            brand: productData.brand || '',
            sizes: sizes,
            sizeInventory: sizeInventory,
            colors: productData.colors?.filter(color => color && color.startsWith('#')) || [],
            discount: {
              isActive: productData.discount?.isActive || false,
              percentage: productData.discount?.percentage || 0,
              startDate: productData.discount?.startDate ? new Date(productData.discount.startDate).toISOString().split('T')[0] : '',
              endDate: productData.discount?.endDate ? new Date(productData.discount.endDate).toISOString().split('T')[0] : ''
            },
            isNew: productData.isNew || false
          });

          // Set image previews if product has images
          if (productData.image) {
            setImagePreviewUrls([productData.image]);
          } else if (productData.images && productData.images.length > 0) {
            // Filter out any invalid image paths
            const validImages = productData.images.filter(img => 
              img && (img.startsWith('/images/') || img.startsWith('/uploads/') || img.startsWith('http'))
            );
            setImagePreviewUrls(validImages);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error('Failed to load product details');
        }
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id]);

    // Check if user is admin
  useEffect(() => {
    if (!user || !(user.isAdmin || user.role === 'admin')) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Handle form success/error
  useEffect(() => {
    if (createSuccess) {
      toast.success('Product created successfully!');
      dispatch(resetAdminSuccess());
      navigate('/admin/products');
    }
    if (updateSuccess) {
      toast.success('Product updated successfully!');
      dispatch(resetAdminSuccess());
      navigate('/admin/products');
    }
    if (error) {
      toast.error(error);
      dispatch(resetAdminSuccess());
      setSubmitting(false);
    }
  }, [createSuccess, updateSuccess, error, navigate, dispatch]);

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

  const handleFiles = (files) => {
    const validImageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validImageFiles.length !== files.length) {
      toast.warning('Some files were skipped. Only images are allowed.');
    }

    if (validImageFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...validImageFiles]);

    validImageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Initialize dropzone
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: handleFiles,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.description) errors.description = 'Description is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.price) errors.price = 'Price is required';
    if (formData.sizes.length === 0) errors.sizes = 'At least one size is required';
    
    // Check if at least one size has stock
    const hasSomeStock = formData.sizes.some(size => 
      formData.sizeInventory[size] && formData.sizeInventory[size] > 0
    );
    
    if (!hasSomeStock) errors.sizeInventory = 'At least one size must have stock';
    
    if (imageFiles.length === 0 && imagePreviewUrls.length === 0) errors.images = 'At least one image is required';
    
    // Validate color format
    if (formData.colors.length > 0) {
      for (const color of formData.colors) {
        if (color && !color.startsWith('#')) {
          errors.colors = 'All colors must be in hex format (e.g., #FF5733)';
          break;
        }
        if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
          errors.colors = 'Invalid hex color format. Use format #RRGGBB';
          break;
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
    } else if (name === 'sizes') {
      const selectedSizes = Array.from(e.target.selectedOptions, option => option.value);
      
      // Create updated sizeInventory with only the selected sizes
      const updatedSizeInventory = {};
      selectedSizes.forEach(size => {
        // Preserve existing inventory count for previously selected sizes
        updatedSizeInventory[size] = formData.sizeInventory[size] || 0;
      });
      
      setFormData(prev => ({
        ...prev,
        sizes: selectedSizes,
        sizeInventory: updatedSizeInventory
      }));
    } else if (name.startsWith('sizeInventory.')) {
      const size = name.split('.')[1];
      let stockValue = parseInt(value);
      
      // Ensure stock is not negative
      if (isNaN(stockValue) || stockValue < 0) stockValue = 0;
      
      setFormData(prev => ({
        ...prev,
        sizeInventory: {
          ...prev.sizeInventory,
          [size]: stockValue
        }
      }));
    } else if (name === 'colors') {
      const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
      setFormData(prev => ({
        ...prev,
        [name]: arrayValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addColor = () => {
    // Validate color format
    if (!newColor) {
      toast.error('Please enter a color');
      return;
    }
    
    // Ensure color starts with #
    let colorValue = newColor;
    if (!colorValue.startsWith('#')) {
      colorValue = '#' + colorValue;
    }
    
    // Validate hex format
    if (!isValidHexColor(colorValue)) {
      toast.error('Invalid color format. Use hex format like #FF5733');
      return;
    }
    
    if (!formData.colors.includes(colorValue)) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, colorValue]
      }));
      setNewColor('#000000'); // Reset to default black
    }
    setShowColorInput(false);
  };

  const removeColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(color => color !== colorToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        navigate('/login');
        return;
      }

      // Configure headers with authentication
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      let imageUrls = [];
      
      // First, upload the images
      if (imageFiles.length > 0) {
        try {
          let uploadedPaths = [];
          
          // Upload each file individually to avoid multer issues
          for (const file of imageFiles) {
            const singleFileFormData = new FormData();
            singleFileFormData.append('file', file);
            
            const uploadResponse = await axios.post('/api/upload', singleFileFormData, config);
          
          if (uploadResponse.data && uploadResponse.data.path) {
              uploadedPaths.push(uploadResponse.data.path);
            }
          }
          
          if (uploadedPaths.length > 0) {
            imageUrls = [...imageUrls, ...uploadedPaths];
          } else {
            throw new Error('No files were uploaded successfully');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          let errorMessage = 'Failed to upload images. Please try again.';
          if (uploadError.response && uploadError.response.data && uploadError.response.data.error) {
            errorMessage = uploadError.response.data.error;
          }
          toast.error(errorMessage);
          setSubmitting(false);
          return;
        }
      }

      // If we're editing and there are existing images in preview but not in files
      if (id && imagePreviewUrls.length > imageFiles.length) {
        // Add existing image URLs that start with /images/products or /uploads
        const existingImageUrls = imagePreviewUrls
          .filter(url => url.startsWith('/images/products') || url.startsWith('/uploads'))
          .slice(0, imagePreviewUrls.length - imageFiles.length);
        imageUrls = [...existingImageUrls, ...imageUrls];
      }

      // Calculate total stock across all sizes
      const totalStock = Object.values(formData.sizeInventory).reduce((sum, stock) => sum + Number(stock || 0), 0);

      // Ensure sizeInventory values are all numbers (not strings)
      const formattedSizeInventory = {};
      Object.entries(formData.sizeInventory).forEach(([size, count]) => {
        formattedSizeInventory[size] = Number(count || 0);
      });

      // Log the sizeInventory data for debugging
      console.log('Original sizeInventory:', formData.sizeInventory);
      console.log('Formatted sizeInventory:', formattedSizeInventory);
      console.log('Total stock calculated:', totalStock);

      // Then create/update the product
      const productData = {
        name: formData.name,
        title: formData.name,
        price: Number(formData.price),
        category: formData.category,
        image: imageUrls.length > 0 ? imageUrls[0] : '',
        images: imageUrls.length > 0 ? [imageUrls[0]] : [],
        description: formData.description,
        brand: formData.brand,
        countInStock: totalStock || 0,
        sizeInventory: formattedSizeInventory,
        sizes: formData.sizes || [],
        colors: formData.colors.filter(color => isValidHexColor(color)) || [],
        discount: formData.discount.isActive ? {
          isActive: true,
          percentage: Number(formData.discount.percentage),
          startDate: formData.discount.startDate || new Date().toISOString(),
          endDate: formData.discount.endDate || null
        } : { isActive: false, percentage: 0 },
        isNew: formData.isNew
      };

      console.log('About to submit product data:', productData);

      try {
        if (id) {
          const result = await dispatch(updateProduct({ id, productData })).unwrap();
          console.log('Update result:', result);
          navigate('/admin/products');
        } else {
          const result = await dispatch(createProduct(productData)).unwrap();
          console.log('Create result:', result);
          navigate('/admin/products');
        }
        
        setSubmitting(false);
      } catch (productError) {
        console.error('Product creation/update error:', productError);
        setSubmitting(false);
        toast.error(typeof productError === 'string' ? productError : 'Error processing product. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <StyledContainer>
      <Row className="justify-content-center">
        <Col md={10}>
          <StyledCard>
            <CardHeader>
              <h2>{id ? 'Edit Product' : 'Add New Product'}</h2>
            </CardHeader>
            <CardBody>
              <FormContainer>
                <FormHeader>
                  <h2>{id ? 'Edit Product' : 'Add New Product'}</h2>
                  <p>Fill out the form below to {id ? 'update' : 'create'} a product.</p>
                </FormHeader>
                
                <Form 
                  id="productForm"
                  name="productForm"
                  onSubmit={handleSubmit} 
                  noValidate
                  aria-label={id ? 'Edit product form' : 'Add new product form'}
                >
                  <FormSection>
                    <h4>Basic Information</h4>
                    <Row>
                      <Col md={6}>
                        <StyledFormGroup>
                          <Form.Label htmlFor="productName">Product Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                            id="productName"
                    value={formData.name}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.name}
                            placeholder="Enter product name"
                            autoComplete="off"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.name}
                  </Form.Control.Feedback>
                        </StyledFormGroup>
                      </Col>
                      <Col md={6}>
                        <StyledFormGroup>
                          <Form.Label htmlFor="productBrand">Brand*</Form.Label>
                          <Form.Control
                            type="text"
                            name="brand"
                            id="productBrand"
                            value={formData.brand}
                            onChange={handleChange}
                            isInvalid={!!validationErrors.brand}
                            placeholder="Enter brand name"
                            autoComplete="off"
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.brand}
                          </Form.Control.Feedback>
                        </StyledFormGroup>
                      </Col>
                    </Row>
                    
                    <StyledFormGroup>
                      <Form.Label htmlFor="productDescription">Description*</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                        id="productDescription"
                    value={formData.description}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.description}
                        placeholder="Enter product description"
                        rows={4}
                        autoComplete="off"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.description}
                  </Form.Control.Feedback>
                    </StyledFormGroup>

                <Row>
                  <Col md={6}>
                        <StyledFormGroup>
                          <Form.Label htmlFor="productCategory">Category*</Form.Label>
                      <Form.Select
                        name="category"
                            id="productCategory"
                        value={formData.category}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.category}
                      >
                            <option value="">Select a category</option>
                            {CATEGORIES.map(category => (
                              <option key={category} value={category}>{category}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.category}
                      </Form.Control.Feedback>
                    </StyledFormGroup>
                  </Col>
                  <Col md={6}>
                        <StyledFormGroup>
                          <Form.Label htmlFor="productPrice">Price (USD)*</Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                            id="productPrice"
                        value={formData.price}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.price}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            autoComplete="off"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.price}
                      </Form.Control.Feedback>
                        </StyledFormGroup>
                  </Col>
                    </Row>
                  </FormSection>
                  
                  <FormSection>
                    <h4>Inventory Management</h4>
                    <Row>
                  <Col md={6}>
                        <StyledFormGroup>
                          <Form.Label id="sizesLabel">Available Sizes</Form.Label>
                          <SizeCheckboxContainer aria-labelledby="sizesLabel">
                            {SIZES.map(size => (
                              <SizeCheckboxLabel 
                                key={size} 
                                checked={formData.sizes.includes(size)}
                                htmlFor={`size-${size}`}
                              >
                                <input
                                  type="checkbox"
                                  id={`size-${size}`}
                                  name={`size-${size}`}
                                  value={size}
                                  checked={formData.sizes.includes(size)}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    const updatedSizes = isChecked 
                                      ? [...formData.sizes, size] 
                                      : formData.sizes.filter(s => s !== size);
                                    
                                    // Update sizeInventory when adding a new size
                                    const updatedSizeInventory = { ...formData.sizeInventory };
                                    
                                    if (isChecked && !updatedSizeInventory[size]) {
                                      updatedSizeInventory[size] = 0;
                                    }
                                    
                                    setFormData({
                                      ...formData,
                                      sizes: updatedSizes,
                                      sizeInventory: updatedSizeInventory
                                    });
                                  }}
                                  aria-label={`Size ${size}`}
                                />
                                <span>{size}</span>
                              </SizeCheckboxLabel>
                            ))}
                          </SizeCheckboxContainer>
                          {validationErrors.sizes && (
                            <div className="text-danger mt-2">{validationErrors.sizes}</div>
                          )}
                        </StyledFormGroup>
                      </Col>
                      <Col md={6}>
                        <StyledFormGroup>
                          <Form.Label id="inventoryLabel">Inventory Per Size</Form.Label>
                          {formData.sizes.length > 0 ? (
                            <StockInputsContainer aria-labelledby="inventoryLabel">
                              {formData.sizes.map(size => (
                                <StockInputGroup key={size}>
                                  <StockInputLabel htmlFor={`stock-${size}`}>{size} Stock</StockInputLabel>
                      <Form.Control
                        type="number"
                                    id={`stock-${size}`}
                                    name={`sizeInventory.${size}`}
                                    min="0"
                                    value={formData.sizeInventory[size] || 0}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 0;
                                      if (value < 0) return; // Prevent negative values
                                      
                                      const updatedSizeInventory = { ...formData.sizeInventory };
                                      updatedSizeInventory[size] = value;
                                      
                                      // Log for debugging
                                      console.log(`Updating stock for ${size} to:`, value);
                                      
                                      setFormData({
                                        ...formData,
                                        sizeInventory: updatedSizeInventory
                                      });
                                    }}
                                    autoComplete="off"
                                    aria-label={`Stock for size ${size}`}
                                  />
                                </StockInputGroup>
                              ))}
                            </StockInputsContainer>
                          ) : (
                            <p className="text-muted mt-2">Select sizes first to add inventory</p>
                          )}
                          {validationErrors.sizeInventory && (
                            <div className="text-danger mt-2">{validationErrors.sizeInventory}</div>
                          )}
                        </StyledFormGroup>
                  </Col>
                </Row>
                  </FormSection>
                  
                  <FormSection>
                    <h4>Product Display</h4>
                    <Row>
                      <Col md={12}>
                        <StyledFormGroup>
                          <Form.Label htmlFor="colorPicker">Available Colors</Form.Label>
                          <div className="d-flex align-items-center mt-2 mb-3">
                  <Form.Control
                              type="color"
                              id="colorPicker"
                              name="colorPicker"
                              value={newColor}
                              onChange={e => setNewColor(e.target.value)}
                              style={{ width: '40px', height: '40px', padding: '2px' }}
                              aria-label="Choose color"
                            />
                            <Button 
                              variant="outline-primary"
                              className="ms-2"
                              onClick={addColor}
                              size="sm"
                              aria-label="Add selected color"
                            >
                              Add Color
                            </Button>
                          </div>
                          {formData.colors.length > 0 && (
                            <div className="d-flex flex-wrap align-items-center">
                              {formData.colors.map((color, index) => (
                                <div key={index} className="d-flex align-items-center me-3 mb-2">
                                  <ColorPreview style={{ backgroundColor: color }} aria-label={`Color ${color}`} />
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 text-danger"
                                    onClick={() => removeColor(color)}
                                    aria-label={`Remove color ${color}`}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </StyledFormGroup>
                      </Col>
                    </Row>
                    
                    <StyledFormGroup>
                      <Form.Label htmlFor="productImages">Product Images*</Form.Label>
                      <DropzoneContainer
                        {...getRootProps()}
                        className={isDragActive ? 'active' : ''}
                        aria-labelledby="dropzoneLabel"
                      >
                        <input {...getInputProps()} id="productImages" name="productImages" aria-label="Upload product images" />
                        <FaCloudUploadAlt size={24} />
                        <p id="dropzoneLabel">Drag & drop images here, or click to select files</p>
                        <small className="text-muted">
                          Accepted formats: JPG, PNG, WEBP. Max file size: 5MB.
                        </small>
                      </DropzoneContainer>
                  {validationErrors.images && (
                        <div className="text-danger mt-2">{validationErrors.images}</div>
                  )}
                      
                      {(imageFiles.length > 0 || imagePreviewUrls.length > 0) && (
                  <ImagePreviewContainer>
                          {imageFiles.map((file, index) => (
                            <ImagePreview key={`file-${index}`}>
                              <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} />
                              <button 
                                type="button" 
                                onClick={() => removeImage(index)}
                                aria-label={`Remove image ${index + 1}`}
                                className="remove-image-btn"
                                title={`Remove image ${index + 1}`}
                              >
                                <FaTimes />
                              </button>
                      </ImagePreview>
                    ))}
                  </ImagePreviewContainer>
                      )}
                    </StyledFormGroup>
                  </FormSection>
                  
                  <FormSection>
                    <h4>Pricing & Promotions</h4>
                    <Row>
                      <Col md={12}>
                        <StyledFormGroup>
                  <Form.Check
                    type="checkbox"
                            id="hasDiscount"
                            name="hasDiscount"
                    label="Apply Discount"
                    checked={formData.discount.isActive}
                            onChange={e => {
                              setFormData({
                                ...formData,
                                discount: {
                                  ...formData.discount,
                                  isActive: e.target.checked
                                }
                              });
                            }}
                            aria-describedby="discountHelpText"
                          />
                          <small id="discountHelpText" className="form-text text-muted">
                            Enable to apply a percentage discount to this product
                          </small>
                        </StyledFormGroup>
                      </Col>
                    </Row>

                {formData.discount.isActive && (
                  <Row>
                        <Col md={6}>
                          <StyledFormGroup>
                            <Form.Label htmlFor="discountPercentage">Discount Percentage (%)</Form.Label>
                        <Form.Control
                          type="number"
                              id="discountPercentage"
                          name="discount.percentage"
                          value={formData.discount.percentage}
                          onChange={handleChange}
                              min="1"
                              max="99"
                              autoComplete="off"
                            />
                            {formData.price && formData.discount.percentage > 0 && (
                              <div className="mt-2">
                                <small className="text-success">
                                  Final price: ${(formData.price * (1 - formData.discount.percentage / 100)).toFixed(2)}
                                </small>
                              </div>
                            )}
                          </StyledFormGroup>
                    </Col>
                        <Col md={6}>
                          <StyledFormGroup>
                            <Form.Label htmlFor="discountEndDate">Discount End Date</Form.Label>
                        <Form.Control
                          type="date"
                              id="discountEndDate"
                          name="discount.endDate"
                          value={formData.discount.endDate}
                          onChange={handleChange}
                              min={new Date().toISOString().split('T')[0]}
                        />
                          </StyledFormGroup>
                    </Col>
                  </Row>
                )}
                
                <Row className="mt-4">
                  <Col md={12}>
                    <StyledFormGroup>
                      <Form.Check
                        type="checkbox"
                        id="isNewProduct"
                        name="isNew"
                        label="Mark as New Arrival (appears in the New Arrivals section)"
                        checked={formData.isNew}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            isNew: e.target.checked
                          });
                        }}
                      />
                    </StyledFormGroup>
                  </Col>
                </Row>
                  </FormSection>

                  <div className="d-flex justify-content-end mt-4">
                    <CancelButton 
                      variant="light" 
                      onClick={() => navigate('/admin/products')}
                      aria-label="Cancel and return to products list"
                    >
                    Cancel
                    </CancelButton>
                    <SubmitButton 
                      type="submit" 
                      disabled={submitting}
                      aria-label={id ? 'Update product' : 'Create new product'}
                    >
                      {submitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          {id ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>{id ? 'Update Product' : 'Create Product'}</>
                      )}
                    </SubmitButton>
                </div>
              </Form>
              </FormContainer>
            </CardBody>
          </StyledCard>
        </Col>
      </Row>
    </StyledContainer>
  );
};

export default ProductForm; 