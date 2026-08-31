# Team Creation and Invitation Flow

## Overview
This document explains the complete flow when a user creates a team and invites another person by email address.

## Prerequisites
1. **User must be registered as a participant** in the hackathon (via `/api/hackquest/register`)
2. **Invitee must also be registered as a participant** in the hackathon (they need to register first)

## Step-by-Step Flow

### 1. User Creates a Team
**Location**: `/freelancer/hackathons/[id]/page.tsx` → `handleCreateTeam()`

**What happens:**
- User fills in team name, category (optional), and invitee email addresses
- Frontend calls `/api/hackquest/teams/create` with:
  - `hackathonId`
  - `teamName`
  - `categoryId` (optional)
  - `leaderEmail` (user's email)
  - `leaderPrincipal` (optional, if wallet connected)
  - `inviteeEmails` (array of email addresses)

### 2. API Route Processes Request
**Location**: `/api/hackquest/teams/create/route.ts`

**What happens:**
1. **Resolve Leader Principal:**
   - If `leaderPrincipal` provided → use it
   - If only `leaderEmail` provided → call `getPrincipalFromEmail()` to find the principal
   - If principal not found → return error: "Leader must be registered as a participant first"

2. **Resolve Invitee Principals:**
   - For each email in `inviteeEmails`:
     - Call `getPrincipalFromEmail(email)` which:
       - Gets all hackathons
       - Checks all teams and their members
       - Checks all organizers
       - Finds participant record with matching email
       - Returns the principal
   - If any email can't be resolved → return error with list of failed emails
   - **Important**: All invitees MUST be registered as participants first

3. **Create Team in Canister:**
   - Call `actor.createTeam()` with:
     - `hackathonId`
     - `name` (team name)
     - `categoryId` (optional)
     - `leader` (principal)
     - `invitees` (array of principals)
   - Canister creates team with:
     - Leader: `accepted = true`, `acceptedAt = timestamp`
     - Invitees: `accepted = false`, `acceptedAt = null`

### 3. Invitee Receives Invitation
**Location**: `/api/hackquest/teams/invitations/route.ts`

**What happens:**
- Invitee logs in and visits hackathon page
- Frontend calls `/api/hackquest/teams/invitations?email=invitee@example.com`
- API route:
  1. Gets all hackathons
  2. For each hackathon, gets all teams
  3. For each team, checks members
  4. For each member, gets participant record
  5. If participant email matches invitee email AND `accepted = false` → add to invitations list
- Returns list of pending invitations

### 4. Invitee Responds to Invitation
**Location**: `/freelancer/hackathons/[id]/page.tsx` → `handleInvitationResponse()`

**What happens:**
- Invitee clicks "Accept" or "Decline"
- Frontend calls `/api/hackquest/teams/respond` with:
  - `teamId`
  - `accept` (boolean)
  - `principal` (invitee's principal, resolved from email if needed)
- API calls `actor.respondToInvite(teamId, accept)`
- Canister updates team member:
  - If accept: `accepted = true`, `acceptedAt = timestamp`
  - If decline: Team member remains with `accepted = false`

## Important Notes

### Email-to-Principal Resolution
The `getPrincipalFromEmail()` function is **inefficient** because:
- It searches through ALL hackathons
- It checks ALL teams and members
- It checks ALL organizers
- This is necessary because there's no email index in the canister

**Future Improvement**: Add an email-to-principal mapping in the canister for faster lookups.

### Registration Requirement
**Both the leader and invitees MUST be registered as participants** before team creation:
- Leader registration: Done via "Register for Hackathon" button
- Invitee registration: They must register themselves first

If someone tries to invite a person who hasn't registered:
- Error: "Cannot invite the following emails (participants must register first): [emails]"

### Team Member States
- **Leader**: Automatically `accepted = true` when team is created
- **Invitees**: Start with `accepted = false`
- **After acceptance**: `accepted = true`, `acceptedAt` is set
- **After decline**: Remains `accepted = false` (can be removed or left as-is)

### No Wallet Required
- Team creation works with **email only** (no wallet connection needed)
- Principal is resolved from participant registration
- If user has wallet connected, principal can be used directly
- If no wallet, principal is looked up from email

## Example Flow

1. **Alice** (alice@example.com) registers for hackathon → gets principal `abc-123`
2. **Bob** (bob@example.com) registers for hackathon → gets principal `def-456`
3. **Alice** creates team "Team Alpha" and invites `bob@example.com`
4. API resolves:
   - Leader: `abc-123` (from alice@example.com)
   - Invitee: `def-456` (from bob@example.com)
5. Team created in canister:
   - Leader: `abc-123`, `accepted = true`
   - Member: `def-456`, `accepted = false`
6. **Bob** logs in and sees invitation on hackathon page
7. **Bob** clicks "Accept"
8. Team member updated: `def-456`, `accepted = true`, `acceptedAt = timestamp`
9. Team is now complete and ready for project submission


