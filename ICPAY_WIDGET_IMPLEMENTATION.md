# ICPay Widget Implementation

## Overview
This document describes the simplified ICPay payment integration using the official `@ic-pay/icpay-widget` package. The widget provides a complete, pre-built payment solution that handles wallet connection, payment processing, and transaction management automatically.

## Architecture

### 1. Widget Component
**File:** `frontend/components/payment/ICPayWidget.tsx`

This is a React wrapper component for the ICPay Web Component:

```typescript
<ICPayWidget
  amountUsd={100.00}
  onSuccess={(paymentData) => console.log('Payment successful!', paymentData)}
  onError={(error) => console.error('Payment failed:', error)}
  metadata={{ orderId: '123', clientEmail: 'user@example.com' }}
/>
```

**Features:**
- Handles wallet connection (Plug, Internet Identity, Oisy)
- Manages payment flow automatically
- Supports multiple cryptocurrencies (ICP, ckUSDC, ckBTC, ckETH)
- Built-in currency dropdown
- Event-driven architecture for success/error handling

**Props:**
- `amountUsd`: USD amount to charge
- `metadata`: Custom data to attach to the payment
- `onSuccess`: Callback when payment succeeds
- `onError`: Callback when payment fails
- `buttonLabel`: Custom button text (default: "Pay ${amount} with {symbol}")
- `defaultSymbol`: Default cryptocurrency (default: 'ICP')
- `showLedgerDropdown`: Control dropdown visibility ('always' | 'none' | 'auto')
- `cryptoOptions`: Array of supported cryptocurrencies

### 2. Payment Page
**File:** `frontend/app/client/payment/[id]/page.tsx`

Simplified payment flow:

1. **Display Order Summary** - Shows service details, package selection, and upsells
2. **Show ICPay Widget** - Widget handles all payment logic
3. **Handle Success** - When widget emits success event, confirm booking with backend
4. **Show Confirmation** - Display payment success page

**Key Functions:**
- `handlePaymentSuccess(paymentData)`: Called by widget on successful payment
  - Extracts transaction details from widget event
  - Confirms payment with backend API
  - Creates booking
  - Navigates to success page

- `handlePaymentError(error)`: Called by widget on payment failure
  - Displays error message to user
  - Allows retry

### 3. Global Styles
**File:** `frontend/app/globals.css`

The widget requires its CSS to be imported:

```css
@import '@ic-pay/icpay-widget';
```

This loads the widget's pre-built styles, ensuring proper appearance and responsive behavior.

## Payment Flow

### User Journey
1. User selects service package and any upsells
2. User enters special instructions (optional)
3. User applies promo code (optional)
4. User clicks the ICPay widget button
5. Widget opens wallet connection modal
6. User connects wallet (Plug/II/Oisy)
7. Widget displays payment details and requests confirmation
8. User approves transaction in their wallet
9. Widget processes payment on-chain
10. Widget emits success event
11. App confirms booking with backend
12. Success page displayed with transaction details

### Error Handling
The widget handles most errors automatically:
- Wallet connection failures
- Insufficient balance
- Transaction rejections
- Network errors

If an error occurs, the widget emits an error event and the app displays a user-friendly message.

## API Integration

### Payment Confirmation Endpoint
**File:** `frontend/app/api/payment/confirm/route.ts`

When the widget succeeds, the payment page calls this endpoint:

```typescript
POST /api/payment/confirm
{
  "transactionId": "abc123...",
  "amount": 100.00,
  "currency": "USD",
  "tokenSymbol": "ICP",
  "tokenAmount": "10.5",
  "paymentStatus": "succeeded",
  "serviceId": "service_xyz",
  "packageId": "pkg_123",
  "clientId": "client@example.com",
  "freelancerEmail": "freelancer@example.com",
  "metadata": { ... }
}
```

This endpoint:
1. Verifies the transaction with ICPay (optional, for extra security)
2. Creates a booking in the database
3. Returns booking confirmation

### Webhook Endpoint (Optional)
**File:** `frontend/app/api/payment/webhook/route.ts`

ICPay can send webhook events for asynchronous payment updates:

```typescript
POST /api/payment/webhook
Headers: x-icpay-signature
Body: { event, data, timestamp }
```

This provides redundancy and ensures no payments are missed even if the user closes their browser.

## Configuration

### Environment Variables

**Frontend (.env.local):**
```bash
# Required
NEXT_PUBLIC_ICPAY_PUBLISHABLE_KEY=pk_JMbPYS85H4ukGGsNNknPgnn3vT4MbS7q

# Optional
NEXT_PUBLIC_IC_HOST=https://icp0.io
NEXT_PUBLIC_MARKETPLACE_CANISTER_ID=your_canister_id
```

**Backend:**
```bash
# Required for webhook verification
ICPAY_SECRET_KEY=sk_NRt8RFiZ9CeBZAuxsfF0G2EDYSMHvoP5

# Optional
ICPAY_API_URL=https://api.icpay.org
```

## Widget Configuration

The widget is configured in the wrapper component with:

```typescript
config = {
  publishableKey: process.env.NEXT_PUBLIC_ICPAY_PUBLISHABLE_KEY,
  amountUsd: 100.00,
  buttonLabel: 'Pay ${amount} with {symbol}',
  defaultSymbol: 'ICP',
  showLedgerDropdown: 'always',
  cryptoOptions: [
    { symbol: 'ICP', label: 'Internet Computer' },
    { symbol: 'ckUSDC', label: 'Chain Key USDC' },
    { symbol: 'ckBTC', label: 'Chain Key Bitcoin' },
    { symbol: 'ckETH', label: 'Chain Key Ethereum' }
  ],
  metadata: { ... }
}
```

## Advantages of Widget Approach

### Simplicity
- **Before:** 500+ lines of payment logic, event listeners, state management
- **After:** Simple widget component with success/error callbacks

### Maintenance
- Widget updates automatically with npm package updates
- No need to manage wallet SDKs or payment flows
- ICPay team handles security patches and bug fixes

### User Experience
- Consistent UI across all ICPay implementations
- Optimized for mobile and desktop
- Built-in loading states and error messages
- Tested wallet integrations

### Security
- Widget runs in isolated context
- No sensitive keys in frontend code
- Payment processing happens in ICPay infrastructure
- Backend verification via webhooks

## Testing

### Manual Testing
1. Navigate to payment page: `http://localhost:3000/client/payment/{serviceId}?packageId={pkgId}`
2. Verify widget appears with correct amount
3. Click widget button to trigger wallet connection
4. Select a wallet and authenticate
5. Approve test transaction
6. Verify success callback fires
7. Verify booking is created
8. Check success page displays correct details

### Error Testing
1. Try payment with insufficient balance
2. Reject wallet transaction
3. Disconnect wallet mid-payment
4. Test with invalid metadata
5. Verify error messages display correctly

## Troubleshooting

### Widget Not Appearing
- Check that CSS import is present in `globals.css`
- Verify `NEXT_PUBLIC_ICPAY_PUBLISHABLE_KEY` is set
- Check browser console for errors
- Ensure `@ic-pay/icpay-widget` is installed

### Payment Not Completing
- Verify wallet is connected and funded
- Check network connectivity
- Review ICPay dashboard for transaction status
- Check backend logs for confirmation errors

### Styling Issues
- Widget styles can be customized via CSS variables
- Check for conflicting global styles
- Verify Tailwind isn't resetting widget styles
- Use browser DevTools to inspect widget shadow DOM

## Migration Notes

### Removed Components
The following components are no longer needed with the widget approach:
- `PaymentMethodSelector.tsx` - Widget has built-in UI
- `LedgerSelector.tsx` - Widget has dropdown
- `PaymentModeToggle.tsx` - Widget handles USD conversion
- `icpay-client.ts` - Widget manages SDK internally

### Simplified State
The payment page no longer needs:
- `walletConnected` state
- `connectedWallet` state
- `selectedToken` state
- `paymentMode` state
- ICPay event listeners

All wallet and payment state is managed internally by the widget.

## Resources

- **ICPay Documentation:** https://docs.icpay.org/sdk
- **Widget NPM Package:** https://www.npmjs.com/package/@ic-pay/icpay-widget
- **ICPay Dashboard:** https://dashboard.icpay.org
- **Support:** support@icpay.org

## Future Enhancements

1. **Custom Styling:** Add CSS variables to match app theme
2. **Analytics:** Track payment conversion rates
3. **Multi-Currency:** Support additional cryptocurrencies
4. **Recurring Payments:** Implement subscription model
5. **Refunds:** Add refund flow via ICPay API
6. **Partial Payments:** Support milestone-based payments

