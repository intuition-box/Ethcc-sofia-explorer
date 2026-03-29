import { useCallback, useSyncExternalStore } from "react";
import { StorageService } from "../services/StorageService";
import { sessions } from "../data";

// ─── Helper: Get track from session ID ─────────────────────────
function getSessionTrack(sessionId: string): string | null {
  const session = sessions.find(s => s.id === sessionId);
  return session?.track ?? null;
}

// ─── Helper: Check if other sessions with same track exist ─────
function hasOtherSessionsWithTrack(cart: Set<string>, track: string, excludeSessionId: string): boolean {
  return Array.from(cart).some(itemId => {
    if (itemId === excludeSessionId) return false;
    if (itemId.startsWith("interest:")) return false;
    return getSessionTrack(itemId) === track;
  });
}

// ─── Shared cart store ──────────────────────────────────────────
// All components share the same cart state via useSyncExternalStore
let cartState = StorageService.loadCart();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return cartState;
}

function updateCart(next: Set<string>) {
  cartState = next;
  StorageService.saveCart(next);
  listeners.forEach((cb) => cb());
}

export function useCart() {
  const cart = useSyncExternalStore(subscribe, getSnapshot);

  const toggleCart = useCallback((id: string) => {
    const next = new Set(cartState);
    if (next.has(id)) {
      // Removing from cart
      next.delete(id);

      // Auto-remove track interest if no other sessions use it
      const track = getSessionTrack(id);
      if (track && !hasOtherSessionsWithTrack(next, track, id)) {
        next.delete(`interest:${track}`);
      }
    } else {
      // Adding to cart
      next.add(id);

      // Auto-add track interest
      const track = getSessionTrack(id);
      if (track) {
        next.add(`interest:${track}`);
      }
    }
    updateCart(next);
  }, []);

  const clearCart = useCallback(() => {
    updateCart(new Set<string>());
  }, []);

  const addToCart = useCallback((id: string) => {
    const next = new Set(cartState);
    next.add(id);

    // Auto-add track interest if it's a session
    const track = getSessionTrack(id);
    if (track) {
      next.add(`interest:${track}`);
    }

    updateCart(next);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    const next = new Set(cartState);
    next.delete(id);

    // Auto-remove track interest if no other sessions use it
    const track = getSessionTrack(id);
    if (track && !hasOtherSessionsWithTrack(next, track, id)) {
      next.delete(`interest:${track}`);
    }

    updateCart(next);
  }, []);

  return { cart, toggleCart, clearCart, addToCart, removeFromCart };
}
