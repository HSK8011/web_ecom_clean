// Direct Profile Update Test Script
// Paste this into your browser console to test profile updates directly

const testDirectProfileUpdate = async () => {
  // Get current token from localStorage
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No authentication token found in localStorage');
    return;
  }

  // Get current user data
  const currentUserData = JSON.parse(localStorage.getItem('userData'));
  console.log('Current user data before update:', currentUserData);

  // Create test data - modify only phone and address
  const testData = {
    name: currentUserData.name,
    email: currentUserData.email,
    phone: '9876543210', // Test phone number
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    }
  };

  console.log('Sending test data:', testData);

  try {
    // Make direct API call
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('API response:', result);
    
    // Check specific fields
    if (result.user) {
      console.log('Response phone:', result.user.phone);
      console.log('Response address:', result.user.address);
    } else {
      console.log('Response phone:', result.phone);
      console.log('Response address:', result.address);
    }
    
    // Optionally update localStorage
    const userData = result.user || result;
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log('Updated localStorage with new user data');
    
    return result;
  } catch (error) {
    console.error('Direct test error:', error);
    return null;
  }
};

// Usage:
// Run this in the browser console:
// testDirectProfileUpdate().then(result => console.log('Test complete:', result)); 