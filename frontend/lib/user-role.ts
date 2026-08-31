// User role utilities
export type UserRole = 'client' | 'freelancer' | 'admin';

export function getUserRole(): UserRole {
  // TODO: Implement actual role detection logic
  return 'freelancer';
}

export function isClient(role: UserRole): boolean {
  return role === 'client';
}

export function isFreelancer(role: UserRole): boolean {
  return role === 'freelancer';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}
