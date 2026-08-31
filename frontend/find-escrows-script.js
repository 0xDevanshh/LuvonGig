// Run this script in your browser console (F12) while logged in
// It will search for all your escrows

(async function findMyEscrows() {
  console.log('🔍 Starting comprehensive escrow search...\n');
  
  // Step 1: Get your bookings to find service IDs
  console.log('📋 Step 1: Getting your bookings...');
  let serviceIds = [];
  
  try {
    const sessionResponse = await fetch('/api/auth/session', { credentials: 'include' });
    const session = await sessionResponse.json();
    
    if (session.success && session.session) {
      const userId = session.session.email || session.session.userId;
      console.log('👤 User ID:', userId);
      
      const bookingsResponse = await fetch(
        `/api/marketplace/bookings?user_id=${userId}&user_type=client`,
        { credentials: 'include' }
      );
      const bookings = await bookingsResponse.json();
      
      if (bookings.success && bookings.data) {
        serviceIds = [...new Set(bookings.data.map(b => b.service_id).filter(Boolean))];
        console.log(`✅ Found ${serviceIds.length} unique service IDs\n`);
      }
    }
  } catch (error) {
    console.error('❌ Error getting bookings:', error);
  }
  
  // Step 2: Search for escrows using service IDs
  console.log('🔍 Step 2: Searching for escrows...');
  const foundEscrows = [];
  
  for (const serviceId of serviceIds) {
    console.log(`\n  Checking service: ${serviceId}`);
    
    // Try numbers 0-50 for each service ID
    for (let i = 0; i <= 50; i++) {
      const escrowId = `${serviceId}:${i}`;
      
      try {
        const response = await fetch(`/api/escrow/${escrowId}/get`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            foundEscrows.push({
              escrowId: escrowId,
              projectId: data.data.projectId,
              status: data.data.status,
              expectedE8s: data.data.expectedE8s,
            });
            console.log(`    ✅ Found: ${escrowId}`);
          }
        }
      } catch (error) {
        // Escrow doesn't exist - continue
      }
      
      // Small delay to avoid rate limiting
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  // Step 3: Display results
  console.log('\n📊 Search Results:');
  console.log(`Found ${foundEscrows.length} escrows:\n`);
  
  if (foundEscrows.length > 0) {
    foundEscrows.forEach((escrow, index) => {
      console.log(`${index + 1}. ${escrow.escrowId}`);
      console.log(`   Project: ${escrow.projectId}`);
      console.log(`   Status: ${escrow.status}`);
      console.log(`   Amount: ${Number(escrow.expectedE8s) / 100000000} ICP\n`);
    });
    
    // Save to window for easy access
    window.myEscrowIds = foundEscrows.map(e => e.escrowId);
    console.log('💾 Escrow IDs saved to window.myEscrowIds');
    console.log('\n📝 To refund all, run:');
    console.log(`
fetch('/api/escrow/refund-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ escrowIds: window.myEscrowIds })
})
.then(r => r.json())
.then(console.log);
    `);
  } else {
    console.log('❌ No escrows found. Try:');
    console.log('1. Check browser Network tab for escrow creation responses');
    console.log('2. Check "My Projects" page for escrow IDs');
    console.log('3. Check your wallet transaction history');
  }
})();


