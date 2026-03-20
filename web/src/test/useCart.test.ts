import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCart } from "../hooks/useCart";

describe("useCart", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should start with empty cart", () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.cart.size).toBe(0);
  });

  it("should add item to cart", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart("session-1"));
    expect(result.current.cart.has("session-1")).toBe(true);
  });

  it("should remove item from cart", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart("session-1"));
    act(() => result.current.removeFromCart("session-1"));
    expect(result.current.cart.has("session-1")).toBe(false);
  });

  it("should toggle cart item", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.toggleCart("session-1"));
    expect(result.current.cart.has("session-1")).toBe(true);
    act(() => result.current.toggleCart("session-1"));
    expect(result.current.cart.has("session-1")).toBe(false);
  });

  it("should clear cart", () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addToCart("a");
      result.current.addToCart("b");
      result.current.addToCart("c");
    });
    expect(result.current.cart.size).toBe(3);
    act(() => result.current.clearCart());
    expect(result.current.cart.size).toBe(0);
  });

  it("should persist to localStorage", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart("session-1"));
    const stored = localStorage.getItem("ethcc-cart");
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toContain("session-1");
  });
});
