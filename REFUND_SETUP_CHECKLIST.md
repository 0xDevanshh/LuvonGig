# Refund All Escrows - Setup Checklist

## ✅ Code Status
- ✅ Route file created: `/frontend/app/api/escrow/refund-all/route.ts`
- ✅ No linting errors
- ✅ All imports are correct
- ✅ TypeScript types are valid

## 🔧 Required Setup (From Your Side)

### 1. Environment Variables
Make sure these are set in your `.env.local` file:

```bash
NEXT_PUBLIC_ESCROW_CANISTER_ID=your-escrow-canister-id
NEXT_PUBLIC_IC_HOST=https://icp0.io  # or your IC host
```

**Check if set:**
```bash
cd frontend
grep NEXT_PUBLIC_ESCROW_CANISTER_ID .env.local
grep NEXT_PUBLIC_IC_HOST .env.local
```

### 2. Server Must Be Running
```bash
cd frontend
npm run dev
# Server should be running on http://localhost:3000
```

### 3. Authentication Required
- You must be logged in
- Your session cookie must be valid
- Your user profile must have a wallet principal connected

### 4. Wallet Connection
- Your wallet must be connected in your profile
- The wallet principal must match the escrow client principal

## 🧪 How to Test

### Option 1: Using Browser Console
1. Open your app in browser (logged in)
2. Open browser console (F12)
3. Run:
```javascript
fetch('/api/escrow/refund-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Option 2: Using curl (with session cookie)
```bash
# First, get your session cookie from browser DevTools > Application > Cookies
curl -X POST http://localhost:3000/api/escrow/refund-all \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here"
```

### Option 3: With Specific Escrow IDs
```bash
curl -X POST http://localhost:3000/api/escrow/refund-all \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{
    "escrowIds": [
      "SVC_1234567890_ABC:1",
      "SVC_1234567890_ABC:2"
    ]
  }'
```

## 📋 What the Route Does

1. ✅ Gets your session and verifies authentication
2. ✅ Gets your wallet principal from user profile
3. ✅ Fetches all your bookings from marketplace canister
4. ✅ Extracts escrow IDs from bookings (payment_id, transaction_id, service_id)
5. ✅ For each escrow:
   - Verifies you are the client (owner)
   - Checks if already refunded/released
   - Checks if funds are available
   - Calls refund function
6. ✅ Returns summary with results for each escrow

## ⚠️ Important Notes

- **Only refunds escrows where you are the client**
- **Skips already refunded/released escrows**
- **Processes escrows sequentially (1 second delay between each)**
- **Returns detailed results for each escrow**

## 🐛 Troubleshooting

### Error: "NEXT_PUBLIC_ESCROW_CANISTER_ID is required"
- Set the environment variable in `.env.local`
- Restart your Next.js server

### Error: "Not authenticated"
- Make sure you're logged in
- Check your session cookie is valid

### Error: "User wallet not connected"
- Connect your wallet in your profile settings
- Make sure wallet principal is saved

### Error: "No escrow IDs found"
- The route couldn't find escrows from your bookings
- Provide escrow IDs manually in request body:
  ```json
  { "escrowIds": ["escrow-id-1", "escrow-id-2"] }
  ```

### Error: "Not authorized - you are not the client"
- You can only refund escrows where you are the client
- This escrow belongs to a different user

## ✅ Ready to Use!

The route is ready to use. Just make sure:
1. ✅ Environment variables are set
2. ✅ Server is running
3. ✅ You're logged in
4. ✅ Wallet is connected in profile

Then call: `POST /api/escrow/refund-all`


