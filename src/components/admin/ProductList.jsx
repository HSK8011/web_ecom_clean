import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaTimes, FaSort, FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getAdminProducts, deleteProduct, resetAdminSuccess } from '../../redux/slices/adminSlice';
import { getProductDisplayName } from '../../utils/productHelpers';

const ProductList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { products, loading, error, deleteSuccess } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  
  // Debug: Log products received from the store
  console.log('Products from Redux store:', products);
  
  // States for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showBrandFilter, setShowBrandFilter] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Get unique categories and brands from all products
  const categories = [...new Set(products.map(product => product.category).filter(Boolean))];
  const brands = [...new Set(products.map(product => product.brand).filter(Boolean).filter(brand => brand.trim() !== ''))];

  useEffect(() => {
    if (!user || !(user.isAdmin || user.role === 'admin')) {
      navigate('/login');
      return;
    }
    
    // Apply any active filters when fetching products
    const filters = {
      page: currentPage,
      limit: itemsPerPage
    };
    
    if (filterBrand) filters.brand = filterBrand;
    if (filterCategory) filters.category = filterCategory;
    
    // Debug: Log the filters being applied
    console.log('Fetching products with filters:', filters);
    
    dispatch(getAdminProducts(filters));
  }, [dispatch, user, navigate, filterBrand, filterCategory, currentPage, itemsPerPage]);

  // Handle pagination data received from API
  useEffect(() => {
    if (products && Array.isArray(products)) {
      setTotalItems(products.length > 0 && products[0]?.totalCount ? products[0].totalCount : products.length);
      setTotalPages(Math.ceil(totalItems / itemsPerPage));
    }
  }, [products, itemsPerPage, totalItems]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    
    if (deleteSuccess) {
      toast.success('Product deleted successfully');
      dispatch(resetAdminSuccess());
      setSelectedProducts([]);
    }
  }, [error, deleteSuccess, dispatch]);

  // Handle selecting a product for deletion
  const confirmDelete = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  // Execute deletion
  const handleDelete = () => {
    if (selectedProduct) {
      dispatch(deleteProduct(selectedProduct._id));
      setShowDeleteModal(false);
    }
  };

  // Handle select/deselect all products
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  // Handle select/deselect single product
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Bulk delete selected products
  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) {
      // For each selected product, dispatch delete action
      selectedProducts.forEach(productId => {
        dispatch(deleteProduct(productId));
      });
      setSelectedProducts([]);
    }
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(current => Math.max(current - 1, 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(current => Math.min(current + 1, totalPages));
  };

  // Sort and filter products
  let filteredProducts = [...products];
  
  // Apply search filter
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(
      product =>
        (getProductDisplayName(product).toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  
  // Apply category filter (client-side only for search results)
  if (filterCategory && searchTerm) {
    filteredProducts = filteredProducts.filter(
      product => product.category === filterCategory
    );
  }
  
  // Apply brand filter (client-side only for search results)
  if (filterBrand && searchTerm) {
    filteredProducts = filteredProducts.filter(
      product => product.brand && product.brand.toLowerCase() === filterBrand.toLowerCase()
    );
  }
  
  // Apply sorting
  filteredProducts.sort((a, b) => {
    let valueA, valueB;
    
    if (sortField === 'name') {
      valueA = a.name || a.title || '';
      valueB = b.name || b.title || '';
    } else {
      valueA = a[sortField];
      valueB = b[sortField];
    }
    
    // Handle special cases
    if (sortField === 'price' || sortField === 'countInStock') {
      valueA = parseFloat(valueA) || 0;
      valueB = parseFloat(valueB) || 0;
    } else if (typeof valueA === 'string' && typeof valueB === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Debug: Log the filtered products that will be displayed
  console.log('Filtered products to display:', filteredProducts);
  
  // Debug: Check specifically for the orange shirt2 product
  const orangeShirt = filteredProducts.find(p => p.title === 'orange shirt2' || p.name === 'orange shirt2');
  console.log('Orange shirt2 product in filtered list:', orangeShirt);

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <h1>Products Management</h1>
        <Button as={Link} to="/admin/products/new" $primary>
          <FaPlus /> Add Product
        </Button>
      </Header>

      <ActionBar>
        <SearchBarWrapper>
          <SearchBar>
            <SearchInput
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon>
              {searchTerm ? (
                <FaTimes onClick={() => setSearchTerm('')} />
              ) : (
                <FaSearch />
              )}
            </SearchIcon>
          </SearchBar>
          
          <FilterDropdown>
            <FilterButton onClick={() => setShowCategoryFilter(!showCategoryFilter)}>
              <FaFilter />
              <span>Category</span>
            </FilterButton>
            {showCategoryFilter && (
              <DropdownContent>
                <DropdownItem 
                  onClick={() => {
                    setFilterCategory('');
                    setCurrentPage(1); // Reset to first page when changing filters
                  }}
                  $active={filterCategory === ''}
                >
                  All Categories
                </DropdownItem>
                {categories.map(category => (
                  <DropdownItem 
                    key={category}
                    onClick={() => {
                      setFilterCategory(category);
                      setCurrentPage(1); // Reset to first page when changing filters
                    }}
                    $active={filterCategory === category}
                  >
                    {category}
                  </DropdownItem>
                ))}
              </DropdownContent>
            )}
          </FilterDropdown>
          
          <FilterDropdown>
            <FilterButton onClick={() => setShowBrandFilter(!showBrandFilter)}>
              <FaFilter />
              <span>Brand</span>
            </FilterButton>
            {showBrandFilter && (
              <DropdownContent>
                <DropdownItem 
                  onClick={() => {
                    setFilterBrand('');
                    setCurrentPage(1); // Reset to first page when changing filters
                    dispatch(getAdminProducts({}));
                  }}
                  $active={filterBrand === ''}
                >
                  All Brands
                </DropdownItem>
                {brands.map(brand => (
                  <DropdownItem 
                    key={brand}
                    onClick={() => {
                      setFilterBrand(brand);
                      setCurrentPage(1); // Reset to first page when changing filters
                      dispatch(getAdminProducts({ brand }));
                    }}
                    $active={filterBrand === brand}
                  >
                    {brand}
                  </DropdownItem>
                ))}
              </DropdownContent>
            )}
          </FilterDropdown>
        </SearchBarWrapper>
        
        <ActionButtons>
          {selectedProducts.length > 0 && (
            <Button onClick={handleBulkDelete} $danger>
              <FaTrash /> Delete Selected ({selectedProducts.length})
            </Button>
          )}
        </ActionButtons>
      </ActionBar>

      {loading ? (
        <LoadingSpinner>Loading products...</LoadingSpinner>
      ) : filteredProducts.length === 0 ? (
        <EmptyState>
          <p>No products found matching your criteria.</p>
          {(searchTerm || filterCategory || filterBrand) && (
            <Button onClick={() => { 
              setSearchTerm(''); 
              setFilterCategory(''); 
              setFilterBrand(''); 
              setCurrentPage(1);
            }}>
              Clear Filters
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader width="40px">
                    <Checkbox 
                      type="checkbox" 
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableHeader>
                  <TableHeader width="80px">Image</TableHeader>
                  <TableHeader width="30%" onClick={() => handleSortChange('name')}>
                    Name
                    <SortIcon>
                      {sortField === 'name' ? (
                        sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSort />
                      )}
                    </SortIcon>
                  </TableHeader>
                  <TableHeader onClick={() => handleSortChange('price')}>
                    Price
                    <SortIcon>
                      {sortField === 'price' ? (
                        sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSort />
                      )}
                    </SortIcon>
                  </TableHeader>
                  <TableHeader onClick={() => handleSortChange('category')}>
                    Category
                    <SortIcon>
                      {sortField === 'category' ? (
                        sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSort />
                      )}
                    </SortIcon>
                  </TableHeader>
                  <TableHeader onClick={() => handleSortChange('countInStock')}>
                    Stock
                    <SortIcon>
                      {sortField === 'countInStock' ? (
                        sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                      ) : (
                        <FaSort />
                      )}
                    </SortIcon>
                  </TableHeader>
                  <TableHeader width="120px">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <Checkbox 
                        type="checkbox" 
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <ProductImage 
                        src={
                          (product.images && product.images.length > 0) 
                            ? product.images[0] 
                            : (product.image || '/images/placeholder.png')
                        } 
                        alt={getProductDisplayName(product)} 
                        onError={(e) => {e.target.src = '/images/placeholder.png'}}
                      />
                    </TableCell>
                    <TableCell>
                      <ProductName>{getProductDisplayName(product)}</ProductName>
                      {product.brand && product.brand.trim() !== '' && (
                        <ProductBrand>{product.brand}</ProductBrand>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.discount && product.discount.isActive ? (
                        <PriceContainer>
                          <DiscountedPrice>${Number(product.price * (1 - product.discount.percentage / 100)).toFixed(2)}</DiscountedPrice>
                          <OriginalPrice>${product.price.toFixed(2)}</OriginalPrice>
                          <DiscountBadge>-{product.discount.percentage}%</DiscountBadge>
                        </PriceContainer>
                      ) : (
                        `$${Number(product.price).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>{product.category || 'N/A'}</TableCell>
                    <TableCell>
                      <StockIndicator $inStock={product.countInStock > 0}>
                        {product.countInStock > 10 ? 
                          `${product.countInStock} in stock` : 
                          product.countInStock > 0 ? 
                            <LowStockText>{product.countInStock} left</LowStockText> : 
                            'Out of stock'
                        }
                      </StockIndicator>
                    </TableCell>
                    <TableCell>
                      <ActionsContainer>
                        <ActionButton as={Link} to={`/admin/products/edit/${product._id}`} $edit>
                          <FaEdit />
                        </ActionButton>
                        <ActionButton onClick={() => confirmDelete(product)} $delete>
                          <FaTrash />
                        </ActionButton>
                      </ActionsContainer>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination Controls */}
          <PaginationContainer>
            <PaginationInfo>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
            </PaginationInfo>
            <PaginationControls>
              <PaginationButton 
                onClick={goToPreviousPage} 
                disabled={currentPage === 1}
                $disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </PaginationButton>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                
                // Show first page, last page, current page, and one page before and after current page
                if (
                  pageNumber === 1 || 
                  pageNumber === totalPages || 
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <PaginationButton 
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)} 
                      $active={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationButton>
                  );
                }
                
                // Show ellipsis for gaps
                if (
                  (pageNumber === 2 && currentPage > 3) || 
                  (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return <PaginationEllipsis key={pageNumber}>...</PaginationEllipsis>;
                }
                
                return null;
              })}
              
              <PaginationButton 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                $disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </PaginationButton>
            </PaginationControls>
          </PaginationContainer>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal>
          <ModalContent>
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete the product "{selectedProduct?.name}"?</p>
            <p>This action cannot be undone.</p>
            <ModalActions>
              <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button onClick={handleDelete} $danger>Delete</Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled(motion.div)`
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const SearchBarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-grow: 1;
  max-width: 600px;
`;

const SearchBar = styled.div`
  position: relative;
  flex-grow: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px;
  padding-right: 40px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  cursor: pointer;
`;

const FilterDropdown = styled.div`
  position: relative;
  z-index: 1000;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #f8f9fa;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f1f5f9;
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 200px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1001;
  
  /* Ensure dropdown is always on top */
  isolation: isolate;
`;

const DropdownItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  ${props => props.$active && `
    background-color: #ebf5ff;
    color: #3182ce;
    font-weight: 500;
  `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.$primary && `
    background-color: #3498db;
    color: white;
    border: none;
    
    &:hover {
      background-color: #2980b9;
    }
  `}
  
  ${props => props.$danger && `
    background-color: #e74c3c;
    color: white;
    border: none;
    
    &:hover {
      background-color: #c0392b;
    }
  `}
  
  ${props => !props.$primary && !props.$danger && `
    background-color: #f8f9fa;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    
    &:hover {
      background-color: #e2e8f0;
    }
  `}
`;

const TableContainer = styled.div`
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background-color: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
`;

const TableRow = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }
`;

const TableHeader = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #4a5568;
  cursor: ${props => props.width ? 'default' : 'pointer'};
  width: ${props => props.width || 'auto'};
  white-space: nowrap;
  position: relative;
  
  &:hover {
    ${props => !props.width && `
      background-color: #f1f5f9;
    `}
  }
`;

const SortIcon = styled.span`
  margin-left: 8px;
  display: inline-block;
  color: #a0aec0;
`;

const TableBody = styled.tbody``;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  vertical-align: middle;
`;

const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
`;

const ProductName = styled.div`
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProductBrand = styled.div`
  font-size: 12px;
  color: #a0aec0;
  margin-top: 4px;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DiscountedPrice = styled.div`
  font-weight: 500;
`;

const OriginalPrice = styled.div`
  text-decoration: line-through;
  color: #a0aec0;
`;

const DiscountBadge = styled.div`
  background-color: #c6f6d5;
  color: #2f855a;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 12px;
`;

const StockIndicator = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => props.$inStock ? `
    background-color: #c6f6d5;
    color: #2f855a;
  ` : `
    background-color: #fed7d7;
    color: #c53030;
  `}
`;

const LowStockText = styled.span`
  color: #c53030;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  
  svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }
  
  ${props => props.$edit && `
    background-color: #ebf8ff;
    color: #3182ce;
    
    &:hover {
      background-color: #bee3f8;
    }
  `}
  
  ${props => props.$delete && `
    background-color: #fff5f5;
    color: #e53e3e;
    
    &:hover {
      background-color: #fed7d7;
      color: #c53030;
    }
  `}
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const EmptyState = styled.div`
  padding: 48px;
  text-align: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  p {
    margin-bottom: 16px;
    color: #4a5568;
  }
`;

const LoadingSpinner = styled.div`
  padding: 48px;
  text-align: center;
  color: #4a5568;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  
  h2 {
    margin-top: 0;
    margin-bottom: 16px;
  }
  
  p {
    margin-bottom: 8px;
    color: #4a5568;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  gap: 12px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const PaginationInfo = styled.div`
  color: #718096;
  font-size: 14px;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: ${props => props.$active ? '#3498db' : '#ffffff'};
  color: ${props => props.$active ? '#ffffff' : '#4a5568'};
  border: 1px solid ${props => props.$active ? '#3498db' : '#e2e8f0'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$active ? '#2980b9' : '#f8f9fa'};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const PaginationEllipsis = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #4a5568;
`;

export default ProductList; 