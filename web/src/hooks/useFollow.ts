import { useState, useEffect, useCallback } from "react";
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
 */
export function useFollow() {
  const { addToCart, removeFromCart } = useCart();

  // Published follows (from chain)
  const [publishedFollows, setPublishedFollows] = useState<FollowEntry[]>([]);

  // Pending follows (in cart, not yet on-chain)
  const [pendingFollows, setPendingFollows] = useState<FollowEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(PENDING_FOLLOWS_KEY) ?? "[]"); }
    catch { return []; }
  });

  // All follows = published + pending
  const following = [
    ...publishedFollows,
    ...pendingFollows.filter((p) => !publishedFollows.some((f) => f.label === p.label)),
  ];

  // Sync published follows from chain on mount
  useEffect(() => {
    const addr = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    if (!addr) return;
    fetchFollowing(addr).then((entries) => {
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
    }).catch(() => {});
  }, []);

  const isFollowingUser = useCallback(
    (label: string) => following.some((f) => f.label.toLowerCase() === label.toLowerCase()),
    [following]
  );

  const follow = useCallback((targetLabel: string) => {
    if (isFollowingUser(targetLabel)) return;

    // Add to pending follows
    const entry: FollowEntry = { label: targetLabel, published: false };
    const next = [...pendingFollows, entry];
    setPendingFollows(next);
    localStorage.setItem(PENDING_FOLLOWS_KEY, JSON.stringify(next));

    // Add to cart with a follow: prefix so CartPage can identify it
    addToCart(`follow:${targetLabel}`);
  }, [pendingFollows, isFollowingUser, addToCart]);

  const unfollow = useCallback((targetLabel: string) => {
    // Only remove pending follows (published ones need on-chain redeem)
    const next = pendingFollows.filter((f) => f.label.toLowerCase() !== targetLabel.toLowerCase());
    setPendingFollows(next);
    localStorage.setItem(PENDING_FOLLOWS_KEY, JSON.stringify(next));
    removeFromCart(`follow:${targetLabel}`);
  }, [pendingFollows, removeFromCart]);

  return { following, pendingFollows, publishedFollows, isFollowingUser, follow, unfollow };
}
