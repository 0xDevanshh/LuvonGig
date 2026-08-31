// Quick test script for refund-all API
// Run with: node test-refund-api.js

const fetch = require('node-fetch');

async function testRefundAll() {
  console.log('🧪 Testing Refund All Escrows API\n');
  
  try {
    // Test without authentication (will fail but shows route is accessible)
    const response = await fetch('http://localhost:3000/api/escrow/refund-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('\n✅ Route is working! You need to be authenticated.');
      console.log('   To test with authentication, use your browser console while logged in.');
    } else if (response.status === 500) {
      console.log('\n⚠️  Server error - check environment variables:');
      console.log('   - NEXT_PUBLIC_ESCROW_CANISTER_ID');
      console.log('   - NEXT_PUBLIC_IC_HOST');
    } else {
      console.log('\n✅ Route responded successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Next.js server is running (npm run dev)');
    console.log('2. Server is on http://localhost:3000');
  }
}

testRefundAll();


