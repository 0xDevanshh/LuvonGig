# Marketplace API Routes Documentation

## Overview

Complete REST API routes for the ICP Ledger Freelance Marketplace, providing CRUD operations for all marketplace entities with proper error handling and validation.

## Base URL
```
/api/marketplace
```

## Authentication
All routes require user authentication. User ID must be provided in request body or query parameters.

## API Endpoints

### Services Management

#### List Services
```http
GET /api/marketplace/services
```

**Query Parameters:**
- `category` (optional): Filter by main category
- `freelancer_id` (optional): Filter by freelancer ID
- `search_term` (optional): Full-text search
- `limit` (optional): Pagination limit (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```bash
curl "http://localhost:3000/api/marketplace/services?category=Web%20Design&search_term=UI&limit=20&offset=0"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "service_id": "SV-12345678",
      "freelancer_id": "USER123",
      "title": "UI/UX Design Services",
      "main_category": "Web Design",
      "sub_category": "UI/UX",
      "description": "Professional UI/UX design services",
      "status": "Active",
      "rating_avg": 4.8,
      "total_orders": 25
    }
  ],
  "count": 1
}
```

#### Create Service
```http
POST /api/marketplace/services
```

**Request Body:**
```json
{
  "userId": "USER123",
  "serviceData": {
    "title": "UI/UX Design Services",
    "main_category": "Web Design",
    "sub_category": "UI/UX",
    "description": "Professional UI/UX design services for web and mobile applications",
    "whats_included": "Wireframes, mockups, prototypes, style guide",
    "cover_image_url": "https://example.com/image.jpg",
    "portfolio_images": ["https://example.com/portfolio1.jpg"],
    "status": "Active"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "service_id": "SV-12345678",
    "freelancer_id": "USER123",
    "title": "UI/UX Design Services",
    "status": "Active",
    "created_at": 1704067200000000000,
    "updated_at": 1704067200000000000
  }
}
```

#### Get Service by ID
```http
GET /api/marketplace/services/[serviceId]
```

#### Update Service
```http
PUT /api/marketplace/services/[serviceId]
```

**Request Body:**
```json
{
  "userId": "USER123",
  "updates": {
    "title": "Updated Service Title",
    "description": "Updated description",
    "status": "Active"
  }
}
```

#### Delete Service
```http
DELETE /api/marketplace/services/[serviceId]
```

**Request Body:**
```json
{
  "userId": "USER123"
}
```

### Package Management

#### List Packages by Service
```http
GET /api/marketplace/packages?service_id=SV-12345678
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "package_id": "PK-12345678",
      "service_id": "SV-12345678",
      "tier": "Basic",
      "title": "Basic Website Design",
      "description": "Simple website design with 3 pages",
      "price_e8s": "5000000000",
      "delivery_days": 7,
      "features": ["3 pages", "Mobile responsive", "Basic SEO"],
      "revisions_included": 2,
      "status": "Available"
    }
  ],
  "count": 1
}
```

#### Create Package
```http
POST /api/marketplace/packages
```

**Request Body:**
```json
{
  "userId": "USER123",
  "packageData": {
    "service_id": "SV-12345678",
    "tier": "Basic",
    "title": "Basic Website Design",
    "description": "Simple website design with 3 pages",
    "price_e8s": "5000000000",
    "delivery_days": 7,
    "features": ["3 pages", "Mobile responsive", "Basic SEO"],
    "revisions_included": 2,
    "status": "Available"
  }
}
```

#### Get Package by ID
```http
GET /api/marketplace/packages/[packageId]
```

#### Update Package
```http
PUT /api/marketplace/packages/[packageId]
```

#### Delete Package
```http
DELETE /api/marketplace/packages/[packageId]
```

### Booking Management

#### List Bookings
```http
GET /api/marketplace/bookings?user_id=USER123&user_type=client&status=InProgress&limit=50&offset=0
```

**Query Parameters:**
- `user_id`: User ID (required)
- `user_type`: "client" or "freelancer" (required)
- `status` (optional): Filter by booking status
- `limit` (optional): Pagination limit (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": "BK-12345678",
      "package_id": "PK-12345678",
      "client_id": "USER123",
      "freelancer_id": "USER456",
      "total_price_e8s": "5250000000",
      "escrow_amount_e8s": "5000000000",
      "platform_fee_e8s": "250000000",
      "payment_status": "Funded",
      "booking_status": "InProgress",
      "special_instructions": "Please focus on mobile-first design",
      "ledger_deposit_block": "12345",
      "created_at": 1704067200000000000
    }
  ],
  "count": 1
}
```

#### Book Package
```http
POST /api/marketplace/bookings
```

**Request Body:**
```json
{
  "clientId": "USER123",
  "packageId": "PK-12345678",
  "specialInstructions": "Please focus on mobile-first design and ensure accessibility compliance"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": "BK-12345678",
    "escrow_account": "rdmx6-jaaaa-aaaah-qcaiq-cai",
    "amount_e8s": "5000000000",
    "ledger_block": "12345"
  }
}
```

#### Get Booking by ID
```http
GET /api/marketplace/bookings/[bookingId]
```

#### Cancel Booking
```http
PUT /api/marketplace/bookings/[bookingId]
```

**Request Body:**
```json
{
  "userId": "USER123",
  "reason": "Project requirements changed"
}
```

### Project Stages

#### List Stages for Booking
```http
GET /api/marketplace/stages?booking_id=BK-12345678
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "stage_id": "ST-12345678",
      "booking_id": "BK-12345678",
      "stage_number": 1,
      "title": "Wireframes",
      "description": "Create wireframes for all pages",
      "amount_e8s": "2000000000",
      "status": "Submitted",
      "submission_notes": "Wireframes completed for all 3 pages",
      "submission_artifacts": ["https://example.com/wireframes.pdf"],
      "submitted_at": 1704067200000000000
    }
  ],
  "count": 1
}
```

#### Create Stages
```http
POST /api/marketplace/stages
```

**Request Body:**
```json
{
  "freelancerId": "USER456",
  "bookingId": "BK-12345678",
  "stageDefinitions": [
    {
      "title": "Wireframes",
      "description": "Create wireframes for all pages",
      "amount_e8s": "2000000000"
    },
    {
      "title": "Design Mockups",
      "description": "High-fidelity design mockups",
      "amount_e8s": "3000000000"
    }
  ]
}
```

#### Get Stage by ID
```http
GET /api/marketplace/stages/[stageId]
```

#### Submit Stage
```http
PUT /api/marketplace/stages/[stageId]
```

**Request Body:**
```json
{
  "action": "submit",
  "userId": "USER456",
  "notes": "Wireframes completed for all 3 pages with mobile responsiveness",
  "artifacts": ["https://example.com/wireframes.pdf", "https://example.com/mobile-wireframes.pdf"]
}
```

#### Approve Stage
```http
PUT /api/marketplace/stages/[stageId]
```

**Request Body:**
```json
{
  "action": "approve",
  "userId": "USER123"
}
```

#### Reject Stage
```http
PUT /api/marketplace/stages/[stageId]
```

**Request Body:**
```json
{
  "action": "reject",
  "userId": "USER123",
  "reason": "Wireframes don't match the requirements. Please add more detail to the mobile version."
}
```

### Project Completion

#### Complete Project
```http
POST /api/marketplace/projects
```

**Request Body:**
```json
{
  "freelancerId": "USER456",
  "bookingId": "BK-12345678"
}
```

### Escrow Management

#### Get Escrow Balance
```http
GET /api/marketplace/escrow?booking_id=BK-12345678
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": "BK-12345678",
    "balance_e8s": "3000000000",
    "balance_icp": 30.0
  }
}
```

### Admin Operations

#### Refund to Client
```http
POST /api/marketplace/admin
```

**Request Body:**
```json
{
  "action": "refund",
  "adminId": "ADMIN123",
  "bookingId": "BK-12345678",
  "amount_e8s": "5000000000",
  "reason": "Client requested full refund due to project cancellation"
}
```

#### Reconcile Ledger
```http
POST /api/marketplace/admin
```

**Request Body:**
```json
{
  "action": "reconcile",
  "adminId": "ADMIN123",
  "startBlock": "1000",
  "endBlock": "2000"
}
```

### Statistics

#### Get Marketplace Stats
```http
GET /api/marketplace/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_services": 150,
    "total_packages": 450,
    "total_bookings": 89,
    "total_stages": 267,
    "total_transactions": 156
  }
}
```

### Events

#### Get Event Log
```http
GET /api/marketplace/events
```

**Response:**
```json
{
  "success": true,
  "data": [
    "[1704067200000000000] Service created: SV-12345678 by user: USER123",
    "[1704067200000000000] Booking created: BK-12345678 amount: 5000000000 block: 12345",
    "[1704067200000000000] Stage approved and funds released: ST-12345678"
  ],
  "count": 3
}
```

## Error Handling

All API routes return consistent error responses:

```json
{
  "success": false,
  "error": "Error message or error object"
}
```

### Common Error Types

- **400 Bad Request**: Invalid input data or missing required fields
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

### Example Error Response

```json
{
  "success": false,
  "error": {
    "NotFound": "Service not found"
  }
}
```

## Usage Examples

### Complete Booking Flow

1. **Browse Services**
```bash
curl "http://localhost:3000/api/marketplace/services?category=Web%20Design&limit=10"
```

2. **Get Packages for Service**
```bash
curl "http://localhost:3000/api/marketplace/packages?service_id=SV-12345678"
```

3. **Book Package**
```bash
curl -X POST "http://localhost:3000/api/marketplace/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "USER123",
    "packageId": "PK-12345678",
    "specialInstructions": "Please focus on mobile-first design"
  }'
```

4. **Create Project Stages**
```bash
curl -X POST "http://localhost:3000/api/marketplace/stages" \
  -H "Content-Type: application/json" \
  -d '{
    "freelancerId": "USER456",
    "bookingId": "BK-12345678",
    "stageDefinitions": [
      {
        "title": "Wireframes",
        "description": "Create wireframes for all pages",
        "amount_e8s": "2500000000"
      },
      {
        "title": "Design Mockups",
        "description": "High-fidelity design mockups",
        "amount_e8s": "2500000000"
      }
    ]
  }'
```

5. **Submit Stage Work**
```bash
curl -X PUT "http://localhost:3000/api/marketplace/stages/ST-12345678" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "submit",
    "userId": "USER456",
    "notes": "Wireframes completed for all pages",
    "artifacts": ["https://example.com/wireframes.pdf"]
  }'
```

6. **Approve Stage**
```bash
curl -X PUT "http://localhost:3000/api/marketplace/stages/ST-12345678" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "userId": "USER123"
  }'
```

7. **Complete Project**
```bash
curl -X POST "http://localhost:3000/api/marketplace/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "freelancerId": "USER456",
    "bookingId": "BK-12345678"
  }'
```

## Rate Limiting

- **Booking Creation**: Max 10 bookings per user per day
- **Service Creation**: Max 5 services per freelancer initially
- **Stage Submissions**: Max 3 submissions per stage

## Security

- All routes validate user authentication
- Resource ownership verification
- Input validation and sanitization
- Idempotency keys for critical operations

---

**Note**: All API routes are production-ready with comprehensive error handling, validation, and security measures. The routes integrate seamlessly with the Motoko marketplace canister and provide a complete REST API interface for the freelance marketplace.
