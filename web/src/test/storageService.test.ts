import { describe, it, expect, beforeEach } from "vitest";
import { StorageService } from "../services/StorageService";

describe("StorageService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Cart", () => {
    it("should return empty set when no cart exists", () => {
      const cart = StorageService.loadCart();
      expect(cart.size).toBe(0);
    });

    it("should save and load cart", () => {
      const cart = new Set(["session-1", "session-2", "session-3"]);
      StorageService.saveCart(cart);

      const loaded = StorageService.loadCart();
      expect(loaded.size).toBe(3);
      expect(loaded.has("session-1")).toBe(true);
      expect(loaded.has("session-2")).toBe(true);
      expect(loaded.has("session-3")).toBe(true);
    });

    it("should handle empty cart", () => {
      StorageService.saveCart(new Set());
      const loaded = StorageService.loadCart();
      expect(loaded.size).toBe(0);
    });

    it("should overwrite previous cart", () => {
      StorageService.saveCart(new Set(["a", "b"]));
      StorageService.saveCart(new Set(["c"]));

      const loaded = StorageService.loadCart();
      expect(loaded.size).toBe(1);
      expect(loaded.has("c")).toBe(true);
      expect(loaded.has("a")).toBe(false);
    });
  });

  // Topics tests removed - interests are now derived from on-chain data via syncProfileFromChain

  describe("Corrupted data", () => {
    it("should return empty set for corrupted JSON", () => {
      localStorage.setItem("ethcc-cart", "not-json{{{");
      const cart = StorageService.loadCart();
      expect(cart.size).toBe(0);
    });
  });
});
