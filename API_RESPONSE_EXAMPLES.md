# API Response Examples

This document shows the expected API responses for service creation and booking with the updated authentication system.

---

## 1. Create Service API Response

### Endpoint: `POST /api/marketplace/services`

### Request Body:
```json
{
  "userEmail": "freelancer@example.com",
  "serviceData": {
    "title": "Professional Web Development Services",
    "main_category": "Web Development",
    "sub_category": "Full Stack Development",
    "description": "I will build your modern web application using React, Node.js, and MongoDB",
    "whats_included": "- Source code\n- Documentation\n- 30 days support\n- Deployment assistance",
    "tags": ["React", "Node.js", "MongoDB", "Full Stack"],
    "packages": [
      {
        "title": "Basic",
        "description": "Simple landing page",
        "price_e8s": 500000000,
        "delivery_days": 7,
        "delivery_timeline": "7 days",
        "revisions_included": 2,
        "features": ["1 Page", "Responsive Design", "Basic SEO"]
      },
      {
        "title": "Standard",
        "description": "Multi-page website",
        "price_e8s": 1000000000,
        "delivery_days": 14,
        "delivery_timeline": "14 days",
        "revisions_included": 3,
        "features": ["5 Pages", "Responsive Design", "SEO Optimized", "Contact Form"]
      },
      {
        "title": "Premium",
        "description": "Full web application",
        "price_e8s": 2000000000,
        "delivery_days": 21,
        "delivery_timeline": "21 days",
        "revisions_included": 5,
        "features": ["10+ Pages", "Custom Backend", "Database Integration", "Admin Panel", "API Integration"]
      }
    ]
  }
}
```

### Success Response (200 OK):
```json
{
  "success": true,
  "data": {
    "service_id": "SVC_1730000000000_AB12CD34EF",
    "freelancer_id": "freelancer@example.com",
    "freelancer_email": "freelancer@example.com",
    "title": "Professional Web Development Services",
    "main_category": "Web Development",
    "sub_category": "Full Stack Development",
    "description": "I will build your modern web application using React, Node.js, and MongoDB",
    "whats_included": "- Source code\n- Documentation\n- 30 days support\n- Deployment assistance",
    "status": "Active",
    "created_at": 1730000000000,
    "updated_at": 1730000000000,
    "delivery_time_days": 7,
    "starting_from_e8s": 500000000,
    "total_rating": 0.0,
    "review_count": 0,
    "tags": ["React", "Node.js", "MongoDB", "Full Stack"],
    "packages": [
      {
        "package_id": "PKG_1730000000001_XY98ZW76AB",
        "service_id": "SVC_1730000000000_AB12CD34EF",
        "name": "Basic",
        "description": "Simple landing page",
        "price_e8s": 500000000,
        "delivery_time_days": 7,
        "delivery_timeline": "7 days",
        "revisions": 2,
        "features": ["1 Page", "Responsive Design", "Basic SEO"],
        "is_active": true,
        "created_at": 1730000000001
      },
      {
        "package_id": "PKG_1730000000002_MN54OP32QR",
        "service_id": "SVC_1730000000000_AB12CD34EF",
        "name": "Standard",
        "description": "Multi-page website",
        "price_e8s": 1000000000,
        "delivery_time_days": 14,
        "delivery_timeline": "14 days",
        "revisions": 3,
        "features": ["5 Pages", "Responsive Design", "SEO Optimized", "Contact Form"],
        "is_active": true,
        "created_at": 1730000000002
      },
      {
        "package_id": "PKG_1730000000003_ST76UV98WX",
        "service_id": "SVC_1730000000000_AB12CD34EF",
        "name": "Premium",
        "description": "Full web application",
        "price_e8s": 2000000000,
        "delivery_time_days": 21,
        "delivery_timeline": "21 days",
        "revisions": 5,
        "features": ["10+ Pages", "Custom Backend", "Database Integration", "Admin Panel", "API Integration"],
        "is_active": true,
        "created_at": 1730000000003
      }
    ]
  },
  "message": "Service created successfully"
}
```

### Error Response (401 Unauthorized):
```json
{
  "success": false,
  "error": "User email is required. Please log in."
}
```

### Error Response (400 Bad Request):
```json
{
  "success": false,
  "error": "Service data is required"
}
```

---

## 2. Create Booking API Response

### Endpoint: `POST /api/marketplace/bookings`

### Request Body:
```json
{
  "clientId": "client@example.com",
  "packageId": "PKG_1730000000001_XY98ZW76AB",
  "specialInstructions": "Please include a dark mode toggle and integrate with my existing API",
  "paymentMethod": "credit-card",
  "totalAmount": 5.0,
  "upsells": [
    {
      "id": "upsell_001",
      "name": "Extra Fast Delivery",
      "price_e8s": 50000000,
      "category": "delivery"
    },
    {
      "id": "upsell_002",
      "name": "Additional Revisions",
      "price_e8s": 25000000,
      "category": "revisions"
    }
  ],
  "promoCode": "FIRST10",
  "paymentId": "pi_3OBx8t2eZvKYlo2C0123456",
  "transactionId": "txn_1730000000000"
}
```

### Success Response (200 OK):
```json
{
  "success": true,
  "data": {
    "booking_id": "BK_1730000000000_QW12ER34TY",
    "service_id": "SVC_1730000000000_AB12CD34EF",
    "package_id": "PKG_1730000000001_XY98ZW76AB",
    "client_id": "client@example.com",
    "freelancer_id": "freelancer@example.com",
    
    // Basic booking info
    "title": "Professional Web Development Services",
    "description": "Please include a dark mode toggle and integrate with my existing API",
    "status": "Active",
    "payment_status": "HeldInEscrow",
    "currency": "ICP",
    
    // Timestamps (nanoseconds)
    "created_at": 1730000000000000000,
    "updated_at": 1730000000000000000,
    "booking_confirmed_at": 1730000000000000000,
    "payment_completed_at": 1730000000000000000,
    "delivery_deadline": 1730604800000000000,
    "work_started_at": null,
    "work_completed_at": null,
    "client_reviewed_at": null,
    "freelancer_reviewed_at": null,
    
    // Human-readable timestamps
    "created_at_readable": "2025-01-01T12:00:00.Z",
    "booking_confirmed_at_readable": "2025-01-01T12:00:00.Z",
    "payment_completed_at_readable": "2025-01-01T12:00:00.Z",
    "delivery_deadline_readable": "2025-01-08T12:00:00.Z",
    
    // Time tracking
    "delivery_days": 7,
    "time_remaining_hours": 168,
    "deadline": 1730604800000000000,
    
    // User details (with authentication)
    "client_name": "client@example.com",
    "freelancer_name": "freelancer@example.com",
    
    // Package details
    "package_title": "Basic",
    "package_description": "Simple landing page",
    "package_tier": "basic",
    "package_revisions": 2,
    "package_features": ["1 Page", "Responsive Design", "Basic SEO"],
    
    // Payment breakdown
    "base_amount_e8s": 500000000,
    "platform_fee_e8s": 25000000,
    "total_amount_e8s": 525000000,
    "escrow_amount_e8s": 500000000,
    "payment_method": "credit-card",
    "payment_id": "pi_3OBx8t2eZvKYlo2C0123456",
    "transaction_id": "txn_1730000000000",
    
    // Upsells and discounts
    "upsells": [
      {
        "id": "upsell_001",
        "name": "Extra Fast Delivery",
        "price_e8s": 50000000,
        "category": "delivery"
      },
      {
        "id": "upsell_002",
        "name": "Additional Revisions",
        "price_e8s": 25000000,
        "category": "revisions"
      }
    ],
    "promo_code": "FIRST10",
    "discount_amount_e8s": 52500000,
    
    // Additional fields
    "special_instructions": "Please include a dark mode toggle and integrate with my existing API",
    "requirements": [],
    "milestones": [],
    "current_milestone": null,
    "client_review": null,
    "client_rating": null,
    "freelancer_review": null,
    "freelancer_rating": null,
    "dispute_id": null,
    "ledger_deposit_block": 12345,
    
    // Escrow details
    "escrow_account": "ulvla-h7777-77774-qaacq-cai",
    "amount_e8s": 500000000,
    "ledger_block": 12345
  },
  "message": "Booking created successfully"
}
```

### Success Response - Simplified Version (from bookPackage canister method):
```json
{
  "success": true,
  "data": {
    "booking_id": "BK_1730000000000_QW12ER34TY",
    "escrow_account": "ulvla-h7777-77774-qaacq-cai",
    "amount_e8s": 500000000,
    "ledger_block": 12345
  }
}
```

### Error Response (401 Unauthorized):
```json
{
  "success": false,
  "error": "User email is required. Please log in."
}
```

### Error Response (400 Bad Request - Package not found):
```json
{
  "success": false,
  "error": {
    "NotFound": "Package not found"
  }
}
```

### Error Response (400 Bad Request - Service not found):
```json
{
  "success": false,
  "error": {
    "NotFound": "Service not found"
  }
}
```

---

## 3. Get Booking by ID

### Endpoint: `GET /api/marketplace/bookings/[bookingId]`

### Success Response (200 OK):
```json
{
  "success": true,
  "data": {
    "booking_id": "BK_1730000000000_QW12ER34TY",
    "service_id": "SVC_1730000000000_AB12CD34EF",
    "package_id": "PKG_1730000000001_XY98ZW76AB",
    "client_id": "client@example.com",
    "freelancer_id": "freelancer@example.com",
    "client_name": "John Doe",
    "freelancer_name": "Jane Smith",
    "title": "Professional Web Development Services",
    "status": "Active",
    "payment_status": "HeldInEscrow",
    "total_amount_e8s": 525000000,
    "created_at": 1730000000000000000,
    "delivery_deadline": 1730604800000000000,
    "time_remaining_hours": 168,
    "package_title": "Basic",
    "package_tier": "basic"
  }
}
```

---

## 4. List Bookings for Client

### Endpoint: `GET /api/marketplace/bookings?clientId=client@example.com&role=client`

### Success Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "booking_id": "BK_1730000000000_QW12ER34TY",
      "service_id": "SVC_1730000000000_AB12CD34EF",
      "title": "Professional Web Development Services",
      "status": "Active",
      "payment_status": "HeldInEscrow",
      "total_amount_e8s": 525000000,
      "freelancer_name": "Jane Smith",
      "created_at": 1730000000000000000,
      "delivery_deadline": 1730604800000000000
    },
    {
      "booking_id": "BK_1730000000001_AS45DF67GH",
      "service_id": "SVC_1730000000005_JK89LM01NO",
      "title": "Mobile App Development",
      "status": "Completed",
      "payment_status": "Released",
      "total_amount_e8s": 1050000000,
      "freelancer_name": "Bob Johnson",
      "created_at": 1729000000000000000,
      "delivery_deadline": 1729604800000000000
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 10,
    "offset": 0
  }
}
```

---

## Key Changes from Previous Version

### With Authentication:

1. **Service Creation**:
   - ✅ `freelancer_id` now contains the **authenticated user's email** (e.g., "freelancer@example.com")
   - ✅ `freelancer_email` field is populated with actual email
   - ❌ No more "anonymous" values

2. **Booking Creation**:
   - ✅ `client_id` uses the **logged-in user's email**
   - ✅ `client_name` starts with the user's email (can be enriched with profile name)
   - ✅ `freelancer_name` uses the service owner's email
   - ✅ Authorization checks ensure only authenticated users can book

3. **Error Handling**:
   - Returns `401 Unauthorized` if user is not logged in
   - Returns `400 Bad Request` if required data is missing
   - Better error messages for debugging

---

## Currency Conversion

**ICP e8s to ICP:**
- 1 ICP = 100,000,000 e8s (8 decimal places)
- Example: `500000000 e8s = 5.0 ICP`
- Example: `25000000 e8s = 0.25 ICP`

**Common Amounts:**
```
100000000 e8s    = 1.00 ICP
500000000 e8s    = 5.00 ICP
1000000000 e8s   = 10.00 ICP
2000000000 e8s   = 20.00 ICP
```

---

## Testing the APIs

### Using curl:

**Create Service (requires login):**
```bash
curl -X POST http://localhost:3000/api/marketplace/services \
  -H "Content-Type: application/json" \
  -H "Cookie: sid=YOUR_SESSION_TOKEN" \
  -d '{
    "userEmail": "freelancer@example.com",
    "serviceData": {
      "title": "Test Service",
      "main_category": "Web Development",
      "sub_category": "Frontend",
      "description": "Test description",
      "whats_included": "Test features",
      "tags": ["React", "TypeScript"],
      "packages": [...]
    }
  }'
```

**Create Booking (requires login):**
```bash
curl -X POST http://localhost:3000/api/marketplace/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: sid=YOUR_SESSION_TOKEN" \
  -d '{
    "packageId": "PKG_1730000000001_XY98ZW76AB",
    "specialInstructions": "Please deliver ASAP",
    "paymentMethod": "credit-card"
  }'
```

---

**Note**: All authenticated endpoints now require a valid session cookie (`sid`) or will return a 401 error.






