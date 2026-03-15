import { useCallback, useSyncExternalStore } from "react";
import { StorageService } from "../services/StorageService";

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
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateCart(next);
  }, []);

  const clearCart = useCallback(() => {
    updateCart(new Set<string>());
  }, []);

  const addToCart = useCallback((id: string) => {
    const next = new Set(cartState);
    next.add(id);
    updateCart(next);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    const next = new Set(cartState);
    next.delete(id);
    updateCart(next);
  }, []);

  return { cart, toggleCart, clearCart, addToCart, removeFromCart };
}
