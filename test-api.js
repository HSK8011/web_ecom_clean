import axios from 'axios';

async function testProductsAPI() {
  try {
    console.log('Fetching products from API...');
    const response = await axios.get('http://localhost:5000/api/products?limit=100');
    
    console.log(`Fetched ${response.data.products ? response.data.products.length : 'unknown'} products`);
    
    // Check if the orange shirt2 product is in the response
    const orangeShirt2 = response.data.products ? 
      response.data.products.find(p => p.title === 'orange shirt2' || p.name === 'orange shirt2') : null;
    
    console.log('Orange shirt2 found in API response:', orangeShirt2 ? 'Yes' : 'No');
    
    if (orangeShirt2) {
      console.log('Orange shirt2 details:', {
        id: orangeShirt2._id,
        title: orangeShirt2.title || orangeShirt2.name,
        brand: orangeShirt2.brand,
        countInStock: orangeShirt2.countInStock
      });
    } else {
      console.log('Orange shirt2 not found in response. Checking response data structure...');
      console.log('Response structure:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
      
      // List all products to check what's being returned
      console.log('\nAll product names from response:');
      if (response.data.products) {
        response.data.products.forEach(p => {
          console.log(`- ${p.name || p.title} (ID: ${p._id})`);
        });
      }
    }
    
    // Try to fetch just the orange shirt2 product by ID
    try {
      console.log('\nFetching orange shirt2 by ID from database...');
      const productId = '67fe44c2f64cdb1cf757f377'; // ID from MongoDB
      const productResponse = await axios.get(`http://localhost:5000/api/products/${productId}`);
      console.log('Product by ID response:', productResponse.data);
    } catch (error) {
      console.error('Error fetching product by ID:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.statusText);
        console.error('Error data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('API test failed:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.statusText);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server. Check if server is running at the correct port.');
    } else {
      console.error('Error details:', error);
    }
  }
}

testProductsAPI(); 