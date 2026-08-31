const profileCache = new Map<
  string,
  { data: any; timestamp: number; ttl: number }
>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedProfile(email: string) {
  const cached = profileCache.get(email);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > cached.ttl;
  if (isExpired) {
    profileCache.delete(email);
    return null;
  }

  return cached.data;
}

export function setCachedProfile(email: string, data: any, ttl = DEFAULT_TTL) {
  profileCache.set(email, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export function clearProfileCache(email?: string) {
  if (email) {
    profileCache.delete(email);
  } else {
    profileCache.clear();
  }
}

export function getProfileCacheTTL() {
  return DEFAULT_TTL;
}

