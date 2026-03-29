/**
 * FollowNotificationService - Detects new followers and notifies the user
 *
 * Architecture:
 * - Class-based with instance state (no module-level shared state)
 * - Polls GraphQL API every 2 minutes to check for new followers
 * - Stores seen followers in localStorage to track "new" vs "seen"
 * - Emits events when new followers are detected
 *
 * Usage:
 * const service = new FollowNotificationService();
 * service.start(userAddress, (newFollowers) => {
 *   console.log(`You have ${newFollowers.length} new followers!`);
 * });
 * service.stop(); // Clean up when done
 */

import { GraphQLClient } from "@ethcc/graphql";
import { GQL_URL } from "../config/constants";
import { PREDICATES } from "./intuition";
import { StorageService } from "./StorageService";

// ─── Types ────────────────────────────────────────────────────

export interface Follower {
  termId: string;
  label: string;
  followedAt: string; // ISO timestamp
}

export interface NewFollowerEvent {
  followers: Follower[];
  count: number;
}

// ─── GraphQL Query ────────────────────────────────────────────

const GET_FOLLOWERS_QUERY = /* GraphQL */ `
query GetFollowers($predicateId: String!, $userAtomId: String!) {
  triples(
    where: {
      predicate: { term_id: { _eq: $predicateId } }
      object: { term_id: { _eq: $userAtomId } }
    }
    order_by: { created_at: desc }
  ) {
    term_id
    created_at
    subject {
      term_id
      label
    }
  }
}
`;

interface FollowerTriple {
  term_id: string;
  created_at: string;
  subject?: {
    term_id: string;
    label?: string;
  };
}

interface GetFollowersResponse {
  triples: FollowerTriple[];
}

// ─── Storage Keys ─────────────────────────────────────────────

const SEEN_FOLLOWERS_KEY = "sofia:seen_followers";

// ─── Service Class ────────────────────────────────────────────

export class FollowNotificationService {
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private gqlClient: GraphQLClient;

  constructor() {
    this.gqlClient = new GraphQLClient({ endpoint: GQL_URL });
  }

  /**
   * Start polling for new followers
   * @param userAtomId - The atom ID representing the current user on-chain
   * @param onNewFollowers - Callback invoked when new followers are detected
   * @returns Cleanup function to stop polling
   */
  start(
    userAtomId: string,
    onNewFollowers: (event: NewFollowerEvent) => void
  ): () => void {
    if (this.pollInterval) {
      console.warn("[FollowNotificationService] Already running, stopping previous instance");
      this.stop();
    }

    console.log(`[FollowNotificationService] Starting for user ${userAtomId}`);

    const check = async () => {
      try {
        const newFollowers = await this.checkForNewFollowers(userAtomId);
        if (newFollowers.length > 0) {
          console.log(`[FollowNotificationService] Found ${newFollowers.length} new followers`);
          onNewFollowers({
            followers: newFollowers,
            count: newFollowers.length,
          });
        }
      } catch (err) {
        console.error("[FollowNotificationService] Failed to check followers:", err);
      }
    };

    // Initial check
    check();

    // Poll every 2 minutes
    this.pollInterval = setInterval(check, 120_000);

    return () => this.stop();
  }

  /**
   * Stop polling for followers
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log("[FollowNotificationService] Stopped");
    }
  }

  /**
   * Check for new followers by comparing current followers with seen followers
   */
  private async checkForNewFollowers(userAtomId: string): Promise<Follower[]> {
    // Fetch current followers from chain
    const currentFollowers = await this.fetchFollowers(userAtomId);

    // Load seen followers from storage
    const seenFollowerIds = this.loadSeenFollowers();

    // Find new followers (not in seen set)
    const newFollowers = currentFollowers.filter(
      (follower) => !seenFollowerIds.has(follower.termId)
    );

    // Mark all current followers as seen
    if (currentFollowers.length > 0) {
      this.saveSeenFollowers(currentFollowers.map((f) => f.termId));
    }

    return newFollowers;
  }

  /**
   * Fetch all followers for a given user from GraphQL
   */
  private async fetchFollowers(userAtomId: string): Promise<Follower[]> {
    // Check if "follow" predicate exists
    if (!PREDICATES["follow"]) {
      console.warn('[FollowNotificationService] "follow" predicate not found in graph data');
      return [];
    }

    const data = await this.gqlClient.request<GetFollowersResponse>(
      GET_FOLLOWERS_QUERY,
      {
        predicateId: PREDICATES["follow"],
        userAtomId,
      }
    );

    const triples = data.triples ?? [];

    return triples
      .filter((t) => t.subject?.term_id && t.subject?.label)
      .map((t) => ({
        termId: t.subject!.term_id,
        label: t.subject!.label!,
        followedAt: t.created_at,
      }));
  }

  /**
   * Load the set of seen follower IDs from localStorage
   */
  private loadSeenFollowers(): Set<string> {
    return StorageService.loadSet(SEEN_FOLLOWERS_KEY);
  }

  /**
   * Save seen follower IDs to localStorage
   */
  private saveSeenFollowers(followerIds: string[]): void {
    const existing = this.loadSeenFollowers();
    followerIds.forEach((id) => existing.add(id));
    StorageService.saveSet(SEEN_FOLLOWERS_KEY, existing);
  }

  /**
   * Get the count of unseen followers without marking them as seen
   * Useful for displaying badge count on app load
   */
  async getUnseenFollowerCount(userAtomId: string): Promise<number> {
    try {
      const currentFollowers = await this.fetchFollowers(userAtomId);
      const seenFollowerIds = this.loadSeenFollowers();
      const unseenCount = currentFollowers.filter(
        (f) => !seenFollowerIds.has(f.termId)
      ).length;
      return unseenCount;
    } catch (err) {
      console.error("[FollowNotificationService] Failed to get unseen count:", err);
      return 0;
    }
  }

  /**
   * Get all followers (for notifications page)
   */
  async getAllFollowers(userAtomId: string): Promise<Follower[]> {
    try {
      return await this.fetchFollowers(userAtomId);
    } catch (err) {
      console.error("[FollowNotificationService] Failed to get all followers:", err);
      return [];
    }
  }

  /**
   * Mark specific followers as seen
   */
  markAsSeen(followerIds: string[]): void {
    this.saveSeenFollowers(followerIds);
  }

  /**
   * Clear all seen followers (useful for testing or logout)
   */
  clearSeenFollowers(): void {
    StorageService.remove(SEEN_FOLLOWERS_KEY);
    console.log("[FollowNotificationService] Cleared seen followers");
  }
}

// ─── Singleton Instance ───────────────────────────────────────
// For backward compatibility and convenience

export const followNotificationService = new FollowNotificationService();
