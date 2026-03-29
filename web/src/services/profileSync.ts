/**
 * Sync on-chain positions back to localStorage.
 *
 * Queries GraphQL for all positions held by a wallet address,
 * then maps them to app-level interests (track names), sessions (session IDs),
 * and votes (topic IDs) using the reverse lookup from local data.
 *
 * This ensures the Profile page shows correct data even if localStorage
 * was cleared or the user published before the persistence fix.
 */

import graphData from "../../../bdd/intuition_graph.json";
import topicGraph from "../../../bdd/web3_topics_graph.json";
import { STORAGE_KEYS, CHAIN_CONFIG } from "../config/constants";
import { GraphQLClient, GET_ACCOUNT_POSITIONS, type GetAccountPositionsQuery } from "@ethcc/graphql";
import { GQL_URL } from "../config/constants";

const TRACK_ATOM_IDS = graphData.trackAtomIds as Record<string, string>;
const SESSION_ATOM_IDS = graphData.sessionIdToAtomId as Record<string, string>;
const PREDICATES = graphData.predicates as Record<string, string>;
const TOPIC_ATOM_IDS = (topicGraph as { topicAtomIds: Record<string, string> }).topicAtomIds;

// Reverse lookups: atomId → app-level name/id
const ATOM_TO_TRACK = new Map(
  Object.entries(TRACK_ATOM_IDS).map(([name, atomId]) => [atomId, name])
);
const ATOM_TO_SESSION = new Map(
  Object.entries(SESSION_ATOM_IDS).map(([sessionId, atomId]) => [atomId, sessionId])
);
const ATOM_TO_TOPIC = new Map(
  Object.entries(TOPIC_ATOM_IDS).map(([topicId, atomId]) => [atomId, topicId])
);

const ATTENDING_PREDICATE = PREDICATES["attending"];

interface SyncResult {
  interests: string[];
  sessions: string[];
  votes: string[];
  atomId?: string;
}

/**
 * Fetch all on-chain positions for a wallet and map them to app data.
 * Updates localStorage with the results.
 */
/**
 * Calculate the user's atom ID from their wallet address.
 * This matches the on-chain atom ID for the wallet.
 */
async function calculateUserAtomId(address: string): Promise<string> {
  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL);
    const multiVault = new ethers.Contract(
      CHAIN_CONFIG.MULTIVAULT,
      ["function calculateAtomId(bytes data) pure returns (bytes32)"],
      provider
    );
    const hexData = ethers.hexlify(ethers.toUtf8Bytes(address.toLowerCase()));
    return await multiVault.calculateAtomId(hexData);
  } catch (err) {
    console.error("[profileSync] Failed to calculate atom ID:", err);
    return "";
  }
}

export async function syncProfileFromChain(address: string): Promise<SyncResult> {
  if (!address) return { interests: [], sessions: [], votes: [] };

  const client = new GraphQLClient({ endpoint: GQL_URL });
  const data = await client.request<GetAccountPositionsQuery>(
    GET_ACCOUNT_POSITIONS,
    { address: address.toLowerCase(), limit: 200 }
  );
  const positions = data.positions ?? [];

  // Calculate user atom ID
  const atomId = await calculateUserAtomId(address);

  const interests = new Set<string>();
  const sessionIds = new Set<string>();
  const votes = new Set<string>();
  const publishedSessions: string[] = [];

  for (const pos of positions) {
    const term = pos.vault?.term;
    if (!term) continue;

    if (term.atom) {
      // Atom position — could be interest (track) or vote (topic)
      const atomId = term.atom.term_id;
      const trackName = ATOM_TO_TRACK.get(atomId);
      if (trackName) {
        interests.add(trackName);
        continue;
      }
      const topicId = ATOM_TO_TOPIC.get(atomId);
      if (topicId) {
        votes.add(topicId);
      }
    }

    if (term.triple) {
      const { predicate, object } = term.triple;
      // "attending" triple → session
      if (predicate?.term_id === ATTENDING_PREDICATE && object?.term_id) {
        const sessionId = ATOM_TO_SESSION.get(object.term_id);
        if (sessionId) {
          sessionIds.add(sessionId);
          publishedSessions.push(sessionId);
        }
      }
    }
  }

  // Note: Interests are no longer persisted to localStorage
  // They are derived from sessions in cart or synced from on-chain positions

  // Published sessions
  const existingPublished: string[] = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); }
    catch { return []; }
  })();
  for (const s of publishedSessions) {
    if (!existingPublished.includes(s)) existingPublished.push(s);
  }
  localStorage.setItem(STORAGE_KEYS.PUBLISHED_SESSIONS, JSON.stringify(existingPublished));

  // Published votes
  const existingVotes: string[] = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]"); }
    catch { return []; }
  })();
  for (const v of votes) {
    if (!existingVotes.includes(v)) existingVotes.push(v);
  }
  localStorage.setItem(STORAGE_KEYS.PUBLISHED_VOTES, JSON.stringify(existingVotes));

  // Save profile data including atomId for notifications
  const profile = {
    atomId,
    address,
    interests: [...interests],
    sessions: [...sessionIds],
    votes: [...votes],
  };
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));

  return {
    interests: [...interests],
    sessions: [...sessionIds],
    votes: [...votes],
    atomId,
  };
}
