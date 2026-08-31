# Booking Flow Analysis - Service Booking APIs and Data Flow

## Overview
This document explains the complete booking flow, APIs used, data passed, and identifies missing/static data.

---

## 1. BOOKING FLOW - Step by Step

### Step 1: User Browses Service
- **Page**: `/client/service/[id]/page.tsx`
- **API**: `GET /api/marketplace/services/{serviceId}`
- **Data Fetched**: Full service details including packages

### Step 2: User Selects Package & Initiates Payment
- **Page**: `/client/payment/[id]/page.tsx`
- **Action**: User selects package, upsells, adds special instructions
- **API Called**: `POST /api/payment/create`

---

## 2. PRIMARY BOOKING APIs

### API 1: `/api/payment/create` (POST)
**Purpose**: Creates payment session with all booking details

**Request Body**: Service data, package data, upsells, special instructions, client ID

**Response**: Payment session with paymentId and expiration

### API 2: `/api/payment/confirm` (POST)
**Purpose**: Confirms payment and creates booking in marketplace canister

**What This API Does**:
1. Validates payment session
2. Fetches actual service data from marketplace canister
3. **Creates booking in marketplace canister** via `createBooking()`
4. Stores booking in local storage
5. Initiates chat between client and freelancer
6. Returns booking confirmation
