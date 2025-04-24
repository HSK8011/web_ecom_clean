import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './redux/store';
import { cleanupInvalidTokens } from './utils/tokenCleanup';
import { fetchProducts } from './redux/slices/productSlice';
import { fetchSiteConfig } from './redux/slices/siteConfigSlice';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SimplePage from './components/SimplePage';
import SimpleCategoryPage from './components/SimpleCategoryPage';
import Cart from './components/Cart.jsx';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Shipping from './components/Shipping';
import PlaceOrder from './components/PlaceOrder';
import OrderDetails from './components/OrderDetails';
import NotFound from './components/NotFound';
import TestOrderLink from './components/TestOrderLink';
import ErrorBoundary from './components/ErrorBoundary';
import DebugOrderDetails from './components/DebugOrderDetails';
import ProductsByBrand from './components/ProductsByBrand';
import ProductDetail from './components/ProductDetail';
import Payment from './components/Payment';

// Admin Components
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import ProductList from './components/admin/ProductList';
import ProductForm from './components/admin/ProductForm';
import DiscountForm from './components/admin/DiscountForm';
import OrderList from './components/admin/OrderList';
import OrderDetail from './components/admin/OrderDetail';

function App() {
  useEffect(() => {
    // Clean up invalid tokens on app load
    const performTokenCleanup = async () => {
      try {
        console.log('App: Starting token cleanup on app initialization...');
        const wasCleanupPerformed = await cleanupInvalidTokens();
        if (wasCleanupPerformed) {
          toast.info(
            <div>
              <strong>Your session has expired</strong>
              <p>Please log in again to continue shopping.</p>
              <small>This may happen when the server configuration changes.</small>
            </div>,
            { autoClose: 5000 }
          );
        }
      } catch (error) {
        console.error('Error during token cleanup:', error);
      }
    };

    performTokenCleanup();
    
    // Pre-load products and site configuration data
    store.dispatch(fetchProducts());
    store.dispatch(fetchSiteConfig());
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <ErrorBoundary>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<SimplePage />} />
                <Route path="/shop" element={<SimpleCategoryPage />} />
                <Route path="/category/:category" element={<SimpleCategoryPage />} />
                <Route path="/products" element={<ProductsByBrand />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/place-order" element={<PlaceOrder />} />
                <Route path="/order/:orderId" element={<OrderDetails />} />
                <Route path="/debug-order/:orderId" element={<DebugOrderDetails />} />
                <Route path="/test-order" element={<TestOrderLink />} />
                
                {/* Admin Routes - Protected by AdminRoute */}
                <Route path="/admin" element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductList />} />
                    <Route path="products/new" element={<ProductForm />} />
                    <Route path="products/edit/:id" element={<ProductForm />} />
                    <Route path="products/discount/:id" element={<DiscountForm />} />
                    <Route path="orders" element={<OrderList />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                  </Route>
                </Route>
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
          <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
