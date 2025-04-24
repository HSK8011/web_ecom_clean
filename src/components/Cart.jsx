import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaTrash, FaShoppingCart, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import { MdLocalShipping } from 'react-icons/md';
import { CircularProgress } from '@mui/material';
import { API_URL } from '../constants';
import axios from 'axios';
import {
  updateGuestCartItem,
  removeFromGuestCart,
  updateUserCartItem,
  removeUserCartItem,
  fetchUserCart,
  clearUserCart,
  clearGuestCart,
  removeInvalidItems
} from '../redux/slices/cartSlice';
import placeholderImg from '../assets/placeholder.png';
import CartErrorHandler from './cart/CartErrorHandler';
import StockIndicator from './cart/StockIndicator';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const { items, loading, error, isUserCart } = useSelector(state => state.cart);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // Local state
  const [stockInfo, setStockInfo] = useState({});
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  
  // Fetch user cart on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Authenticated user - fetching user cart");
      dispatch(fetchUserCart())
        .then(response => {
          console.log("User cart fetch response:", response);
          if (response.error) {
            // If there's an error but we have items in Redux store, keep showing them
            console.warn("Error fetching cart but continuing with existing items:", response.error);
          }
        })
        .catch(error => {
          // Log the error but don't let it affect the display of existing items
          console.error("Error fetching user cart:", error);
        });
    }
  }, [dispatch, isAuthenticated]);

  // Process user cart data when it changes
  useEffect(() => {
    if (isUserCart && items.length > 0) {
      console.log("Processing user cart items:", JSON.stringify(items, null, 2));
      // Pre-process user cart items to ensure they have displayName and displayImage
      const processedItems = items.map(item => {
        const processedItem = {...item};
        
        // If product is an object, extract name and image
        if (typeof item.product === 'object' && item.product) {
          if (item.product.name && !processedItem.displayName) {
            processedItem.displayName = item.product.name;
          }
          
          if (item.product.image && !processedItem.displayImage) {
            processedItem.displayImage = item.product.image;
          }
        }
        
        return processedItem;
      });
      
      // Update the items array directly for UI purposes
      // This doesn't change Redux state but updates the local reference
      if (items.length === processedItems.length) {
        processedItems.forEach((item, index) => {
          if (item.displayName && !items[index].displayName) {
            items[index].displayName = item.displayName;
          }
          if (item.displayImage && !items[index].displayImage) {
            items[index].displayImage = item.displayImage;
          }
        });
      }
    }
  }, [isUserCart, items]);

  // Function to fetch product stock information
  const fetchStockInfo = async () => {
    if (items.length === 0) return;
    
    setIsCheckingStock(true);
    
    try {
      // Collect all product IDs
      const productIds = items.map(item => {
        // Handle different product ID structures in user cart vs guest cart
        const productId = isUserCart ? 
          (typeof item.product === 'object' ? item.product._id : item.product) : 
          (item._id || item.productId);
        return productId;
      }).filter(Boolean);
      
      // Log for debugging
      console.log('Fetching stock for products:', productIds);
      console.log('Cart items structure:', items);
      
      // Fetch product data in batch
      const { data } = await axios.post(`${API_URL}/products/batch`, { productIds });
      console.log('Products data received:', data);
      
      // Process stock data
      const stockData = {};
      let updatedCount = 0;
      
      for (const item of items) {
        // Handle different product ID structures in user cart vs guest cart
        const productId = isUserCart ? 
          (typeof item.product === 'object' ? item.product._id : item.product) : 
          (item._id || item.productId);
          
        if (!productId) {
          console.warn('No product ID found for item:', item);
          continue;
        }
        
        // Find corresponding product
        const product = data.find(p => 
          p._id === productId || 
          p._id === productId.toString()
        );
        
        if (!product) {
          console.warn('No product found for ID:', productId);
          continue;
        }
        
        // Get stock for this item's size
        let availableStock = 0;
        
        // Try to get size-specific inventory
        if (product.sizeInventory) {
          if (typeof product.sizeInventory === 'object' && !Array.isArray(product.sizeInventory)) {
            availableStock = parseInt(product.sizeInventory[item.size], 10) || 0;
          } 
          else if (typeof product.sizeInventory === 'string') {
            try {
              const parsedInventory = JSON.parse(product.sizeInventory);
              availableStock = parseInt(parsedInventory[item.size], 10) || 0;
            } catch (e) {
              console.warn('Failed to parse size inventory');
            }
          }
        }
        
        // Fallback to general inventory divided by sizes
        if (availableStock <= 0 && product.countInStock > 0) {
          const sizeCount = product.sizes?.length || 1;
          availableStock = Math.floor(product.countInStock / sizeCount);
        }
        
        // Store stock data with normalized product ID for consistent lookup
        stockData[`${productId}-${item.size}`] = availableStock;
        
        // Update product information for both guest and user cart items
        // This is the key change - now we update the UI info even for logged-in users
        if (isUserCart) {
          try {
            // Create a mutable copy of the item to avoid "not extensible" errors
            const mutableItem = {...item};
            
            // For user cart, we update the UI state but not the Redux state
            if (product.title || product.name) {
              mutableItem.displayName = product.title || product.name;
            }
            
            if (product.images && product.images.length > 0) {
              mutableItem.displayImage = product.images[0];
            } else if (product.image) {
              mutableItem.displayImage = product.image;
            }
            
            // Check if product is already in the item
            if (typeof mutableItem.product === 'object') {
              // Make a copy of the product object to make it mutable
              mutableItem.product = {...mutableItem.product};
              
              // Make sure the product object has name and image properties
              if (!mutableItem.product.name && (product.name || product.title)) {
                mutableItem.product.name = product.name || product.title;
              }
              
              if (!mutableItem.product.image && (product.image || (product.images && product.images.length > 0))) {
                mutableItem.product.image = product.image || product.images[0];
              }
            } else {
              // If product is just an ID, create a product object with essential data
              mutableItem.product = {
                _id: productId,
                name: product.name || product.title,
                image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null)
              };
            }
            
            // Replace the original item in the items array with our mutable copy
            const itemIndex = items.findIndex(i => 
              (i._id === mutableItem._id) || 
              (i.product && (
                (typeof i.product === 'object' && i.product._id === productId) || 
                i.product === productId
              ))
            );
            
            if (itemIndex !== -1) {
              items[itemIndex] = mutableItem;
            }
            
            updatedCount++;
          } catch (err) {
            console.error('Error updating item info:', err);
          }
        } else {
          // For guest cart, update Redux state as before
          let needsUpdate = false;
          const updates = { ...item };
          
          // Update name if missing
          if (!item.name || item.name === 'Product') {
            updates.name = product.title || product.name;
            needsUpdate = true;
          }
          
          // Update image if missing or placeholder
          if (!item.image || item.image.includes('placeholder')) {
            if (product.images && product.images.length > 0) {
              updates.image = product.images[0];
              needsUpdate = true;
            } else if (product.image) {
              updates.image = product.image;
              needsUpdate = true;
            }
          }
          
          // Dispatch update if needed
          if (needsUpdate) {
            dispatch(updateGuestCartItem(updates));
            updatedCount++;
          }
        }
      }
      
      // Update stock state
      setStockInfo(stockData);
      
      if (updatedCount > 0) {
        toast.success(`Updated information for ${updatedCount} items`);
      }
      
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch product information');
    } finally {
      setIsCheckingStock(false);
    }
  };
  
  // Fetch stock info on initial load
  useEffect(() => {
    if (items.length > 0) {
      fetchStockInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Calculate cart totals
  const calculateSubtotal = (item) => (item.price * item.quantity).toFixed(2);
  
  const cartSubtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingCost = cartSubtotal >= 100 ? 0 : 10;
  const taxRate = 0.07;
  const taxAmount = cartSubtotal * taxRate;
  const orderTotal = cartSubtotal + shippingCost + taxAmount;

  // Add handlers for cart actions
  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    
    const productId = item._id || item.productId;
    const stockKey = `${productId}-${item.size}`;
    const availableStock = stockInfo[stockKey] !== undefined ? stockInfo[stockKey] : 10;
    
    // Check if new quantity exceeds available stock
    if (availableStock > 0 && newQuantity > availableStock) {
      toast.warning(`Only ${availableStock} items available in size ${item.size}`);
      
      // Set to maximum available instead
      if (isUserCart) {
        dispatch(updateUserCartItem({
          itemId: productId,
          quantity: availableStock
        }));
      } else {
        dispatch(updateGuestCartItem({
          ...item,
          quantity: availableStock
        }));
      }
      return;
    }
    
    // Update quantity normally
    if (isUserCart) {
      dispatch(updateUserCartItem({
        itemId: productId,
        quantity: newQuantity
      }));
    } else {
      dispatch(updateGuestCartItem({
        ...item,
        quantity: newQuantity
      }));
    }
  };
  
  // Handle removing an item from cart
  const handleRemoveItem = (item) => {
    if (isUserCart) {
      // For user cart, we need the item's MongoDB _id
      dispatch(removeUserCartItem(item._id));
    } else {
      // For guest cart, we need the product details
      dispatch(removeFromGuestCart(item));
    }
    const itemName = isUserCart ? 
      (item.displayName || item.name || 'Item') : 
      (item.name || 'Item');
    toast.success(`${itemName} removed from cart`);
  };
  
  // Handle clearing entire cart
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      if (isUserCart) {
        dispatch(clearUserCart());
      } else {
        dispatch(clearGuestCart());
      }
      toast.success('Cart cleared successfully');
    }
  };
  
  // Handle checkout process
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Check for out of stock items
    const hasOutOfStock = items.some(item => {
      const productId = item._id || item.productId;
      const stockKey = `${productId}-${item.size}`;
      return stockInfo[stockKey] === 0;
    });
    
    if (hasOutOfStock) {
      toast.error('Some items in your cart are out of stock');
      return;
    }
    
    // If not logged in, redirect to login page
    if (!isAuthenticated) {
      navigate('/login?redirect=shipping');
      toast.info('Please log in to continue with checkout');
    } else {
      navigate('/shipping');
    }
  };
  
  useEffect(() => {
    // Clean up any invalid items when component mounts
    dispatch(removeInvalidItems());
  }, [dispatch]);

  // If there's an error but we have items, show them anyway
  const displayItems = items || [];

  // Render error message without affecting cart display
  const renderError = () => {
    if (error && error.includes('Cannot GET /api/api/cart')) {
      return null; // Suppress this specific error
    }
    return error ? <CartErrorHandler error={error} /> : null;
  };

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <h1>Your Cart</h1>
        <div>
          <ActionButton
            onClick={fetchStockInfo}
            disabled={isCheckingStock || items.length === 0}
            title="Refresh stock data"
          >
            {isCheckingStock ? 'Refreshing...' : 'Refresh Stock'}
          </ActionButton>
          
          <ActionButton 
            onClick={() => navigate('/')}
            title="Continue shopping"
          >
            <FaArrowLeft /> Continue Shopping
          </ActionButton>
        </div>
      </Header>

      {renderError()}

      {loading ? (
        <LoadingMessage>
          <CircularProgress size={40} />
          <p>Loading your cart...</p>
        </LoadingMessage>
      ) : displayItems.length === 0 && !error ? (
        <EmptyCart>
          <EmptyCartIcon>
            <FaShoppingCart />
          </EmptyCartIcon>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <BackToShopLink to="/">
            <FaArrowLeft /> Shop Now
          </BackToShopLink>
        </EmptyCart>
      ) : (
        <CartContent>
          <CartItems>
            <CartTable>
              <CartHeader>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </CartHeader>
              <CartBody>
                {displayItems.map((item) => {
                  // Extract the correct product ID regardless of cart type
                  const productId = isUserCart ? 
                    (typeof item.product === 'object' ? item.product._id : item.product) : 
                    (item._id || item.productId);
                    
                  const stockKey = `${productId}-${item.size}`;
                  const availableStock = stockInfo[stockKey] !== undefined ? stockInfo[stockKey] : 10;
                  
                  const isOutOfStock = availableStock === 0;
                  const isLowStock = availableStock > 0 && availableStock <= 5;
                  const hasInsufficientStock = item.quantity > availableStock && availableStock > 0;
                  
                  // Get product name and image based on cart type
                  let productName = 'Product';
                  let productImage = placeholderImg;
                  
                  if (isUserCart) {
                    // For user cart
                    if (item.displayName) {
                      productName = item.displayName;
                    } else if (typeof item.product === 'object' && item.product.name) {
                      productName = item.product.name;
                    } else if (item.name) {
                      productName = item.name;
                    }
                    
                    if (item.displayImage) {
                      productImage = item.displayImage;
                    } else if (typeof item.product === 'object' && item.product.image) {
                      productImage = item.product.image;
                    } else if (item.image) {
                      productImage = item.image;
                    }
                  } else {
                    // For guest cart
                    productName = item.name || 'Product';
                    productImage = item.image || placeholderImg;
                  }
                  
                  // For debugging
                  console.log('Rendering cart item:', {
                    productId,
                    productName,
                    productImage,
                    isUserCart,
                    item
                  });
                  
                  return (
                    <CartRow key={`${productId}-${item.size}`} $outOfStock={isOutOfStock}>
                      <ProductInfoCell>
                        <ProductImage>
                          <img 
                            src={productImage}
                            alt={productName}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = placeholderImg;
                              
                              // Update image in guest cart if needed
                              if (!isUserCart) {
                                dispatch(updateGuestCartItem({
                                  ...item,
                                  image: placeholderImg
                                }));
                              }
                            }}
                          />
                        </ProductImage>
                        <ProductDetails>
                          <ProductName to={`/product/${productId}`}>
                            {productName}
                          </ProductName>
                          
                          {/* Stock status indicator */}
                          {isOutOfStock ? (
                            <StockStatus $status="error">Out of Stock</StockStatus>
                          ) : isLowStock ? (
                            <StockStatus $status="warning">Low Stock: {availableStock} left</StockStatus>
                          ) : hasInsufficientStock ? (
                            <StockStatus $status="warning">Only {availableStock} available</StockStatus>
                          ) : (
                            <StockStatus $status="success">In Stock</StockStatus>
                          )}
                          
                          {item.color && (
                            <ProductMeta>
                              Color: {item.color}
                            </ProductMeta>
                          )}
                        </ProductDetails>
                      </ProductInfoCell>
                      <ProductSizeCell>{item.size}</ProductSizeCell>
                      <ProductPriceCell>${item.price.toFixed(2)}</ProductPriceCell>
                      <QuantityCell>
                        <QuantityControl>
                          <QuantityButton 
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isOutOfStock}
                          >
                            -
                          </QuantityButton>
                          <QuantityInput
                            type="number"
                            min="1"
                            max={availableStock || 99}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item, parseInt(e.target.value) || 1)}
                            disabled={isOutOfStock}
                          />
                          <QuantityButton 
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={item.quantity >= availableStock || isOutOfStock}
                          >
                            +
                          </QuantityButton>
                        </QuantityControl>
                      </QuantityCell>
                      <SubtotalCell>${calculateSubtotal(item)}</SubtotalCell>
                      <ActionCell>
                        <RemoveButton onClick={() => handleRemoveItem(item)}>
                          <FaTrash />
                        </RemoveButton>
                      </ActionCell>
                    </CartRow>
                  );
                })}
              </CartBody>
            </CartTable>
            
            <CartActions>
              <ClearButton onClick={handleClearCart}>
                Clear Cart
              </ClearButton>
            </CartActions>
          </CartItems>

          <CartSummary>
            <SummaryTitle>Order Summary</SummaryTitle>
            <SummaryRow>
              <span>Subtotal:</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Shipping:</span>
              <span>
                {shippingCost === 0 ? (
                  <ShippingFree>Free</ShippingFree>
                ) : (
                  `$${shippingCost.toFixed(2)}`
                )}
              </span>
            </SummaryRow>
            <ShippingPolicy $isFreeShipping={cartSubtotal >= 100}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdLocalShipping />
                <span>{cartSubtotal >= 100 ? 'Free shipping applied!' : 'Free shipping on orders over $100'}</span>
              </div>
              
              {cartSubtotal < 100 && (
                <>
                  <ShippingProgressBar>
                    <ShippingProgress style={{ width: `${Math.min(100, (cartSubtotal / 100) * 100)}%` }} />
                  </ShippingProgressBar>
                  <ShippingProgressText>
                    ${(100 - cartSubtotal).toFixed(2)} away from free shipping
                  </ShippingProgressText>
                </>
              )}
            </ShippingPolicy>
            <SummaryRow>
              <span>Tax (7%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </SummaryRow>
            <TotalRow>
              <span>Total:</span>
              <TotalAmount>${orderTotal.toFixed(2)}</TotalAmount>
            </TotalRow>
            
            {!isAuthenticated && (
              <GuestNote>
                <FaInfoCircle />
                Please log in or register to proceed with checkout
              </GuestNote>
            )}
            
            <CheckoutButton 
              onClick={handleCheckout}
              disabled={items.length === 0}
            >
              Proceed to Checkout
            </CheckoutButton>
          </CartSummary>
        </CartContent>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    margin: 0;
  }
  
  div {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    
    h1 {
      font-size: 24px;
    }
    
    div {
      width: 100%;
      justify-content: space-between;
    }
  }
`;

const BackToShopLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 20px;
  background-color: #4a6cf7;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3451b2;
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 14px;
  }
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  h2 {
    font-size: 24px;
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  p {
    color: #666;
    margin-bottom: 25px;
  }
`;

const EmptyCartIcon = styled.div`
  font-size: 60px;
  color: #cbd5e0;
  margin-bottom: 20px;
`;

const CartContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const CartItems = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const CartTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const CartHeader = styled.thead`
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  
  th {
    padding: 16px;
    text-align: left;
    font-weight: 600;
    color: #4a5568;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const CartBody = styled.tbody`
  @media (max-width: 768px) {
    display: block;
  }
`;

const CartRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;
  opacity: ${props => props.$outOfStock ? 0.6 : 1};
  
  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: 2fr 1fr;
    padding: 15px;
    gap: 10px;
  }
`;

const ProductInfoCell = styled.td`
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 15px;
  
  @media (max-width: 768px) {
    padding: 0;
    grid-column: 1 / 2;
    grid-row: 1 / 3;
  }
`;

const ProductImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
  }
`;

const ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductName = styled(Link)`
  font-weight: 500;
  color: #1a202c;
  text-decoration: none;
  margin-bottom: 5px;
  transition: color 0.2s;
  
  &:hover {
    color: #3182ce;
  }
`;

const StockWarning = styled.div`
  color: #e53e3e;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const LowStockInfo = styled.div`
  color: #dd6b20;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const StockInfo = styled.div`
  color: #dd6b20;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ProductSizeCell = styled.td`
  padding: 16px;
  font-weight: 500;
  
  @media (max-width: 768px) {
    padding: 0;
    grid-column: 2 / 3;
    grid-row: 1 / 2;
    text-align: right;
  }
`;

const ProductPriceCell = styled.td`
  padding: 16px;
  
  @media (max-width: 768px) {
    padding: 0;
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    text-align: right;
    font-weight: 600;
  }
`;

const QuantityCell = styled.td`
  padding: 16px;
  
  @media (max-width: 768px) {
    padding: 0;
    grid-column: 1 / 2;
    grid-row: 3 / 4;
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
  max-width: 120px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
`;

const QuantityButton = styled.button`
  background: none;
  border: none;
  width: 40px;
  height: 100%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  
  &:hover:not(:disabled) {
    background: #f7fafc;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuantityInput = styled.input`
  width: 40px;
  height: 100%;
  border: none;
  text-align: center;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  -moz-appearance: textfield;
  
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &:disabled {
    background: #f7fafc;
    opacity: 0.7;
  }
`;

const SubtotalCell = styled.td`
  padding: 16px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    padding: 0;
    grid-column: 2 / 3;
    grid-row: 3 / 4;
    text-align: right;
  }
`;

const ActionCell = styled.td`
  padding: 16px;
  
  @media (max-width: 768px) {
    padding: 15px 0 0 0;
    grid-column: 1 / -1;
    grid-row: 4 / 5;
    border-top: 1px dashed #e2e8f0;
  }
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    color: #e53e3e;
    background: rgba(0, 0, 0, 0.05);
  }
`;

const CartSummary = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  align-self: flex-start;
  position: sticky;
  top: 20px;
  
  @media (max-width: 992px) {
    position: static;
  }
`;

const SummaryTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 15px;
`;

const TotalRow = styled(SummaryRow)`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 18px;
`;

const TotalAmount = styled.span`
  color: #3182ce;
`;

const ShippingFree = styled.span`
  color: #38a169;
  font-weight: 500;
`;

const CheckoutButton = styled.button`
  width: 100%;
  padding: 14px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 16px;
  margin-top: 24px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #2c5282;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
`;

const GuestNote = styled.div`
  margin-top: 15px;
  padding: 10px 15px;
  background: #ebf8ff;
  border-radius: 4px;
  font-size: 14px;
  color: #2b6cb0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LoadingMessage = styled.div`
  padding: 40px;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #4a5568;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  text-align: center;
  background: #fff5f5;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #e53e3e;
  border-left: 4px solid #e53e3e;
  margin-bottom: 20px;
`;

const ShippingPolicy = styled.div`
  margin: 10px 0 16px;
  font-size: 14px;
  color: #4a5568;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background-color: ${props => props.$isFreeShipping ? '#e6fffa' : '#f7fafc'};
  border-radius: 6px;
  
  svg {
    color: ${props => props.$isFreeShipping ? '#38b2ac' : '#4a6cf7'};
    font-size: 16px;
  }
`;

const ShippingProgressBar = styled.div`
  height: 4px;
  width: 100%;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
`;

const ShippingProgress = styled.div`
  height: 100%;
  background-color: #4a6cf7;
  border-radius: 2px;
`;

const ShippingProgressText = styled.div`
  font-size: 12px;
  color: #718096;
  text-align: right;
  margin-top: 2px;
`;

const WarningBox = styled.div`
  margin: 20px 0;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  padding: 15px;
  color: #856404;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const WarningTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const WarningMessage = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
`;

const FixButton = styled.button`
  align-self: flex-end;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0069d9;
  }
`;

const StatusText = styled.div`
  display: inline-block;
  font-size: 13px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  margin-top: 6px;
  
  background-color: ${props => {
    switch (props.$status) {
      case 'success':
        return '#e6fffa';
      case 'warning':
        return '#fffbea';
      case 'error':
        return '#fff5f5';
      case 'unknown':
      default:
        return '#f7fafc';
    }
  }};
  
  color: ${props => {
    switch (props.$status) {
      case 'success':
        return '#38b2ac';
      case 'warning':
        return '#d69e2e';
      case 'error':
        return '#e53e3e';
      case 'unknown':
      default:
        return '#718096';
    }
  }};
`;

const ProductMeta = styled.div`
  font-size: 12px;
  color: #718096;
  margin-top: 5px;
`;

const DiagnosticItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const DiagnosticIcon = styled.div`
  font-size: 16px;
  color: #d69e2e;
`;

const DiagnosticTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
`;

const DiagnosticInfo = styled.p`
  margin: 0;
  font-size: 12px;
  color: #718096;
`;

const ActionButton = styled.button`
  background: none;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #f7fafc;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 16px;
  }
  
  @media (max-width: 768px) {
    font-size: 13px;
    padding: 6px 12px;
  }
`;

const CartActions = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid #e2e8f0;
`;

const ClearButton = styled.button`
  background: none;
  border: 1px solid #e2e8f0;
  color: #718096;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    color: #e53e3e;
    border-color: #e53e3e;
    background: rgba(229, 62, 62, 0.05);
  }
`;

const StockStatus = styled.span`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  margin-top: 4px;
  
  background-color: ${props => {
    switch (props.$status) {
      case 'success':
        return '#e6fffa';
      case 'warning':
        return '#fffbea';
      case 'error':
        return '#fff5f5';
      default:
        return '#f7fafc';
    }
  }};
  
  color: ${props => {
    switch (props.$status) {
      case 'success':
        return '#38b2ac';
      case 'warning':
        return '#d69e2e';
      case 'error':
        return '#e53e3e';
      default:
        return '#718096';
    }
  }};
`;

export default Cart; 