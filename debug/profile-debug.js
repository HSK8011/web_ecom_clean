// Debug instructions for fixing profile update issue
// Add these console logs to help diagnose the problem

// 1. In src/components/Profile.jsx, add these logs to handleSubmit function:
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Log complete form data 
    console.log('Complete form data before submit:', JSON.stringify(formData, null, 2));
    
    // Create the formatted data for API
    const apiData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address
    };

    // Log exactly what we're sending
    console.log('Submitting profile data (stringified):', JSON.stringify(apiData, null, 2));
    
    const result = await dispatch(updateProfile(apiData)).unwrap();
    console.log('Profile update result (stringified):', JSON.stringify(result, null, 2));
    
    setIsEditing(false);
    toast.success('Profile updated successfully');
    
    // Reload profile data to ensure we have the latest
    dispatch(fetchUserProfile());
  } catch (err) {
    console.error('Profile update error:', err);
    toast.error(err.message || 'Failed to update profile');
  }
};

// 2. In src/redux/slices/profileSlice.js, modify updateProfile:
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profileData, { rejectWithValue, getState, dispatch }) => {
    try {
      console.log('profileSlice: Starting update with data:', JSON.stringify(profileData, null, 2));
      
      const { token } = getState().auth;
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await api.put('/users/profile', profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('profileSlice: Profile API response:', JSON.stringify(response.data, null, 2));
      
      // After successful update, update the auth state as well
      try {
        // Make sure we handle the new response structure
        const userData = response.data && response.data.user ? response.data.user : response.data;
        
        // Only save to localStorage if userData is defined and not null
        if (userData) {
          localStorage.setItem('userData', JSON.stringify(userData));
          console.log('profileSlice: Saved user data to localStorage:', JSON.stringify(userData, null, 2));
        } else {
          console.warn('No user data to save to localStorage');
        }
      } catch (err) {
        console.error('Error saving user data to localStorage:', err);
      }
      
      return response.data;
    } catch (error) {
      console.error('profileSlice: Update error:', error);
      return rejectWithValue(error.response?.data.error || 'Failed to update profile');
    }
  }
);

// 3. Also check if we have the correct form initialization in Profile.jsx:
useEffect(() => {
  if (user) {
    console.log('User data for form init:', JSON.stringify(user, null, 2));
    console.log('Address data specifically:', JSON.stringify(user.address, null, 2));
    
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || ''
      }
    });
    
    // Log the form data after setting it
    setTimeout(() => {
      console.log('Form data after initialization:', JSON.stringify(formData, null, 2));
    }, 0);
  }
}, [user]); 