// Test script to verify API key validity
const https = require('https');

const API_KEY = 'AIzaSyBrfkNWuQFMuG51mZBTslCX6TEylXoIdVo';

// Try to list models using v1 API (not v1beta)
const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1/models?key=${API_KEY}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🔍 Testing API key validity...\n');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        console.log('✅ API Key is valid!');
        console.log(`📋 Found ${response.models?.length || 0} models`);
        
        if (response.models && response.models.length > 0) {
          console.log('\n🎯 Available models:');
          response.models.slice(0, 5).forEach((model, i) => {
            console.log(`${i + 1}. ${model.name}`);
          });
          
          if (response.models.length > 5) {
            console.log(`... and ${response.models.length - 5} more`);
          }
        }
      } catch (e) {
        console.log('✅ API Key is valid but response format unexpected');
        console.log('📄 Raw response:', data.substring(0, 200));
      }
    } else {
      console.log('❌ API Key validation failed');
      console.log('📄 Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request failed:', error.message);
});

req.end();