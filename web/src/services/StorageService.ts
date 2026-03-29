import { STORAGE_KEYS } from "../config/constants";

/**
 * Centralized localStorage abstraction service.
 * All localStorage access should go through this service for consistency and testability.
 */
export class StorageService {
  // ─── Set Operations ──────────────────────────────────────────

  static loadSet(key: string): Set<string> {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return new Set(JSON.parse(raw));
    } catch {
      // ignore corrupted data
    }
    return new Set();
  }

  static saveSet(key: string, set: Set<string>): void {
    localStorage.setItem(key, JSON.stringify([...set]));
  }

  // ─── Array Operations ────────────────────────────────────────

  static loadStringArray(key: string): string[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveStringArray(key: string, arr: string[]): void {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  // ─── Generic Object Operations ───────────────────────────────

  static loadObject<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static saveObject<T>(key: string, obj: T): void {
    localStorage.setItem(key, JSON.stringify(obj));
  }

  // ─── String Operations ────────────────────────────────────────

  static getString(key: string): string | null {
    return localStorage.getItem(key);
  }

  static setString(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  // ─── Remove Operations ────────────────────────────────────────

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static removeMultiple(keys: string[]): void {
    keys.forEach((key) => localStorage.removeItem(key));
  }

  // ─── Cart-Specific Operations ─────────────────────────────────

  static loadCart(): Set<string> {
    return StorageService.loadSet(STORAGE_KEYS.CART);
  }

  static saveCart(cart: Set<string>): void {
    StorageService.saveSet(STORAGE_KEYS.CART, cart);
  }

  // ─── Vote-Specific Operations ─────────────────────────────────

  static loadVotes(): Set<string> {
    return StorageService.loadSet(STORAGE_KEYS.VOTES);
  }

  static saveVotes(votes: Set<string>): void {
    StorageService.saveSet(STORAGE_KEYS.VOTES, votes);
  }

  static loadPublishedVotes(): Set<string> {
    return StorageService.loadSet(STORAGE_KEYS.PUBLISHED_VOTES);
  }

  static savePublishedVotes(votes: Set<string>): void {
    StorageService.saveSet(STORAGE_KEYS.PUBLISHED_VOTES, votes);
  }
}
