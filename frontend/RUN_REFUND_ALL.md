# How to Run Refund All Escrows

## ✅ Route Status
- ✅ Route is accessible at `/api/escrow/refund-all`
- ✅ Server is running on port 3000
- ✅ Route requires authentication (401 response is expected)

## 🚀 Quick Run (Browser Console)

1. **Open your app in browser** (make sure you're logged in)
2. **Open Browser Console** (F12 or Cmd+Option+I)
3. **Paste and run this code:**

```javascript
// Refund all escrows automatically
fetch('/api/escrow/refund-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'  // This sends your session cookie
})
.then(response => response.json())
.then(data => {
  console.log('📊 Refund Results:', data);
  if (data.success) {
    console.log(`✅ Successfully refunded ${data.summary.successful} escrows`);
    console.log(`❌ Failed: ${data.summary.failed} escrows`);
    console.log('📋 Details:', data.results);
  } else {
    console.error('❌ Error:', data.error);
  }
})
.catch(error => {
  console.error('❌ Request failed:', error);
});
```

## 🔧 With Specific Escrow IDs

If you know the escrow IDs you want to refund:

```javascript
fetch('/api/escrow/refund-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    escrowIds: [
      "SVC_1234567890_ABC:1",
      "SVC_1234567890_ABC:2",
      "your-escrow-id-here"
    ]
  })
})
.then(response => response.json())
.then(data => {
  console.log('📊 Results:', data);
})
.catch(console.error);
```

## 📋 Expected Response

```json
{
  "success": true,
  "summary": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "totalRefunded": 4
  },
  "results": [
    {
      "escrowId": "SVC_123:1",
      "success": true,
      "blockIndex": 12345678
    },
    {
      "escrowId": "SVC_123:2",
      "success": false,
      "error": "Already refunded"
    }
  ],
  "message": "Processed 5 escrows. 4 refunded successfully, 1 failed."
}
```

## ⚠️ Requirements

Before running, make sure:
- ✅ You are logged in
- ✅ Your wallet is connected in your profile
- ✅ Environment variables are set (NEXT_PUBLIC_ESCROW_CANISTER_ID)

## 🐛 Troubleshooting

**Error: "Not authenticated"**
- Make sure you're logged in
- Check browser console for session issues

**Error: "User wallet not connected"**
- Go to profile settings and connect your wallet
- Make sure wallet principal is saved

**Error: "No escrow IDs found"**
- Provide escrow IDs manually in the request body
- Or check if you have any bookings

**Error: "NEXT_PUBLIC_ESCROW_CANISTER_ID is required"**
- Set this in your environment variables
- Restart your Next.js server


