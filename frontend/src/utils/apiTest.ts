import axios from 'axios';
// @ts-ignore - Will be used in future API tests
import { bookApi } from '../services/api';

/**
 * This script tests connectivity with the backend API
 * Used for debugging API issues and verifying deployment
 */
export async function testApiConnection() {
  console.log('🔄 Testing API connection...');
  try {
    // Test basic backend connectivity
    const baseUrl = import.meta.env.VITE_API_URL || 'https://book-database-backend.onrender.com/api';
    console.log(`📡 Attempting to connect to API at: ${baseUrl}`);
    
    // Make a basic request to the stats endpoint
    const response = await axios.get(`${baseUrl}/books/stats`);
    
    console.log('✅ API connection successful!');
    console.log('📊 Book statistics from API:');
    console.log(`  - Total books: ${response.data.totalBooks}`);
    console.log(`  - Read books: ${response.data.readBooks}`);
    console.log(`  - Currently reading: ${response.data.readingBooks}`);
    console.log(`  - To read: ${response.data.toReadBooks}`);
    
    return {
      success: true,
      data: response.data,
      message: 'API connection successful',
    };
  } catch (error) {
    console.error('❌ API connection failed:');
    if (axios.isAxiosError(error)) {
      console.error(`  - Status: ${error.response?.status}`);
      console.error(`  - Message: ${error.message}`);
      console.error(`  - Response: ${JSON.stringify(error.response?.data || {})}`);
    } else {
      console.error(`  - Error: ${error}`);
    }
    
    return {
      success: false,
      error,
      message: 'API connection failed',
    };
  }
}

// Execute the test if running this file directly
if (typeof window !== 'undefined' && window.location.search.includes('test=api')) {
  console.log('📋 Running API test from URL parameter...');
  testApiConnection().then(result => {
    // Display results in a visible way on the page
    const testResultsDiv = document.createElement('div');
    testResultsDiv.style.position = 'fixed';
    testResultsDiv.style.top = '0';
    testResultsDiv.style.left = '0';
    testResultsDiv.style.right = '0';
    testResultsDiv.style.padding = '20px';
    testResultsDiv.style.background = result.success ? '#d1fae5' : '#fee2e2';
    testResultsDiv.style.borderBottom = `1px solid ${result.success ? '#10b981' : '#ef4444'}`;
    testResultsDiv.style.zIndex = '9999';
    testResultsDiv.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    
    const heading = document.createElement('h2');
    heading.textContent = result.success ? '✅ API Connection Successful' : '❌ API Connection Failed';
    heading.style.margin = '0 0 10px 0';
    heading.style.fontWeight = 'bold';
    
    const message = document.createElement('pre');
    message.textContent = JSON.stringify(result.success ? result.data : result.error, null, 2);
    message.style.overflow = 'auto';
    message.style.maxHeight = '300px';
    message.style.background = '#f1f5f9';
    message.style.padding = '10px';
    message.style.borderRadius = '4px';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.background = result.success ? '#10b981' : '#ef4444';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => document.body.removeChild(testResultsDiv);
    
    testResultsDiv.appendChild(heading);
    testResultsDiv.appendChild(message);
    testResultsDiv.appendChild(closeButton);
    
    document.body.appendChild(testResultsDiv);
  });
}
