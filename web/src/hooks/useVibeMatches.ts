import { useState, useEffect, useRef } from "react";
import { GQL_URL } from "../config/constants";
import { GraphQLClient } from "@ethcc/graphql";
import { TRACK_ATOM_IDS, SESSION_ATOM_IDS, PREDICATES } from "../services/intuition";
import topicGraph from "../../../bdd/web3_topics_graph.json";

const TOPIC_ATOM_IDS = topicGraph.topicAtomIds as Record<string, string>;
const client = new GraphQLClient({ endpoint: GQL_URL });

export interface VibeMatch {
  subjectTermId: string;
  label: string;
  sharedTopics: string[];
  sharedSessions: string[];
  matchScore: number;
  trackScore: number;
  voteScore: number;
  sessionScore: number;
}

// Reverse lookups
const ATOM_TO_TRACK = new Map(Object.entries(TRACK_ATOM_IDS).map(([k, v]) => [v, k]));
const ATOM_TO_VOTE = new Map(Object.entries(TOPIC_ATOM_IDS).map(([k, v]) => [v, k]));
const ATOM_TO_SESSION = new Map(Object.entries(SESSION_ATOM_IDS).map(([k, v]) => [v, k]));

const POLL_INTERVAL = 30_000; // 30s

/**
 * Find users who share interests, votes, and sessions.
 * Uses 2 flat queries (positions + triples) instead of N aliased queries.
 * Polls every 30s for real-time discovery.
 */
export function useVibeMatches(
  topics: Set<string>,
  sessionIds: string[],
  walletAddress: string,
  votedTopicIds?: string[],
  refreshKey?: number
): { matches: VibeMatch[]; loading: boolean } {
  const [matches, setMatches] = useState<VibeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const trackIds = [...topics].map((t) => TRACK_ATOM_IDS[t]).filter(Boolean);
    const voteAtomIds = (votedTopicIds ?? []).map((t) => TOPIC_ATOM_IDS[t]).filter(Boolean);
    const sessAtomIds = sessionIds.map((id) => SESSION_ATOM_IDS[id]).filter(Boolean);
    const allAtomIds = [...trackIds, ...voteAtomIds];

    if (allAtomIds.length === 0 && sessAtomIds.length === 0) return;
    if (!walletAddress) return;

    const addr = walletAddress.toLowerCase();
    const topicList = [...topics];
    const voteTopicList = votedTopicIds ?? [];

    async function fetchMatches() {
      if (!mountedRef.current) return;
      setLoading(true);

      try {
        // Query 1: All positions on interest + vote atoms in ONE query
        const positionsData = allAtomIds.length > 0
          ? await client.request<{ positions: { account_id: string; term_id: string; shares: string }[] }>(
              `query($ids: [String!]!) {
                positions(where: { term_id: { _in: $ids }, shares: { _gt: "0" } }, limit: 500) {
                  account_id term_id shares
                }
              }`,
              { ids: allAtomIds }
            )
          : { positions: [] };

        // Query 2: All attending triples for user's sessions in ONE query
        const triplesData = sessAtomIds.length > 0
          ? await client.request<{ triples: { subject: { term_id: string; label: string }; object: { term_id: string } }[] }>(
              `query($predId: String!, $objIds: [String!]!) {
                triples(where: {
                  predicate: { term_id: { _eq: $predId } }
                  object: { term_id: { _in: $objIds } }
                }, limit: 500) {
                  subject { term_id label }
                  object { term_id }
                }
              }`,
              { predId: PREDICATES["attending"], objIds: sessAtomIds }
            )
          : { triples: [] };

        if (!mountedRef.current) return;

        // Build user map
        const userMap = new Map<string, {
          label: string; tracks: Set<string>; votes: Set<string>; sessions: Set<string>;
        }>();

        function ensureUser(id: string, label: string) {
          const key = id.toLowerCase();
          if (!userMap.has(key)) {
            userMap.set(key, { label, tracks: new Set(), votes: new Set(), sessions: new Set() });
          }
          return userMap.get(key)!;
        }

        // Process positions → map to tracks or votes via reverse lookup
        for (const pos of positionsData.positions) {
          if (!pos.account_id) continue;
          const trackName = ATOM_TO_TRACK.get(pos.term_id);
          const voteName = ATOM_TO_VOTE.get(pos.term_id);
          const u = ensureUser(pos.account_id, pos.account_id);
          if (trackName) u.tracks.add(trackName);
          if (voteName) u.votes.add(voteName);
        }

        // Process triples → sessions (use label as key, not term_id)
        for (const triple of triplesData.triples) {
          const sessId = ATOM_TO_SESSION.get(triple.object.term_id);
          if (sessId && triple.subject.label) {
            const u = ensureUser(triple.subject.label, triple.subject.label);
            u.sessions.add(sessId);
          }
        }

        // Score
        const totalTracks = topicList.length;
        const totalVotes = voteTopicList.length;
        const totalSessions = sessionIds.length;

        const result: VibeMatch[] = [];
        for (const [id, info] of userMap) {
          if (id === addr) continue;

          const trackScore = totalTracks > 0 ? Math.round((info.tracks.size / totalTracks) * 100) : 0;
          const voteScore = totalVotes > 0 ? Math.round((info.votes.size / totalVotes) * 100) : 0;
          const sessionScore = totalSessions > 0 ? Math.round((info.sessions.size / totalSessions) * 100) : 0;

          let totalWeight = 0, weightedSum = 0;
          if (totalTracks > 0) { weightedSum += trackScore * 0.4; totalWeight += 0.4; }
          if (totalVotes > 0) { weightedSum += voteScore * 0.35; totalWeight += 0.35; }
          if (totalSessions > 0) { weightedSum += sessionScore * 0.25; totalWeight += 0.25; }
          const matchScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

          if (matchScore === 0) continue;

          result.push({
            subjectTermId: id, label: info.label,
            sharedTopics: [...info.tracks, ...info.votes],
            sharedSessions: [...info.sessions],
            matchScore, trackScore, voteScore, sessionScore,
          });
        }

        result.sort((a, b) => b.matchScore - a.matchScore);
        if (mountedRef.current) setMatches(result);
      } catch { /* ignore */ }
      finally { if (mountedRef.current) setLoading(false); }
    }

    fetchMatches();
    // Poll only when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchMatches();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    [...topics].sort().join(","),
    sessionIds.sort().join(","),
    (votedTopicIds ?? []).sort().join(","),
    walletAddress,
    refreshKey,
  ]);

  return { matches, loading };
}
