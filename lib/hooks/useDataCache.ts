const cache: Record<string, { data: any; timestamp: number }> = {};

export function getCached(key: string, ttlMs = 30000) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) return null;
  return entry.data;
}

export function setCached(key: string, data: any) {
  cache[key] = { data, timestamp: Date.now() };
}

export function clearCache(key?: string) {
  if (key) delete cache[key];
  else Object.keys(cache).forEach(k => delete cache[k]);
}
