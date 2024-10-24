const CACHE_DURATION = 30 * 1000; // 30 seconds
const CACHE_CLEAR_INTERVAL = 10 * 60 * 1000; // 10 minutes

export class MemoryCache {
  constructor() {
    this.cache = new Map();

    setInterval(() => {
      this.cache.clear();
    }, CACHE_CLEAR_INTERVAL);
  }

  getCacheKey(key) {
    return JSON.stringify(key);
  }

  set(key, value) {
    const cacheKey = this.getCacheKey(key);
    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const cacheKey = this.getCacheKey(key);
    const cacheEntry = this.cache.get(cacheKey);
    if (!cacheEntry) {
      return null;
    }
    const { value, timestamp } = cacheEntry;
    if (!value || !timestamp) {
      return null;
    }
    if (Date.now() - timestamp > CACHE_DURATION) {
      this.cache.delete(cacheKey); // aggressively clear cache key
      return null;
    }
    return value;
  }
}
