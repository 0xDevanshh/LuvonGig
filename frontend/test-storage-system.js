// Test script for service storage system
const { saveAdditionalServiceData, getAdditionalServiceData } = require('./lib/service-storage.ts');

console.log('Testing service storage system...');

// Test data
const testData = {
  service_id: 'test-service-123',
  freelancer_email: 'test@example.com',
  cover_image_url: 'https://example.com/cover.jpg',
  portfolio_images: [
    'https://example.com/img1.jpg',
    'https://example.com/img2.jpg'
  ],
  description_format: 'markdown',
  tier_mode: '3tier',
  client_questions: [
    {
      id: 'q1',
      type: 'text',
      question: 'What is your timeline?',
      required: true
    }
  ],
  faqs: [
    {
      id: 'faq1',
      question: 'How long does it take?',
      answer: 'Usually 1-2 weeks.'
    }
  ],
  created_at: Date.now() * 1000000,
  updated_at: Date.now() * 1000000
};

try {
  // Save test data
  console.log('Saving test data...');
  saveAdditionalServiceData(testData);
  console.log('✅ Data saved successfully');

  // Retrieve test data
  console.log('Retrieving test data...');
  const retrievedData = getAdditionalServiceData('test-service-123');

  if (retrievedData) {
    console.log('✅ Data retrieved successfully');
    console.log('Retrieved data:', JSON.stringify(retrievedData, null, 2));

    // Verify data integrity
    const isValid =
      retrievedData.service_id === testData.service_id &&
      retrievedData.freelancer_email === testData.freelancer_email &&
      retrievedData.portfolio_images.length === 2 &&
      retrievedData.client_questions.length === 1 &&
      retrievedData.faqs.length === 1;

    console.log(isValid ? '✅ Data integrity verified' : '❌ Data integrity failed');
  } else {
    console.log('❌ Failed to retrieve data');
  }
} catch (error) {
  console.error('❌ Test failed:', error);
}