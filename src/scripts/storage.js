/**
 * Storage utility module for Wordy3
 * Provides a safe wrapper around localStorage with fallbacks for contexts where storage is not available
 */

// In-memory fallback when localStorage is not available
const memoryStorage = new Map();

/**
 * Check if localStorage is available and accessible
 * @returns {boolean} True if localStorage is available, false otherwise
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Determine if we can use localStorage
const canUseLocalStorage = isLocalStorageAvailable();

// If localStorage is not available, log a warning
if (!canUseLocalStorage) {
  console.warn('localStorage is not available. Using in-memory storage instead.');
}

/**
 * Storage utility with fallback to in-memory storage when localStorage is not available
 */
export const storage = {
  /**
   * Get an item from storage
   * @param {string} key - The key to retrieve
   * @returns {string|null} The stored value or null if not found
   */
  getItem(key) {
    try {
      if (canUseLocalStorage) {
        return localStorage.getItem(key);
      } else {
        return memoryStorage.get(key) || null;
      }
    } catch (error) {
      console.warn('Error accessing storage:', error);
      return null;
    }
  },
  
  /**
   * Set an item in storage
   * @param {string} key - The key to store
   * @param {string} value - The value to store
   * @returns {boolean} True if successful, false otherwise
   */
  setItem(key, value) {
    try {
      if (canUseLocalStorage) {
        localStorage.setItem(key, value);
      } else {
        memoryStorage.set(key, value);
      }
      return true;
    } catch (error) {
      console.warn('Error setting storage:', error);
      return false;
    }
  },
  
  /**
   * Remove an item from storage
   * @param {string} key - The key to remove
   * @returns {boolean} True if successful, false otherwise
   */
  removeItem(key) {
    try {
      if (canUseLocalStorage) {
        localStorage.removeItem(key);
      } else {
        memoryStorage.delete(key);
      }
      return true;
    } catch (error) {
      console.warn('Error removing from storage:', error);
      return false;
    }
  },
  
  /**
   * Clear all items from storage
   * @returns {boolean} True if successful, false otherwise
   */
  clear() {
    try {
      if (canUseLocalStorage) {
        localStorage.clear();
      } else {
        memoryStorage.clear();
      }
      return true;
    } catch (error) {
      console.warn('Error clearing storage:', error);
      return false;
    }
  }
};
