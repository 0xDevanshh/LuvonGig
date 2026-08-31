# How to Find Your Escrow IDs

## The Problem
The escrow canister doesn't have a function to list all escrows, so we need to know the escrow IDs to access them. Escrow IDs are in format: `projectId:number` (e.g., `SVC_1234567890_ABC:1`)

## Ways to Find Your Escrow IDs

### Method 1: Check Browser Console/Network Tab
When you created escrows, the escrow IDs were returned. Check:

1. **Browser Console History:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for messages containing "escrowId" or "Escrow created"

2. **Network Tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Filter by "escrow"
   - Look for POST requests to `/api/escrow/create`
   - Check the response - it contains `escrowId`

### Method 2: Check "My Projects" Page
Your escrow IDs might be displayed on the projects page. Look for:
- Escrow account addresses
- Payment IDs
- Transaction IDs

### Method 3: Check Browser Storage
Run this in browser console:

```javascript
// Check localStorage
console.log('LocalStorage:', {...localStorage});

// Check sessionStorage  
console.log('SessionStorage:', {...sessionStorage});

// Search for escrow-related keys
Object.keys(localStorage).filter(k => k.toLowerCase().includes('escrow'))
Object.keys(sessionStorage).filter(k => k.toLowerCase().includes('escrow'))
```

### Method 4: Try Common Patterns
If you know the service ID or project ID you used, try these patterns:

```javascript
// Replace 'YOUR_SERVICE_ID' with your actual service ID
const serviceId = 'YOUR_SERVICE_ID'; // e.g., 'SVC_1234567890_ABC'
const escrowIds = [];

// Try numbers 0-50
for (let i = 0; i <= 50; i++) {
  escrowIds.push(`${serviceId}:${i}`);
}

// Then test them
escrowIds.forEach(async (id) => {
  try {
    const response = await fetch(`/api/escrow/${id}/get`, {
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      console.log('✅ Found escrow:', id, data);
    }
  } catch (e) {
    // Not found
  }
});
```

### Method 5: Check Your Wallet Transactions
1. Open your Plug wallet
2. Go to Transactions/History
3. Look for transactions to the escrow canister
4. The memo or transaction details might contain escrow IDs

### Method 6: Manual Search Script
Run this in browser console to search for escrows:

```javascript
// Get your service IDs from bookings first
fetch('/api/marketplace/bookings?user_id=YOUR_EMAIL&user_type=client', {
  credentials: 'include'
})
.then(r => r.json())
.then(async (data) => {
  if (data.success && data.data) {
    const serviceIds = [...new Set(data.data.map(b => b.service_id).filter(Boolean))];
    console.log('Service IDs found:', serviceIds);
    
    // Try to find escrows for each service ID
    for (const serviceId of serviceIds) {
      console.log(`\n🔍 Checking service: ${serviceId}`);
      for (let i = 0; i <= 20; i++) {
        const escrowId = `${serviceId}:${i}`;
        try {
          const response = await fetch(`/api/escrow/${escrowId}/get`, {
            credentials: 'include'
          });
          const escrowData = await response.json();
          if (escrowData.success) {
            console.log(`✅ Found: ${escrowId}`, escrowData);
          }
        } catch (e) {
          // Not found
        }
      }
    }
  }
});
```

## Once You Have Escrow IDs

Use the refund route with your escrow IDs:

```javascript
fetch('/api/escrow/refund-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    escrowIds: [
      "SVC_123:0",
      "SVC_123:1",
      "your-escrow-id-here"
    ]
  })
})
.then(r => r.json())
.then(console.log);
```


