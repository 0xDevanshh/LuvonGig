#!/bin/bash

# Test script for complete hackathon creation flow
echo "Testing complete hackathon creation flow..."

# Test data
TEST_HACKATHON_DATA='{
  "title": "AI Innovation Hackathon 2025",
  "tagline": "Building the Future with Artificial Intelligence",
  "description": "Join us for an exciting weekend of AI innovation! This hackathon brings together developers, designers, and AI enthusiasts to create cutting-edge solutions using machine learning, natural language processing, and computer vision technologies.",
  "theme": "Artificial Intelligence & Machine Learning",
  "mode": "Hybrid",
  "location": "Tech Innovation Center + Virtual Platform",
  "startDate": "2025-06-15T09:00:00",
  "endDate": "2025-06-16T18:00:00",
  "registrationStart": "2025-05-01T00:00:00",
  "registrationEnd": "2025-06-14T23:59:59",
  "minTeamSize": 2,
  "maxTeamSize": 4,
  "maxParticipants": 200,
  "registrationFee": 25,
  "prizes": [
    {
      "id": "prize_1",
      "position": "1st Place",
      "title": "Grand Prize - AI Innovation Award",
      "description": "The most innovative AI solution with real-world impact potential",
      "amount": 5000,
      "currency": "USD",
      "type": "cash"
    },
    {
      "id": "prize_2",
      "position": "2nd Place",
      "title": "Runner Up",
      "description": "Second most impressive AI implementation",
      "amount": 2500,
      "currency": "USD",
      "type": "cash"
    },
    {
      "id": "prize_3",
      "position": "3rd Place",
      "title": "AI Excellence Award",
      "description": "Best technical implementation",
      "amount": 1000,
      "currency": "USD",
      "type": "cash"
    }
  ],
  "judges": [
    {
      "id": "judge_1",
      "name": "Dr. Sarah Chen",
      "email": "sarah.chen@aitest.com",
      "bio": "AI Research Scientist with 15 years of experience in deep learning and neural networks.",
      "expertise": ["Artificial Intelligence", "Machine Learning", "Deep Learning"],
      "status": "accepted"
    },
    {
      "id": "judge_2",
      "name": "Michael Rodriguez",
      "email": "michael.r@techcorp.com",
      "bio": "VP of AI at TechCorp, leading AI strategy and implementation for enterprise solutions.",
      "expertise": ["Product Management", "Artificial Intelligence", "Startups"],
      "status": "pending"
    }
  ],
  "schedule": [
    {
      "id": "schedule_1",
      "title": "Opening Ceremony & Welcome",
      "description": "Welcome remarks, hackathon overview, and team formation session",
      "startTime": "09:00",
      "endTime": "10:00",
      "date": "2025-06-15",
      "location": "Main Hall",
      "type": "opening",
      "speakers": ["Event Organizer", "Keynote Speaker"],
      "isRequired": true
    },
    {
      "id": "schedule_2",
      "title": "AI Workshop",
      "description": "Hands-on workshop on latest AI tools and frameworks",
      "startTime": "10:30",
      "endTime": "12:30",
      "date": "2025-06-15",
      "location": "Workshop Room A",
      "type": "workshop",
      "speakers": ["AI Expert"],
      "isRequired": false
    }
  ],
  "rules": "1. Teams must consist of 2-4 members\n2. Projects must be original work\n3. AI tools and frameworks are encouraged\n4. Code must be submitted by deadline\n5. Projects will be judged on innovation, technical implementation, and presentation",
  "tags": ["AI", "Machine Learning", "Hackathon", "Innovation", "Technology"],
  "socialLinks": [
    {"platform": "x.com", "url": "https://twitter.com/aihackathon2025"},
    {"platform": "github.com", "url": "https://github.com/aihackathon2025"}
  ]
}'

# Test hackathon creation
echo "Creating hackathon with complete data..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/hackathons \
  -H "Content-Type: application/json" \
  -d "{
    \"userEmail\": \"test@example.com\",
    \"hackathonData\": $TEST_HACKATHON_DATA
  }")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extract hackathon ID if successful
HACKATHON_ID=$(echo "$RESPONSE" | jq -r '.hackathon_id // empty' 2>/dev/null)

if [ -n "$HACKATHON_ID" ] && [ "$HACKATHON_ID" != "null" ]; then
  echo "✅ Hackathon created successfully with ID: $HACKATHON_ID"

  # Test retrieving the hackathon to verify all data is preserved
  echo ""
  echo "Retrieving hackathon to verify data integrity..."
  RETRIEVED_HACKATHON=$(curl -s "http://localhost:3000/api/hackathons/$HACKATHON_ID")

  echo "Retrieved hackathon data:"
  echo "$RETRIEVED_HACKATHON" | jq '.' 2>/dev/null || echo "$RETRIEVED_HACKATHON"

  # Verify key fields
  echo ""
  echo "Verifying key data fields:"

  # Check prizes
  PRIZES_COUNT=$(echo "$RETRIEVED_HACKATHON" | jq '.data.prizes | length' 2>/dev/null || echo "0")
  echo "🏆 Prizes: $PRIZES_COUNT (expected: 3)"

  # Check judges
  JUDGES_COUNT=$(echo "$RETRIEVED_HACKATHON" | jq '.data.judges | length' 2>/dev/null || echo "0")
  echo "⚖️ Judges: $JUDGES_COUNT (expected: 2)"

  # Check schedule
  SCHEDULE_COUNT=$(echo "$RETRIEVED_HACKATHON" | jq '.data.schedule | length' 2>/dev/null || echo "0")
  echo "📅 Schedule items: $SCHEDULE_COUNT (expected: 2)"

  # Check tags
  TAGS_COUNT=$(echo "$RETRIEVED_HACKATHON" | jq '.data.tags | length' 2>/dev/null || echo "0")
  echo "🏷️  Tags: $TAGS_COUNT (expected: 5)"

  # Check banner image
  BANNER_IMAGE=$(echo "$RETRIEVED_HACKATHON" | jq -r '.data.banner_image' 2>/dev/null || echo "missing")
  echo "🖼️  Banner image: $BANNER_IMAGE"

  # Check registration fee
  REG_FEE=$(echo "$RETRIEVED_HACKATHON" | jq '.data.registration_fee' 2>/dev/null || echo "0")
  echo "💰 Registration fee: \$$REG_FEE (expected: 25)"

  echo ""
  echo "🎉 Hackathon creation test completed successfully!"
  echo "Hackathon ID: $HACKATHON_ID"
  echo "You can view the hackathon at: http://localhost:3000/client/hackathons/$HACKATHON_ID"

else
  echo "❌ Hackathon creation failed"
  echo "Response: $RESPONSE"
fi