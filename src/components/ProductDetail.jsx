import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToGuestCart, addItemToUserCart } from '../redux/slices/cartSlice';
import { fetchProducts } from '../redux/slices/productSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import styled from 'styled-components';
import { FaCheck, FaShoppingCart, FaStar, FaInfoCircle, FaQuestionCircle, FaAngleRight, FaAngleLeft, FaHeart, FaShare, FaTruck, FaUndo, FaShieldAlt } from 'react-icons/fa';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

const BreadcrumbNav = styled.div`
  display: flex;
  margin-bottom: 30px;
  font-size: 14px;
  color: #666;
  flex-wrap: wrap;
  
  a {
    color: #666;
    text-decoration: none;
    &:hover {
      color: #000;
      text-decoration: underline;
    }
  }
  
  span {
    margin: 0 8px;
  }
  
  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 20px;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 60px;
  margin-bottom: 60px;
  
  @media (max-width: 992px) {
    gap: 30px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
`;

// Enhanced gallery component
const GalleryContainer = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 15px;
  
  @media (max-width: 992px) {
    grid-template-columns: 70px 1fr;
    gap: 10px;
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const ThumbnailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: min-content;
  
  @media (max-width: 576px) {
    display: none;
  }
`;

const Thumbnail = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${props => props.$active ? '#111' : 'transparent'};
  transition: all 0.2s ease;
  opacity: ${props => props.$active ? '1' : '0.7'};
  box-shadow: ${props => props.$active ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'};
  
  &:hover {
    opacity: 1;
    transform: translateY(-2px);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  
  @media (max-width: 992px) {
    width: 70px;
    height: 70px;
  }
`;

const MainImageContainer = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    transition: transform 0.3s ease;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
`;

const NavigationDots = styled.div`
  display: none;
  
  @media (max-width: 576px) {
    display: flex;
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    gap: 8px;
    z-index: 2;
  }
`;

const NavDot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#111' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.2);
  }
`;

// Enhanced product info section
const ProductInfo = styled.div`
  padding: 0;
  max-width: 450px;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const Brand = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  
  &:after {
    content: '';
    display: inline-block;
    width: 30px;
    height: 1px;
    background: #ddd;
    margin-left: 10px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.2;
  color: #111;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Price = styled.div`
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #111;
  display: flex;
  align-items: center;
  
  .original-price {
    text-decoration: line-through;
    color: #999;
    font-size: 20px;
    margin-right: 12px;
  }
  
  .discount {
    background: #e53e3e;
    color: white;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 14px;
    margin-left: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
  }
`;

const Description = styled.p`
  color: #444;
  margin-bottom: 24px;
  line-height: 1.6;
  font-size: 15px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 20px 0;
`;

const StockStatus = styled.div`
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 20px;
  color: ${props => props.$inStock ? '#059669' : '#dc2626'};
  font-size: 14px;
  background: ${props => props.$inStock ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)'};
  padding: 8px 12px;
  border-radius: 20px;
  
  svg {
    margin-right: 8px;
  }
`;

const ProductFeatures = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #555;
  
  svg {
    margin-right: 8px;
    color: #666;
  }
`;

const SectionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #111;
`;

const SizeSection = styled.div`
  margin-bottom: 20px;
`;

const SizeOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const SizeButton = styled.button`
  width: 45px;
  height: 45px;
  padding: 0;
  border: 1px solid ${props => props.$selected ? '#111' : '#ddd'};
  background: ${props => props.$selected ? '#111' : 'transparent'};
  color: ${props => props.$selected ? '#fff' : '#111'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #111;
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #ddd;
    transform: none;
    box-shadow: none;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const QuantityControl = styled.div`
  flex: 0 0 140px;
`;

const QuantityButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  height: 50px;

  button {
    width: 42px;
    height: 100%;
    border: none;
    background: transparent;
    font-size: 18px;
    cursor: pointer;
    color: #111;
    transition: background 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &:not(:disabled):hover {
      background: #f5f5f5;
    }
  }

  span {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 500;
    padding: 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const WishlistButton = styled.button`
  background: transparent;
  border: 1px solid #ddd;
  height: 50px;
  width: 50px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  
  &:hover {
    border-color: #e53e3e;
    color: #e53e3e;
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.1);
  }
`;

const ShareButton = styled(WishlistButton)`
  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 14px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 6px;
  }
`;

const AddToCartButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0;
  height: 54px;
  background: #111;
  color: white;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  
  svg {
    margin-right: 10px;
    font-size: 18px;
  }
  
  &:hover {
    background: #333;
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0,0,0,0.2);
  }

  &:disabled {
    background: #999;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Enhanced tabs
const TabsContainer = styled.div`
  margin-top: 60px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const TabButtons = styled.div`
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const TabButton = styled.button`
  flex: 1;
  background: none;
  border: none;
  padding: 18px 24px;
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.$active ? '#111' : '#666'};
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: ${props => props.$active ? '#111' : 'transparent'};
    transition: all 0.2s ease;
  }

  &:hover {
    color: #111;
    background: ${props => props.$active ? 'transparent' : 'rgba(0,0,0,0.02)'};
  }
  
  svg {
    margin-right: 8px;
  }
  
  @media (max-width: 576px) {
    text-align: left;
    padding: 14px 20px;
  }
`;

const TabContent = styled.div`
  padding: 30px;
  color: #444;
  line-height: 1.6;
  font-size: 15px;
  
  @media (max-width: 576px) {
    padding: 20px;
  }
`;

const DetailsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  p {
    margin-bottom: 15px;
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.p`
  display: flex;
  margin-bottom: 10px;
  
  strong {
    min-width: 150px;
    display: inline-block;
  }
`;

const NoReviews = styled.div`
  text-align: center;
  padding: 40px 0;
  color: #666;
  
  svg {
    font-size: 40px;
    margin-bottom: 16px;
    color: #ddd;
  }
  
  h3 {
    margin-bottom: 8px;
    font-weight: 500;
  }
`;

// Enhanced related products
const RelatedProductsSection = styled.div`
  margin-top: 80px;
  margin-bottom: 40px;
`;

const SectionHeader = styled.h2`
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 40px;
  text-align: center;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 3px;
    background-color: #111;
  }
`;

const ProductSlider = styled.div`
  position: relative;
  padding: 10px 40px;
`;

const SliderButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
  
  &:hover {
    background: #f5f5f5;
    border-color: #ccc;
    transform: translateY(-50%) scale(1.05);
  }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    transform: translateY(-50%) scale(1);
  }
  
  &.prev {
    left: 0;
  }
  
  &.next {
    right: 0;
  }
  
  svg {
    font-size: 20px;
  }
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;
  padding: 10px 5px;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 450px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

const RelatedProductCard = styled.div`
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  
  &:hover {
    transform: translateY(-7px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
`;

const RelatedProductImage = styled.div`
  width: 100%;
  height: 200px;
  background: #f8f9fa;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  ${RelatedProductCard}:hover & img {
    transform: scale(1.05);
  }
`;

const RelatedProductInfo = styled.div`
  padding: 16px;
`;

const RelatedProductName = styled.h3`
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RelatedProductPrice = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #111;
`;

// Component implementation
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isUserCart } = useSelector(state => state.cart);
  const { items: allProducts = [] } = useSelector(state => state.products);
  
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [currentSizeStock, setCurrentSizeStock] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);
        if (response.data.sizes && response.data.sizes.length > 0) {
          const firstSize = response.data.sizes[0];
          setSelectedSize(firstSize);
          
          // Set initial stock for the selected size
          if (response.data.sizeInventory && response.data.sizeInventory[firstSize]) {
            setCurrentSizeStock(response.data.sizeInventory[firstSize]);
          } else {
            // Fallback to total stock divided by number of sizes
            const totalStock = response.data.countInStock || response.data.stock || 0;
            setCurrentSizeStock(Math.floor(totalStock / response.data.sizes.length) || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    
    // Get all products if they're not already loaded
    if (allProducts.length === 0) {
      dispatch(fetchProducts());
    }
    
    // Reset active image when product changes
    setActiveImageIndex(0);
  }, [id, dispatch, allProducts.length]);
  
  // Update stock when size changes
  useEffect(() => {
    if (product && selectedSize) {
      if (product.sizeInventory && product.sizeInventory[selectedSize] !== undefined) {
        setCurrentSizeStock(product.sizeInventory[selectedSize]);
      } else {
        // Fallback to total stock divided by number of sizes
        const totalStock = product.countInStock || product.stock || 0;
        setCurrentSizeStock(Math.floor(totalStock / product.sizes.length) || 0);
      }
      
      // Reset quantity to 1 when size changes
      setQuantity(1);
    }
  }, [selectedSize, product]);

  // Set related products after product and allProducts are loaded
  useEffect(() => {
    if (product && allProducts.length > 0) {
      // Filter products in the same category but exclude current product
      const related = allProducts
        .filter(p => p.category === product.category && p._id !== product._id)
        .slice(0, 8); // Limit to 8 related products
      
      // If not enough products in the same category, add some random products
      if (related.length < 4) {
        const randomProducts = allProducts
          .filter(p => p._id !== product._id && !related.some(r => r._id === p._id))
          .slice(0, 4 - related.length);
        
        setRelatedProducts([...related, ...randomProducts]);
      } else {
        setRelatedProducts(related);
      }
    }
  }, [product, allProducts]);

  const handleNextSlide = () => {
    if (currentSlide < Math.ceil(relatedProducts.length / 4) - 1) {
      setCurrentSlide(currentSlide + 1);
      const slider = document.getElementById('products-slider');
      if (slider) {
        slider.scrollLeft += slider.offsetWidth;
      }
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      const slider = document.getElementById('products-slider');
      if (slider) {
        slider.scrollLeft -= slider.offsetWidth;
      }
    }
  };
  
  const handleRelatedProductClick = (productId) => {
    navigate(`/product/${productId}`);
    // Scroll to top when navigating to a new product
    window.scrollTo(0, 0);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity < 1 || newQuantity > currentSizeStock) return;
    setQuantity(newQuantity);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    
    // Update current stock for the selected size
    let sizeStock = 0;
    
    // Check if we have explicit size inventory data
    if (product.sizeInventory && product.sizeInventory[size] !== undefined) {
      sizeStock = parseInt(product.sizeInventory[size], 10);
      console.log(`Found specific inventory for size ${size}:`, sizeStock);
    } else if (product.countInStock && product.sizes && product.sizes.length > 0) {
      // Fallback to evenly distributed inventory if no specific size inventory data
      sizeStock = Math.floor(product.countInStock / product.sizes.length);
      console.log(`Using evenly distributed inventory for size ${size}:`, sizeStock);
    }
    
    // Update the UI to show correct stock for selected size
    setCurrentSizeStock(sizeStock);
    
    // Ensure quantity doesn't exceed available stock
    if (quantity > sizeStock) {
      setQuantity(Math.max(1, sizeStock));
      toast.info(`Quantity adjusted to match available stock for size ${size}`);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    try {
      // Get latest stock level for the selected size
      const response = await axios.get(`/api/products/${id}`);
      const updatedProduct = response.data;
      
      // Get current stock for the selected size
      let sizeStock = 0;
      if (updatedProduct.sizeInventory && updatedProduct.sizeInventory[selectedSize] !== undefined) {
        sizeStock = updatedProduct.sizeInventory[selectedSize];
      } else {
        // Fallback to calculating an estimated stock per size
        const totalStock = updatedProduct.countInStock || 0;
        sizeStock = Math.floor(totalStock / updatedProduct.sizes.length) || 0;
      }

      console.log('Product stock check for adding to cart:', {
        productId: updatedProduct._id,
        size: selectedSize,
        availableStock: sizeStock,
        requestedQuantity: quantity
      });

      if (sizeStock <= 0) {
        toast.error(`Sorry, size ${selectedSize} is out of stock`);
        return;
      }

      if (quantity > sizeStock) {
        toast.error(`Sorry, only ${sizeStock} items available in stock for size ${selectedSize}`);
        setCurrentSizeStock(sizeStock); // Update UI to reflect current stock
        return;
      }

      const item = {
        _id: updatedProduct._id,
        productId: updatedProduct._id, // Include both ID formats to ensure compatibility
        name: updatedProduct.title || updatedProduct.name,
        price: updatedProduct.price,
        image: updatedProduct.image || (updatedProduct.images && updatedProduct.images.length > 0 ? updatedProduct.images[0] : null),
        size: selectedSize,
        quantity: quantity,
        stock: sizeStock // Include stock for this specific size
      };

      console.log('Adding item to cart:', item);

      if (isUserCart) {
        dispatch(addItemToUserCart(item));
      } else {
        dispatch(addToGuestCart(item));
      }
      
      toast.success('Added to cart');
    } catch (error) {
      console.error('Error checking stock:', error);
      toast.error('Error adding to cart: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading || !product) {
    return <PageContainer>Loading...</PageContainer>;
  }

  // Check if the selected size has stock
  const inStock = currentSizeStock > 0;
  
  // Handle product images for the gallery
  const productImages = [];
  if (product.images && product.images.length > 0) {
    productImages.push(...product.images);
  } else if (product.image) {
    productImages.push(product.image);
  }
  
  // If no images are available, add a placeholder
  if (productImages.length === 0) {
    productImages.push('/placeholder.jpg');
  }

  const handleImageClick = (index) => {
    setActiveImageIndex(index);
  };

  return (
    <PageContainer>
      <BreadcrumbNav>
        <a href="/">Home</a>
        <span>/</span>
        <a href="/shop">Shop</a>
        {product.category && (
          <>
            <span>/</span>
            <a href={`/category/${product.category?.toLowerCase()}`}>{product.category}</a>
          </>
        )}
        <span>/</span>
        {product.title || product.name}
      </BreadcrumbNav>
      
      <ProductGrid>
        <GalleryContainer>
          <ThumbnailsContainer>
            {productImages.map((image, index) => (
              <Thumbnail 
                key={index} 
                $active={activeImageIndex === index}
                onClick={() => handleImageClick(index)}
              >
                <img src={image} alt={`${product.title || product.name} - Thumbnail ${index+1}`} />
              </Thumbnail>
            ))}
          </ThumbnailsContainer>
          
          <MainImageContainer>
            <img 
              src={productImages[activeImageIndex]} 
              alt={product.title || product.name} 
            />
            
            <NavigationDots>
              {productImages.map((_, index) => (
                <NavDot 
                  key={index}
                  $active={activeImageIndex === index}
                  onClick={() => handleImageClick(index)}
                />
              ))}
            </NavigationDots>
          </MainImageContainer>
        </GalleryContainer>

        <ProductInfo>
          {product.brand && <Brand>{product.brand}</Brand>}
          <Title>{product.title || product.name}</Title>
          <Price>
            ${product.price}
            {product.discount?.isActive && product.discount.percentage > 0 && (
              <>
                <span className="original-price">
                  ${(product.price / (1 - product.discount.percentage / 100)).toFixed(2)}
                </span>
                <span className="discount">-{product.discount.percentage}% OFF</span>
              </>
            )}
          </Price>
          
          <StockStatus $inStock={inStock}>
            {inStock ? <FaCheck /> : <FaInfoCircle />}
            {inStock 
              ? (currentSizeStock <= 5 ? `Only ${currentSizeStock} left in stock for size ${selectedSize}!` : `In Stock (${currentSizeStock} available)`) 
              : `Out of Stock for size ${selectedSize}`
            }
          </StockStatus>
          
          <Description>{product.description}</Description>
          
          <ProductFeatures>
            <FeatureItem>
              <FaTruck /> Free shipping over $100
            </FeatureItem>
            <FeatureItem>
              <FaUndo /> 30-day returns
            </FeatureItem>
            <FeatureItem>
              <FaShieldAlt /> 1 year warranty
            </FeatureItem>
            <FeatureItem>
              <FaCheck /> Quality guaranteed
            </FeatureItem>
          </ProductFeatures>
          
          <Divider />

          <SizeSection>
            <SectionTitle>Select Size</SectionTitle>
            <SizeOptions>
              {product.sizes?.map((size) => {
                // Check stock for this size
                let sizeStock = 0;
                if (product.sizeInventory && product.sizeInventory[size] !== undefined) {
                  sizeStock = product.sizeInventory[size];
                } else {
                  // Fallback to total stock
                  sizeStock = Math.floor((product.countInStock || 0) / product.sizes.length) || 0;
                }
                
                const sizeHasStock = sizeStock > 0;
                
                return (
                  <SizeButton
                    key={size}
                    $selected={selectedSize === size}
                    onClick={() => handleSizeSelect(size)}
                    disabled={!sizeHasStock}
                    title={sizeHasStock ? `${sizeStock} in stock` : 'Out of stock'}
                  >
                    {size}
                    {sizeHasStock && sizeStock <= 5 && (
                      <span className="low-stock"> ({sizeStock})</span>
                    )}
                  </SizeButton>
                );
              })}
            </SizeOptions>
          </SizeSection>

          <ActionsContainer>
          <QuantityControl>
              <SectionTitle>Quantity</SectionTitle>
            <QuantityButtons>
              <button 
                onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || !inStock}
              >
                -
              </button>
              <span>{quantity}</span>
              <button 
                onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= currentSizeStock || !inStock}
              >
                +
              </button>
            </QuantityButtons>
              {quantity >= currentSizeStock && currentSizeStock > 0 && (
              <ErrorMessage>
                  <FaInfoCircle /> Maximum stock reached
              </ErrorMessage>
            )}
          </QuantityControl>
            
            <WishlistButton title="Add to wishlist">
              <FaHeart />
            </WishlistButton>
            
            <ShareButton title="Share product">
              <FaShare />
            </ShareButton>
          </ActionsContainer>

          <AddToCartButton 
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            <FaShoppingCart />
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </AddToCartButton>
        </ProductInfo>
      </ProductGrid>

      <TabsContainer>
        <TabButtons>
          <TabButton 
            $active={activeTab === 'details'} 
            onClick={() => setActiveTab('details')}
              >
            <FaInfoCircle /> Product Details
          </TabButton>
          <TabButton 
            $active={activeTab === 'reviews'} 
            onClick={() => setActiveTab('reviews')}
          >
            <FaStar /> Reviews
          </TabButton>
          <TabButton 
            $active={activeTab === 'faq'} 
            onClick={() => setActiveTab('faq')}
          >
            <FaQuestionCircle /> FAQ
          </TabButton>
        </TabButtons>

        <TabContent>
          {activeTab === 'details' && (
            <DetailsList>
              <div>
                <p>{product.details || product.description}</p>
                <DetailItem><strong>SKU:</strong> {product._id.slice(-8).toUpperCase()}</DetailItem>
                {product.brand && <DetailItem><strong>Brand:</strong> {product.brand}</DetailItem>}
                <DetailItem><strong>Category:</strong> {product.category}</DetailItem>
              </div>
                              <div>
                {product.colors && product.colors.length > 0 && (
                  <DetailItem><strong>Available Colors:</strong> {product.colors.join(', ')}</DetailItem>
                )}
                {product.sizes && product.sizes.length > 0 && (
                  <DetailItem>
                    <strong>Available Sizes:</strong> 
                    {product.sizes.map(size => {
                      // Get stock for this size
                      let sizeStock = 0;
                      if (product.sizeInventory && product.sizeInventory[size] !== undefined) {
                        sizeStock = product.sizeInventory[size];
                      }
                      const isInStock = sizeStock > 0;
                      
                      return (
                        <span key={size} style={{marginRight: '8px', color: isInStock ? 'inherit' : '#999'}}>
                          {size}{!isInStock && ' (Out of stock)'}
                        </span>
                      );
                    })}
                  </DetailItem>
                )}
                <DetailItem>
                  <strong>Total In Stock:</strong> 
                  {Object.entries(product.sizeInventory || {}).reduce((total, [size, count]) => 
                    total + `${size}: ${count} units${', '}`, '').slice(0, -2) || 'No stock information available'}
                </DetailItem>
                  </div>
            </DetailsList>
          )}
          
          {activeTab === 'reviews' && (
            <NoReviews>
              <FaStar />
              <h3>No Reviews Yet</h3>
              <p>Be the first to review this product!</p>
            </NoReviews>
          )}
          
          {activeTab === 'faq' && (
                    <div>
              <h3>Frequently Asked Questions</h3>
              <p>No FAQs available for this product.</p>
              {/* Add FAQ items here */}
                    </div>
          )}
        </TabContent>
      </TabsContainer>
      
      {relatedProducts.length > 0 && (
        <RelatedProductsSection>
          <SectionHeader>You Might Also Like</SectionHeader>
          
          <ProductSlider>
            <SliderButton 
              className="prev" 
              onClick={handlePrevSlide} 
              disabled={currentSlide === 0}
            >
              <FaAngleLeft />
            </SliderButton>
            
            <ProductsGrid id="products-slider">
              {relatedProducts.map(relatedProduct => (
                <RelatedProductCard 
                  key={relatedProduct._id}
                  onClick={() => handleRelatedProductClick(relatedProduct._id)}
                >
                  <RelatedProductImage>
                    <img 
                      src={relatedProduct.image || (relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images[0] : '/placeholder.jpg')} 
                      alt={relatedProduct.title || relatedProduct.name} 
                    />
                  </RelatedProductImage>
                  <RelatedProductInfo>
                    <RelatedProductName>
                      {relatedProduct.title || relatedProduct.name}
                    </RelatedProductName>
                    <RelatedProductPrice>
                      ${relatedProduct.price}
                    </RelatedProductPrice>
                  </RelatedProductInfo>
                </RelatedProductCard>
              ))}
            </ProductsGrid>
            
            <SliderButton 
              className="next" 
              onClick={handleNextSlide} 
              disabled={currentSlide >= Math.ceil(relatedProducts.length / 4) - 1}
            >
              <FaAngleRight />
            </SliderButton>
          </ProductSlider>
        </RelatedProductsSection>
      )}
    </PageContainer>
  );
};

export default ProductDetail; 