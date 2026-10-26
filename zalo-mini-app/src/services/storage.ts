/**
 * Safe In-Memory & ZMP-SDK Storage Wrapper
 * CRITICAL RULE: NEVER use localStorage, sessionStorage, or document.cookie!
 * Zalo WebView (h5.zdn.vn) will throw SecurityError / DOMException.
 */

const memoryStore: Map<string, string> = new Map();

// Check if zmp-sdk runtime is available
let zmpStorageApi: any = null;
try {
  // Dynamically inspect window.ZMP or zmp-sdk
  if (typeof window !== 'undefined' && (window as any).ZMP) {
    zmpStorageApi = (window as any).ZMP;
  }
} catch (e) {
  // Ignore in web browser mode
}

export const SafeStorage = {
  /**
   * Save item safely into memory and asynchronously try zmp-sdk
   */
  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);

    if (zmpStorageApi && typeof zmpStorageApi.setStorage === 'function') {
      try {
        await zmpStorageApi.setStorage({
          data: { [key]: value },
        });
      } catch (err) {
        // Silently swallow any storage restriction errors
      }
    }
  },

  /**
   * Retrieve item safely from in-memory cache
   */
  async getItem(key: string): Promise<string | null> {
    if (memoryStore.has(key)) {
      return memoryStore.get(key) || null;
    }

    if (zmpStorageApi && typeof zmpStorageApi.getStorage === 'function') {
      try {
        const res = await zmpStorageApi.getStorage({ keys: [key] });
        if (res && res[key]) {
          memoryStore.set(key, res[key]);
          return res[key];
        }
      } catch (err) {
        // Fallback to null
      }
    }

    return null;
  },

  /**
   * Remove item safely
   */
  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);
    if (zmpStorageApi && typeof zmpStorageApi.removeStorage === 'function') {
      try {
        await zmpStorageApi.removeStorage({ keys: [key] });
      } catch (e) {
        // ignore
      }
    }
  },

  /**
   * Synchronous getter from in-memory cache
   */
  getMemoryItem(key: string): string | null {
    return memoryStore.get(key) || null;
  },

  /**
   * Synchronous setter into in-memory cache
   */
  setMemoryItem(key: string, value: string): void {
    memoryStore.set(key, value);
  }
};
