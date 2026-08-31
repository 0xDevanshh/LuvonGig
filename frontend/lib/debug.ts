// Debug utility for onboarding flow
export const debugOnboarding = {
  // Clear onboarding completion flag (useful for testing)
  clearOnboardingFlag: () => {
    localStorage.removeItem('onboarding_completed');
    console.log('Onboarding completion flag cleared');
  },

  // Check current onboarding status
  checkStatus: () => {
    const completed = localStorage.getItem('onboarding_completed');
    const hasData = localStorage.getItem('onboarding_data');

    console.log('Onboarding Debug Info:');
    console.log('- Completed:', completed === 'true');
    console.log('- Has stored data:', !!hasData);
    console.log('- Data:', hasData ? JSON.parse(hasData!) : 'None');

    return {
      completed: completed === 'true',
      hasData: !!hasData,
      data: hasData ? JSON.parse(hasData) : null
    };
  },

  // Reset everything
  resetAll: () => {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_data');
    console.log('All onboarding data cleared');
  }
};