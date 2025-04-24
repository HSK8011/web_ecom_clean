import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { FaExclamationTriangle, FaTrash, FaSync } from 'react-icons/fa';
import { 
  removeUserCartItem, 
  removeFromGuestCart 
} from '../../redux/slices/cartSlice';
import axios from 'axios';

// Styled components
const WarningContainer = styled.div`
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404;
`;

const WarningHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const WarningTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WarningMessage = styled.p`
  margin: 0 0 15px 0;
  font-size: 14px;
  line-height: 1.5;
`;

const ActionButton = styled.button`
  background-color: ${props => props.$primary ? '#007bff' : '#6c757d'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: ${props => props.$primary ? '#0069d9' : '#5a6268'};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ItemsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 15px 0;
`;

const ItemListItem = styled.li`
  padding: 8px;
  margin-bottom: 6px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CartCleanup = () => {
  const dispatch = useDispatch();
  const { items, isUserCart } = useSelector(state => state.cart);
  
  const [nonExistentItems, setNonExistentItems] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Check for non-existent items when the component mounts
  useEffect(() => {
    checkForNonExistentItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);
  
  const checkForNonExistentItems = async () => {
    if (items.length === 0 || isChecking) return;
    
    setIsChecking(true);
    
    try {
      // Map to keep track of which items we've checked
      const checkedItems = new Map();
      const nonExistent = [];
      
      // Create a list of unique product IDs to check
      const uniqueProductIds = [...new Set(items.map(item => item._id))];
      
      // Check each product ID
      await Promise.all(
        uniqueProductIds.map(async (productId) => {
          if (!productId || checkedItems.has(productId)) return;
          
          try {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            await axios.get(`/api/products/${productId}?_=${timestamp}`);
            
            // Product exists, mark as checked
            checkedItems.set(productId, true);
          } catch (err) {
            // Check if it's a 404 (product not found) error
            if (err.response && err.response.status === 404) {
              // Product doesn't exist, mark as checked and add to nonExistent list
              checkedItems.set(productId, false);
              
              // Find all cart items with this product ID
              const affectedItems = items.filter(item => item._id === productId);
              nonExistent.push(...affectedItems);
            }
          }
        })
      );
      
      setNonExistentItems(nonExistent);
    } catch (error) {
      console.error('Error checking for non-existent items:', error);
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleRemoveNonExistentItems = async () => {
    if (nonExistentItems.length === 0 || isRemoving) return;
    
    setIsRemoving(true);
    
    try {
      for (const item of nonExistentItems) {
        if (isUserCart) {
          await dispatch(removeUserCartItem(item._id)).unwrap();
        } else {
          dispatch(removeFromGuestCart(item));
        }
      }
      
      toast.success(`Removed ${nonExistentItems.length} unavailable item(s) from your cart`);
      setNonExistentItems([]);
    } catch (error) {
      console.error('Error removing non-existent items:', error);
      toast.error('Failed to remove some items. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };
  
  // Don't render anything if there are no non-existent items
  if (nonExistentItems.length === 0) {
    return null;
  }
  
  return (
    <WarningContainer>
      <WarningHeader>
        <WarningTitle>
          <FaExclamationTriangle /> Cart Items No Longer Available
        </WarningTitle>
      </WarningHeader>
      
      <WarningMessage>
        The following items in your cart are no longer available in our catalog:
      </WarningMessage>
      
      <ItemsList>
        {nonExistentItems.map((item, index) => (
          <ItemListItem key={index}>
            <span>{item.name || 'Unknown Product'} ({item.size})</span>
            <ActionButton 
              onClick={() => {
                if (isUserCart) {
                  dispatch(removeUserCartItem(item._id));
                } else {
                  dispatch(removeFromGuestCart(item));
                }
                setNonExistentItems(prev => prev.filter(i => i !== item));
                toast.success(`Removed ${item.name || 'item'} from cart`);
              }}
            >
              <FaTrash size={12} /> Remove
            </ActionButton>
          </ItemListItem>
        ))}
      </ItemsList>
      
      <ButtonContainer>
        <ActionButton 
          onClick={checkForNonExistentItems}
          disabled={isChecking}
        >
          <FaSync size={12} /> {isChecking ? 'Checking...' : 'Check Again'}
        </ActionButton>
        
        <ActionButton 
          $primary
          onClick={handleRemoveNonExistentItems}
          disabled={isRemoving}
        >
          <FaTrash size={12} /> {isRemoving ? 'Removing...' : 'Remove All'}
        </ActionButton>
      </ButtonContainer>
    </WarningContainer>
  );
};

export default CartCleanup; 