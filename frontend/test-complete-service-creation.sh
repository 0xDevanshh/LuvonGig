#!/bin/bash

# Test script for complete service creation flow
echo "Testing complete service creation flow..."

# Create test data
TEST_SERVICE_DATA='{
  "title": "Complete Test Service with All Features",
  "main_category": "Full Stack Developer",
  "sub_category": "Web Development",
  "description": "This is a comprehensive test service that includes all features from the add-service forms: portfolio images, client questions, FAQs, and multiple packages.",
  "description_format": "markdown",
  "whats_included": "Full stack web development with modern technologies, responsive design, deployment support, and 30 days maintenance.",
  "cover_image_url": "https://example.com/cover-image.jpg",
  "portfolio_images": [
    "https://example.com/portfolio1.jpg",
    "https://example.com/portfolio2.jpg",
    "https://example.com/portfolio3.jpg"
  ],
  "tier_mode": "3tier",
  "client_questions": [
    {
      "id": "cq_1",
      "type": "text",
      "question": "What is your project timeline?",
      "required": true
    },
    {
      "id": "cq_2",
      "type": "mcq",
      "question": "What is your preferred tech stack?",
      "required": false
    },
    {
      "id": "cq_3",
      "type": "checkbox",
      "question": "What features do you need?",
      "required": false
    }
  ],
  "faqs": [
    {
      "id": "faq_1",
      "question": "How long does a typical project take?",
      "answer": "Most projects are completed within 2-4 weeks depending on complexity."
    },
    {
      "id": "faq_2",
      "question": "Do you provide ongoing support?",
      "answer": "Yes, I provide 30 days of post-launch support with all packages."
    },
    {
      "id": "faq_3",
      "question": "Can you work with existing codebases?",
      "answer": "Absolutely! I have extensive experience working with and improving existing projects."
    }
  ],
  "packages": [
    {
      "package_id": "pkg_basic_001",
      "tier": "Basic",
      "title": "Basic Website Package",
      "description": "Perfect for small businesses and startups. Get a professional website with essential features.",
      "price_e8s": 50000000,
      "delivery_days": 3,
      "delivery_timeline": "3 days",
      "features": [
        "Responsive design",
        "Up to 5 pages",
        "Contact form",
        "Basic SEO setup"
      ],
      "revisions_included": 2,
      "status": "Available"
    },
    {
      "package_id": "pkg_standard_001",
      "tier": "Standard",
      "title": "Standard Web Application",
      "description": "Great for growing businesses that need more functionality and custom features.",
      "price_e8s": 100000000,
      "delivery_days": 7,
      "delivery_timeline": "1 week",
      "features": [
        "Everything in Basic",
        "Up to 15 pages",
        "User authentication",
        "Database integration",
        "Admin dashboard",
        "Advanced SEO"
      ],
      "revisions_included": 3,
      "status": "Available"
    },
    {
      "package_id": "pkg_premium_001",
      "tier": "Premium",
      "title": "Premium Full-Stack Solution",
      "description": "Complete solution for enterprises and complex applications with cutting-edge technologies.",
      "price_e8s": 200000000,
      "delivery_days": 14,
      "delivery_timeline": "2 weeks",
      "features": [
        "Everything in Standard",
        "Unlimited pages",
        "Custom API development",
        "Third-party integrations",
        "Performance optimization",
        "Security audit",
        "CI/CD setup",
        "3 months support",
        "Unlimited revisions"
      ],
      "revisions_included": 5,
      "status": "Available"
    }
  ],
  "status": "Active"
}'

# Test service creation
echo "Creating service with complete data..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/marketplace/services \
  -H "Content-Type: application/json" \
  -d "{
    \"userEmail\": \"test@example.com\",
    \"serviceData\": $TEST_SERVICE_DATA
  }")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extract service ID if successful
SERVICE_ID=$(echo "$RESPONSE" | jq -r '.service_id // empty' 2>/dev/null)

if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
  echo "✅ Service created successfully with ID: $SERVICE_ID"

  # Test retrieving the service to verify all data is preserved
  echo ""
  echo "Retrieving service to verify data integrity..."
  RETRIEVED_SERVICE=$(curl -s "http://localhost:3000/api/marketplace/services/$SERVICE_ID")

  echo "Retrieved service data:"
  echo "$RETRIEVED_SERVICE" | jq '.' 2>/dev/null || echo "$RETRIEVED_SERVICE"

  # Verify key fields
  echo ""
  echo "Verifying key data fields:"

  # Check portfolio images
  PORTFOLIO_COUNT=$(echo "$RETRIEVED_SERVICE" | jq '.data.portfolio_images | length' 2>/dev/null || echo "0")
  echo "📸 Portfolio images: $PORTFOLIO_COUNT (expected: 3)"

  # Check client questions
  QUESTIONS_COUNT=$(echo "$RETRIEVED_SERVICE" | jq '.data.client_questions | length' 2>/dev/null || echo "0")
  echo "❓ Client questions: $QUESTIONS_COUNT (expected: 3)"

  # Check FAQs
  FAQS_COUNT=$(echo "$RETRIEVED_SERVICE" | jq '.data.faqs | length' 2>/dev/null || echo "0")
  echo "📋 FAQs: $FAQS_COUNT (expected: 3)"

  # Check tier mode
  TIER_MODE=$(echo "$RETRIEVED_SERVICE" | jq -r '.data.tier_mode' 2>/dev/null || echo "unknown")
  echo "🏷️  Tier mode: $TIER_MODE (expected: 3tier)"

  # Check cover image
  COVER_IMAGE=$(echo "$RETRIEVED_SERVICE" | jq -r '.data.cover_image_url' 2>/dev/null || echo "missing")
  echo "🖼️  Cover image: $COVER_IMAGE"

  # Check package creation by trying to retrieve packages
  echo ""
  echo "Checking packages (via packages API)..."
  PACKAGES_RESPONSE=$(curl -s "http://localhost:3000/api/marketplace/services/$SERVICE_ID/packages")
  PACKAGES_COUNT=$(echo "$PACKAGES_RESPONSE" | jq '.data | length' 2>/dev/null || echo "0")
  echo "📦 Packages created: $PACKAGES_COUNT (expected: 3)"

  if [ "$PACKAGES_COUNT" -eq 3 ]; then
    echo "✅ All packages created successfully!"
  else
    echo "❌ Package creation failed or incomplete"
  fi

  echo ""
  echo "🎉 Service creation test completed!"
  echo "Service ID: $SERVICE_ID"
  echo "You can view the service at: http://localhost:3000/freelancer/service-preview/$SERVICE_ID"

else
  echo "❌ Service creation failed"
  echo "Response: $RESPONSE"
fi