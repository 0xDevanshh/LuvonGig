# Refund All Escrows API

This route allows you to refund all escrow deposits you've made back to your wallet.

## Endpoint

```
POST /api/escrow/refund-all
```

## Authentication

You must be logged in (session required).

## Usage

### Option 1: Automatic (Recommended)
The route will automatically find all your escrows from your bookings:

```bash
curl -X POST http://localhost:3000/api/escrow/refund-all \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

### Option 2: Provide Escrow IDs Manually
If you know the escrow IDs, you can provide them directly:

```bash
curl -X POST http://localhost:3000/api/escrow/refund-all \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "escrowIds": [
      "SVC_1234567890_ABC:1",
      "SVC_1234567890_ABC:2",
      "project-id:3"
    ]
  }'
```

## Response

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
      "escrowId": "SVC_1234567890_ABC:1",
      "success": true,
      "blockIndex": 12345678
    },
    {
      "escrowId": "SVC_1234567890_ABC:2",
      "success": false,
      "error": "Already refunded"
    }
  ],
  "message": "Processed 5 escrows. 4 refunded successfully, 1 failed."
}
```

## How It Works

1. Gets your wallet principal from your user profile
2. Fetches all your bookings from the marketplace canister
3. Extracts escrow IDs from bookings (payment_id, transaction_id, service_id)
4. For each escrow:
   - Verifies you are the client (owner)
   - Checks if it's already refunded/released
   - Checks if there are funds to refund
   - Calls the refund function
5. Returns a summary of all refunds

## Notes

- Only escrows where you are the client can be refunded
- Already refunded or released escrows are skipped
- Escrows with no funds are skipped
- The route processes escrows sequentially with a 1-second delay between each

## Error Handling

If an escrow cannot be refunded, it will be included in the results with `success: false` and an error message. Common errors:
- "Not authorized - you are not the client for this escrow"
- "Already refunded"
- "Cannot refund - already released"
- "No funds to refund"
- "Escrow not found or error accessing"

