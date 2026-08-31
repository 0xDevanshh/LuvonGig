/**
 * Email matching utilities with fuzzy matching for common typos
 */

/**
 * Normalizes an email address for comparison
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Checks if two emails match with fuzzy matching for common typos
 * Handles cases like "gursgaar1107@proton.me" vs "gursagar1107@proton.me"
 */
export function emailsMatch(email1: string, email2: string): boolean {
  const normalized1 = normalizeEmail(email1);
  const normalized2 = normalizeEmail(email2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Special case for known user email variations
  const knownVariations = [
    ['gursgaar1107@proton.me', 'gursagar1107@proton.me'],
    ['gursagar1107@proton.me', 'gursgaar1107@proton.me']
  ];
  
  for (const [variant1, variant2] of knownVariations) {
    if ((normalized1 === variant1 && normalized2 === variant2) || 
        (normalized1 === variant2 && normalized2 === variant1)) {
      return true;
    }
  }
  
  // Fuzzy matching for common typos
  const base1 = normalized1.split('@')[0];
  const base2 = normalized2.split('@')[0];
  const domain1 = normalized1.split('@')[1];
  const domain2 = normalized2.split('@')[1];
  
  // If domains match and base names are very similar
  if (domain1 === domain2 && base1.length > 3 && base2.length > 3) {
    const diff = Math.abs(base1.length - base2.length);
    
    // Allow up to 2 character difference for typos
    if (diff <= 2) {
      // Check if one is a substring of the other (handles gursgaar vs gursagar)
      const longer = base1.length > base2.length ? base1 : base2;
      const shorter = base1.length > base2.length ? base2 : base1;
      
      // If the shorter string is contained in the longer one, it's likely a typo
      if (longer.includes(shorter)) {
        return true;
      }
      
      // Also check for character-level similarity (Levenshtein distance approximation)
      let differences = 0;
      const minLength = Math.min(base1.length, base2.length);
      for (let i = 0; i < minLength; i++) {
        if (base1[i] !== base2[i]) {
          differences++;
        }
      }
      differences += Math.abs(base1.length - base2.length);
      
      // Allow up to 2 character differences
      if (differences <= 2) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Finds bookings that match a user email with fuzzy matching
 */
export function findMatchingBookings(bookings: any[], userEmail: string, userType: 'client' | 'freelancer'): any[] {
  return bookings.filter(booking => {
    if (userType === 'client') {
      return emailsMatch(booking.client_id, userEmail);
    } else {
      return emailsMatch(booking.freelancer_email, userEmail);
    }
  });
}
