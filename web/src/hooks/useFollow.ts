import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchFollowing } from "../services/intuition";
import { useCart } from "./useCart";
import { STORAGE_KEYS } from "../config/constants";

const PENDING_FOLLOWS_KEY = "ethcc-pending-follows";

export interface FollowEntry {
  label: string;       // wallet address
  published: boolean;  // true = on-chain, false = pending in cart
}

/**
 * Hook for follow/unfollow functionality.
 * Follows are added to the cart (pending) and published on-chain at checkout.
 * FIXED: Proper dependency arrays for useEffect and useCallback.
 */
export function useFollow() {
  const { addToCart, removeFromCart } = useCart();

  // Wallet address from storage
  const [walletAddress, setWalletAddress] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS)
  );

  // Published follows (from chain)
  const [publishedFollows, setPublishedFollows] = useState<FollowEntry[]>([]);

  // Pending follows (in cart, not yet on-chain)
  const [pendingFollows, setPendingFollows] = useState<FollowEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(PENDING_FOLLOWS_KEY) ?? "[]"); }
    catch { return []; }
  });

  // All follows = published + pending (memoized to avoid recreation)
  const following = useMemo(() => [
    ...publishedFollows,
    ...pendingFollows.filter((p) => !publishedFollows.some((f) => f.label === p.label)),
  ], [publishedFollows, pendingFollows]);

  // Listen to wallet address changes
  useEffect(() => {
    const handleStorageChange = () => {
      const addr = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
      setWalletAddress(addr);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync published follows from chain when wallet changes
  useEffect(() => {
    if (!walletAddress) return;

    fetchFollowing(walletAddress).then((entries) => {
      if (entries.length > 0) {
        const published = entries.map((e) => ({ label: e.label, published: true }));
        setPublishedFollows(published);
        // Clean pending follows that are now published
        setPendingFollows((prev) => {
          const next = prev.filter((p) => !entries.some((e) => e.label.toLowerCase() === p.label.toLowerCase()));
          localStorage.setItem(PENDING_FOLLOWS_KEY, JSON.stringify(next));
          return next;
        });
      }
    }).catch((err) => {
      console.warn('[useFollow] Failed to fetch published follows from chain:', err);
      // Continue silently - user will see pending follows from localStorage
    });
  }, [walletAddress]); // ✅ FIXED: Now depends on walletAddress

  const isFollowingUser = useCallback(
    (label: string) => following.some((f) => f.label.toLowerCase() === label.toLowerCase()),
    [following] // ✅ CORRECT: Depends on following which is memoized
  );

  const follow = useCallback((targetLabel: string) => {
    if (isFollowingUser(targetLabel)) return;

    // Add to pending follows
    const entry: FollowEntry = { label: targetLabel, published: false };
    setPendingFollows((prev) => {
      const next = [...prev, entry];
      localStorage.setItem(PENDING_FOLLOWS_KEY, JSON.stringify(next));
      return next;
    });

    // Add to cart with a follow: prefix so CartPage can identify it
    addToCart(`follow:${targetLabel}`);
  }, [isFollowingUser, addToCart]); // ✅ FIXED: Removed pendingFollows, use functional update

  const unfollow = useCallback((targetLabel: string) => {
    // Only remove pending follows (published ones need on-chain redeem)
    setPendingFollows((prev) => {
      const next = prev.filter((f) => f.label.toLowerCase() !== targetLabel.toLowerCase());
      localStorage.setItem(PENDING_FOLLOWS_KEY, JSON.stringify(next));
      return next;
    });
    removeFromCart(`follow:${targetLabel}`);
  }, [removeFromCart]); // ✅ FIXED: Removed pendingFollows, use functional update

  return { following, pendingFollows, publishedFollows, isFollowingUser, follow, unfollow };
}
