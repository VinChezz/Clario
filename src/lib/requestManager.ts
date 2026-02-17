class RequestManager {
  private static instance: RequestManager;

  private cache = new Map<string, { data: any; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private cacheDurations = {
    user: 60000,
    teams: 30000,
    storage: 10000,
    files: 5000,
    members: 30000,
    setup: 3600000,
  };

  private constructor() {}

  static getInstance() {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager();
    }
    return RequestManager.instance;
  }

  hasValidCache(key: string, type: keyof typeof this.cacheDurations): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    const isValid = now - cached.timestamp < this.cacheDurations[type];

    if (isValid) {
      console.log(`🔍 [${type}] Valid cache found for:`, key);
    }

    return isValid;
  }

  getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    return cached?.data || null;
  }

  async fetch<T>(
    key: string,
    type: keyof typeof this.cacheDurations,
    fetcher: () => Promise<T>,
    force = false,
  ): Promise<T> {
    if (!force) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.cacheDurations[type]) {
        return cached.data;
      }
    }

    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    const promise = fetcher()
      .then((data) => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    console.log(`🧹 Clearing all cache`);
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export const requestManager = RequestManager.getInstance();
