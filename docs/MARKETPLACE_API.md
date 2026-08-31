# ICP Ledger Freelance Marketplace API Reference

## Overview

The ICP Ledger Freelance Marketplace is a production-ready freelance marketplace built on the Internet Computer with real ICP Ledger integration. It supports service listings, tiered packages, client bookings with escrow deposits, milestone-based project stages, and secure fund releases.

## Architecture

- **Backend**: Motoko canister with stable storage and upgrade support
- **Frontend**: Next.js with TypeScript and React hooks
- **Ledger**: ICRC-1 standard for real ICP transfers
- **Authentication**: Integrates with existing UserCanister
- **Escrow**: Single marketplace-controlled sub-account for all funds

## Core Features

- ✅ Service and Package CRUD operations
- ✅ Booking with ICP Ledger escrow deposits
- ✅ Milestone-based project stages
- ✅ Stage approval and fund release
- ✅ Refund and dispute resolution
- ✅ Real-time payment status tracking
- ✅ Admin reconciliation tools

## API Endpoints

### Service Management

#### Create Service
```typescript
createService(userId: string, serviceData: Service): Promise<Result<Service, ApiError>>
```

**Parameters:**
- `userId`: User ID from authentication system
- `serviceData`: Service object with title, description, categories, etc.

**Example:**
```javascript
const serviceData = {
  title: "UI/UX Design Services",
  main_category: "Web Design",
  sub_category: "UI/UX Design",
  description: "Professional UI/UX design services for web and mobile applications",
  whats_included: "Wireframes, mockups, prototypes, style guide",
  cover_image_url: "https://example.com/image.jpg",
  portfolio_images: ["https://example.com/portfolio1.jpg"],
  status: "Active"
};

const result = await actor.createService("USER123", serviceData);
```

#### List Services
```typescript
listServices(filter: ServiceFilter): Promise<Result<Service[], ApiError>>
```

**Filter Options:**
- `category`: Filter by main category
- `freelancer_id`: Filter by freelancer
- `search_term`: Full-text search
- `limit`: Pagination limit (default: 10)
- `offset`: Pagination offset

**Example:**
```javascript
const filter = {
  category: "Web Design",
  freelancer_id: null,
  search_term: "UI design",
  limit: 20,
  offset: 0
};

const result = await actor.listServices(filter);
```

### Package Management

#### Create Package
```typescript
createPackage(userId: string, packageData: Package): Promise<Result<Package, ApiError>>
```

**Package Tiers:**
- `Basic`: Entry-level package
- `Advanced`: Mid-tier package  
- `Premium`: High-end package

**Example:**
```javascript
const packageData = {
  service_id: "SV-12345678",
  tier: "Basic",
  title: "Basic Website Design",
  description: "Simple website design with 3 pages",
  price_e8s: 5000000000n, // 50 ICP
  delivery_days: 7,
  features: ["3 pages", "Mobile responsive", "Basic SEO"],
  revisions_included: 2,
  status: "Available"
};

const result = await actor.createPackage("USER123", packageData);
```

### Booking & Payment Flow

#### Book Package
```typescript
bookPackage(clientId: string, packageId: string, idempotencyKey: string, specialInstructions: string): Promise<Result<BookingResponse, ApiError>>
```

**Critical Flow:**
1. Validates client and package
2. Calculates total price + platform fee (5%)
3. Calls ICRC-1 Ledger transfer from client → escrow
4. Returns booking with ledger block hash
5. Updates payment status to "Funded"

**Example:**
```javascript
const idempotencyKey = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const specialInstructions = "Please focus on mobile-first design";

const result = await actor.bookPackage("USER123", "PK-12345678", idempotencyKey, specialInstructions);

if (result.ok) {
  console.log("Booking created:", result.ok.booking_id);
  console.log("Escrow account:", result.ok.escrow_account);
  console.log("Amount:", result.ok.amount_e8s);
  console.log("Ledger block:", result.ok.ledger_block);
}
```

### Project Stage Management

#### Create Stages
```typescript
createStages(freelancerId: string, bookingId: string, stageDefinitions: ProjectStage[]): Promise<Result<ProjectStage[], ApiError>>
```

**Stage Flow:**
1. Freelancer creates stages after booking
2. Client approves each stage
3. Funds are released automatically on approval
4. Platform fee (5%) is deducted from each release

**Example:**
```javascript
const stageDefinitions = [
  {
    title: "Wireframes",
    description: "Create wireframes for all pages",
    amount_e8s: 2000000000n // 20 ICP
  },
  {
    title: "Design Mockups", 
    description: "High-fidelity design mockups",
    amount_e8s: 3000000000n // 30 ICP
  }
];

const result = await actor.createStages("USER123", "BK-12345678", stageDefinitions);
```

#### Submit Stage
```typescript
submitStage(freelancerId: string, stageId: string, notes: string, artifacts: string[]): Promise<Result<ProjectStage, ApiError>>
```

#### Approve Stage
```typescript
approveStage(clientId: string, stageId: string): Promise<Result<ProjectStage, ApiError>>
```

**Automatic Fund Release:**
- Calculates freelancer amount: `stage_amount * (1 - 0.05)`
- Transfers escrow → freelancer (ICRC-1)
- Transfers escrow → platform account (5% fee)
- Records ledger blocks in stage and transaction records

### Escrow & Admin Operations

#### Get Escrow Balance
```typescript
getEscrowBalance(bookingId: string): Promise<Result<bigint, ApiError>>
```

#### Refund to Client (Admin Only)
```typescript
refundToClient(adminId: string, bookingId: string, amount_e8s: bigint, reason: string): Promise<Result<EscrowTransaction, ApiError>>
```

#### Reconcile Ledger (Admin Only)
```typescript
reconcileLedger(adminId: string, startBlock: bigint, endBlock: bigint): Promise<Result<string, ApiError>>
```

## Error Handling

### API Error Types
```typescript
type ApiError = {
  NotFound?: string;
  AlreadyExists?: string;
  InvalidInput?: string;
  Unauthorized?: string;
  PaymentFailed?: string;
  InsufficientFunds?: boolean;
  LedgerError?: string;
  StageNotApproved?: boolean;
  BookingNotFunded?: boolean;
  InvalidStatus?: string;
};
```

### Error Handling Example
```javascript
try {
  const result = await actor.bookPackage(clientId, packageId, idempotencyKey, instructions);
  
  if ('ok' in result) {
    // Success
    console.log('Booking created:', result.ok);
  } else {
    // Handle error
    const error = result.err;
    if (error.NotFound) {
      console.error('Not found:', error.NotFound);
    } else if (error.PaymentFailed) {
      console.error('Payment failed:', error.PaymentFailed);
    } else if (error.InsufficientFunds) {
      console.error('Insufficient funds');
    }
  }
} catch (err) {
  console.error('Network error:', err);
}
```

## Frontend Integration

### React Hooks

#### useServices Hook
```typescript
const { 
  services, 
  loading, 
  error, 
  fetchServices, 
  createService, 
  updateService, 
  deleteService 
} = useServices();

// Fetch services with filter
await fetchServices({
  category: "Web Design",
  freelancer_id: null,
  search_term: "",
  limit: 20,
  offset: 0
});

// Create new service
const newService = await createService(userId, serviceData);
```

#### useBookPackage Hook
```typescript
const { bookPackage, loading, error } = useBookPackage();

const handleBooking = async () => {
  const result = await bookPackage(clientId, packageId, specialInstructions);
  if (result) {
    // Handle successful booking
    console.log('Booking confirmed:', result);
  }
};
```

#### useStages Hook
```typescript
const { 
  stages, 
  loading, 
  error, 
  fetchStages, 
  createStages, 
  submitStage, 
  approveStage, 
  rejectStage 
} = useStages(bookingId);

// Create project stages
await createStages(freelancerId, bookingId, stageDefinitions);

// Submit stage work
await submitStage(freelancerId, stageId, notes, artifacts);

// Approve stage (client)
await approveStage(clientId, stageId);
```

## Deployment

### Environment Variables

**Frontend (.env.local):**
```env
# Marketplace Canister
MARKETPLACE_CANISTER_ID=rdmx6-jaaaa-aaaah-qcaiq-cai

# ICRC-1 Ledger (mainnet or local)
ICRC1_LEDGER_CANISTER_ID=ryjl3-tyaaa-aaaaa-aaaba-cai

# Platform configuration
PLATFORM_FEE_PERCENT=5
PLATFORM_ACCOUNT_PRINCIPAL=rdmx6-jaaaa-aaaah-qcaiq-cai
```

### Deployment Commands

**1. Deploy Marketplace Canister:**
```bash
cd backend
dfx deploy marketplace
MARKETPLACE_ID=$(dfx canister id marketplace)
echo "MARKETPLACE_CANISTER_ID=$MARKETPLACE_ID" >> ../frontend/.env.local
```

**2. Deploy to Mainnet:**
```bash
dfx deploy --network ic marketplace
```

**3. Update Frontend Config:**
```bash
cd frontend
npm run generate-declarations
npm run dev
```

## Testing

### Unit Tests
```bash
# Run Motoko tests
dfx test marketplace

# Run frontend tests
cd frontend
npm test
```

### Integration Tests
```bash
# Deploy with test ledger
dfx deploy marketplace --argument '(variant { test_mode = true })'

# Test booking flow
dfx canister call marketplace bookPackage '("USER123", "PK-12345678", "test-key", "Test instructions")'
```

## Security Features

### Authorization
- All update endpoints verify caller identity
- Resource ownership validation
- Rate limiting on critical operations

### Payment Security
- Idempotency keys prevent duplicate bookings
- Two-phase commit for ledger operations
- Escrow balance tracking and reconciliation

### Input Validation
- Service title: 10-100 characters
- Description: 50-1000 characters
- Price: > 0, <= 1,000,000 ICP
- ID format validation: `/^[A-Z]{2}-[A-F0-9]{8}$/`

## Monitoring

### Event Logging
```typescript
// Events are automatically logged
- BookingCreated: { booking_id, client_id, amount }
- LedgerTransferInitiated: { booking_id, block }
- LedgerTransferConfirmed: { booking_id, block }
- StageApproved: { stage_id, booking_id }
- FundsReleased: { stage_id, amount, freelancer_id }
- PaymentFailed: { booking_id, error }
```

### Metrics
```typescript
const stats = await actor.getStats();
console.log('Total services:', stats.total_services);
console.log('Total bookings:', stats.total_bookings);
console.log('Total transactions:', stats.total_transactions);
```

## Example Usage

### Complete Booking Flow
```javascript
// 1. Browse services
const services = await actor.listServices({
  category: "Web Design",
  search_term: "",
  limit: 10,
  offset: 0
});

// 2. Get packages for service
const packages = await actor.getPackagesByService(serviceId);

// 3. Book package
const booking = await actor.bookPackage(clientId, packageId, idempotencyKey, instructions);

// 4. Freelancer creates stages
const stages = await actor.createStages(freelancerId, bookingId, stageDefinitions);

// 5. Freelancer submits stage
await actor.submitStage(freelancerId, stageId, notes, artifacts);

// 6. Client approves stage (triggers automatic fund release)
await actor.approveStage(clientId, stageId);

// 7. Complete project
await actor.completeProject(freelancerId, bookingId);
```

## Support

For questions and support:
- Check the troubleshooting section
- Review error logs in canister
- Contact development team

---

**Note**: This is a production-ready system. Ensure all environment variables are properly configured and test thoroughly before deploying to mainnet.
