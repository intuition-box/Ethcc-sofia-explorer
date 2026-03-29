/**
 * Helper utilities for deriving track interests from cart items
 */

import { sessions } from "../data";

/**
 * Extract unique track interests from cart items
 * Handles both:
 * - Explicit interests (prefixed with "interest:")
 * - Implicit interests (derived from session tracks)
 */
export function getInterestsFromCart(cart: Set<string>): Set<string> {
  const tracks = new Set<string>();

  cart.forEach((id) => {
    // Explicit interest
    if (id.startsWith("interest:")) {
      const track = id.slice(9); // Remove "interest:" prefix
      tracks.add(track);
    } else {
      // Check if it's a session
      const session = sessions.find(s => s.id === id);
      if (session?.track) {
        tracks.add(session.track);
      }
    }
  });

  return tracks;
}
