/**
 * Token cleanup utility
 * 
 * This utility helps clean up any invalid tokens that might cause API errors,
 * especially after server configuration changes like JWT_SECRET updates.
 */

import api from '../config/api';

/**
 * Checks if a token is valid by testing multiple endpoints
 * Returns true if token seems valid, false if definitely invalid
 */
export const validateToken = async () => {
  console.log('TokenCleanup: Starting token validation...');
  
  // Try multiple endpoints that require authentication
  const endpointsToTry = [
    '/auth/me',      // User profile endpoint
    '/cart'          // Cart endpoint
  ];
  
  // For each endpoint, try to make a request
  for (const endpoint of endpointsToTry) {
    try {
      console.log(`TokenCleanup: Trying endpoint ${endpoint}...`);
      await api.get(endpoint);
      // If any endpoint succeeds, the token is valid
      console.log(`TokenCleanup: Endpoint ${endpoint} succeeded, token is valid`);
      return true;
    } catch (error) {
      // If we get a 401/403 error, the token is definitely invalid
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn(`TokenCleanup: Authentication token invalid when accessing ${endpoint} (${error.response.status})`);
        return false;
      }
      
      // If we get a 500 error specifically from the cart endpoint, it's likely a token issue
      if (endpoint === '/cart' && error.response && error.response.status === 500) {
        console.warn(`TokenCleanup: Server 500 error from cart API - likely authentication issue`);
        console.warn(`TokenCleanup: Error response:`, error.response?.data || 'No error data');
        return false;
      }
      
      // For other errors like 404, continue trying other endpoints
      console.warn(`TokenCleanup: Endpoint ${endpoint} unavailable (${error.response?.status || 'unknown error'}), trying next option`);
      console.warn(`TokenCleanup: Error details:`, error.response?.data || error.message || 'No error details');
    }
  }
  
  // If we exhaust all endpoints without a definitive answer, err on the side of caution
  // and assume the token might be valid (we don't want to log users out unnecessarily)
  console.warn('TokenCleanup: Could not definitively validate token status, assuming valid for now');
  return true;
};

/**
 * Cleans up any invalid tokens and authentication data
 * Returns true if cleanup was performed
 */
export const cleanupInvalidTokens = async () => {
  console.log('TokenCleanup: Starting token cleanup process...');
  
  const token = localStorage.getItem('token');
  
  // If no token, nothing to cleanup
  if (!token) {
    console.log('TokenCleanup: No token found in localStorage, nothing to clean up');
    return false;
  }
  
  console.log('TokenCleanup: Found token in localStorage, validating...');
  const isValid = await validateToken();
  
  if (!isValid) {
    console.log('TokenCleanup: Token is invalid, cleaning up authentication data');
    // Token is invalid, clean up authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Remove token from API headers
    delete api.defaults.headers.common['Authorization'];
    
    console.log('TokenCleanup: Authentication data cleaned up successfully');
    return true;
  }
  
  console.log('TokenCleanup: Token is valid, no cleanup needed');
  return false;
}; 