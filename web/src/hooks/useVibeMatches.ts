import { useState, useEffect, useRef, useMemo } from "react";
import { GQL_URL } from "../config/constants";
import {
  GraphQLClient,
  GET_VIBE_MATCH_POSITIONS,
  GET_VIBE_MATCH_SESSIONS,
  type GetVibeMatchPositionsQuery,
  type GetVibeMatchSessionsQuery,
} from "@ethcc/graphql";
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
 * Uses type-safe codegen queries instead of inline strings.
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
  const loadingStartRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Memoize atom IDs to avoid recalculation
  const allTrackIds = useMemo(() => Object.values(TRACK_ATOM_IDS).filter(Boolean), []);
  const voteAtomIds = useMemo(
    () => (votedTopicIds ?? []).map((t) => TOPIC_ATOM_IDS[t]).filter(Boolean),
    [votedTopicIds]
  );
  const sessAtomIds = useMemo(
    () => sessionIds.map((id) => SESSION_ATOM_IDS[id]).filter(Boolean),
    [sessionIds]
  );

  // Memoize combined atom list
  const allAtomIds = useMemo(
    () => [...allTrackIds, ...voteAtomIds],
    [allTrackIds, voteAtomIds]
  );

  useEffect(() => {
    if (allAtomIds.length === 0 && sessAtomIds.length === 0) return;
    if (!walletAddress) return;

    const addr = walletAddress.toLowerCase();
    const topicList = [...topics];
    const voteTopicList = votedTopicIds ?? [];

    async function fetchMatches() {
      if (!mountedRef.current) return;

      // Cancel previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setMatches([]); // Clear matches when starting a new fetch
      loadingStartRef.current = Date.now();

      try {
        // Query 1: All positions on interest + vote atoms using codegen query
        const positionsData = allAtomIds.length > 0
          ? await client.request<GetVibeMatchPositionsQuery>(
              GET_VIBE_MATCH_POSITIONS,
              { atomIds: allAtomIds }
            )
          : { positions: [] };

        // Query 2: All attending triples for user's sessions using codegen query
        const triplesData = sessAtomIds.length > 0
          ? await client.request<GetVibeMatchSessionsQuery>(
              GET_VIBE_MATCH_SESSIONS,
              { predicateId: PREDICATES["attending"], sessionAtomIds: sessAtomIds }
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
          if (!triple.object || !triple.subject) continue;
          const sessId = ATOM_TO_SESSION.get(triple.object.term_id);
          if (sessId && triple.subject.label) {
            const u = ensureUser(triple.subject.label, triple.subject.label);
            u.sessions.add(sessId);
          }
        }

        // Score — Jaccard similarity (intersection / union) per dimension
        const myTracks = new Set(topicList);
        const myVotes = new Set(voteTopicList);
        const mySessions = new Set(sessionIds);

        const result: VibeMatch[] = [];
        for (const [id, info] of userMap) {
          if (id === addr) continue;

          // Shared = intersection, union = both sets combined
          const sharedTracks = [...info.tracks].filter((t) => myTracks.has(t));
          const sharedVotes = [...info.votes].filter((v) => myVotes.has(v));
          const sharedSess = [...info.sessions].filter((s) => mySessions.has(s));

          const trackUnion = new Set([...myTracks, ...info.tracks]).size;
          const voteUnion = new Set([...myVotes, ...info.votes]).size;
          const sessionUnion = new Set([...mySessions, ...info.sessions]).size;

          const trackScore = trackUnion > 0 ? Math.round((sharedTracks.length / trackUnion) * 100) : 0;
          const voteScore = voteUnion > 0 ? Math.round((sharedVotes.length / voteUnion) * 100) : 0;
          const sessionScore = sessionUnion > 0 ? Math.round((sharedSess.length / sessionUnion) * 100) : 0;

          let totalWeight = 0, weightedSum = 0;
          if (myTracks.size > 0) { weightedSum += trackScore * 0.4; totalWeight += 0.4; }
          if (myVotes.size > 0) { weightedSum += voteScore * 0.35; totalWeight += 0.35; }
          if (mySessions.size > 0) { weightedSum += sessionScore * 0.25; totalWeight += 0.25; }
          const matchScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

          if (matchScore === 0) continue;

          result.push({
            subjectTermId: id, label: info.label,
            sharedTopics: [...sharedTracks, ...sharedVotes],
            sharedSessions: sharedSess,
            matchScore, trackScore, voteScore, sessionScore,
          });
        }

        result.sort((a, b) => b.matchScore - a.matchScore);

        // Check if this request was aborted
        if (controller.signal.aborted) {
          return;
        }

        // Wait for minimum delay, then update both matches and loading state together
        if (mountedRef.current && loadingStartRef.current) {
          const elapsed = Date.now() - loadingStartRef.current;
          const minDelay = 1000; // 1 second minimum
          if (elapsed < minDelay) {
            setTimeout(() => {
              if (mountedRef.current && !controller.signal.aborted) {
                setMatches(result);
                setLoading(false);
                abortControllerRef.current = null;
              }
            }, minDelay - elapsed);
          } else {
            setMatches(result);
            setLoading(false);
            abortControllerRef.current = null;
          }
        }
      } catch (err) {
        console.warn('[useVibeMatches] Fetch failed:', err);
        // Stop loading even if fetch fails
        if (mountedRef.current) {
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    }

    fetchMatches();
    // Poll only when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchMatches();
    }, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      // Cancel ongoing fetch when effect cleans up
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [topics, sessionIds, votedTopicIds, walletAddress, refreshKey, allAtomIds, sessAtomIds]);

  return { matches, loading };
}
