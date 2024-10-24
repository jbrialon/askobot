const CACHE_DURATION = 30 * 1000; // 30 seconds

export class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  getCacheKey(key) {
    return JSON.stringify(key);
  }

  set(key, value) {
    const cacheKey = this.getCacheKey(key);
    this.cache.set(cacheKey, value);

    // evict cache key after CACHE_DURATION
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, CACHE_DURATION);
  }

  get(key) {
    const cacheKey = this.getCacheKey(key);
    return this.cache.get(cacheKey);
  }
}
