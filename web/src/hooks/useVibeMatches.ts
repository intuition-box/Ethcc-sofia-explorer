import { useState, useEffect, useRef } from "react";
import { GQL_URL } from "../config/constants";
import { TRACK_ATOM_IDS, SESSION_ATOM_IDS, PREDICATES } from "../services/intuition";

export interface VibeMatch {
  subjectTermId: string;
  label: string; // wallet address
  sharedTopics: string[];
  sharedSessions: string[];
  matchScore: number;
}

/**
 * Query Intuition GraphQL for other users who share the same
 * "are interested by" topics and "attending" sessions.
 */
export function useVibeMatches(
  topics: Set<string>,
  sessionIds: string[],
  walletAddress: string
): { matches: VibeMatch[]; loading: boolean } {
  const [matches, setMatches] = useState<VibeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  // Stabilize deps - only fetch once when wallet address is set
  const topicsKey = [...topics].sort().join(",");
  const sessionsKey = sessionIds.sort().join(",");

  useEffect(() => {
    // Only fetch once per unique combination
    if (fetchedRef.current) return;

    const trackIds = [...topics].map((t) => TRACK_ATOM_IDS[t]).filter(Boolean);
    const sessAtomIds = sessionIds.map((id) => SESSION_ATOM_IDS[id]).filter(Boolean);

    if ((trackIds.length === 0 && sessAtomIds.length === 0) || !walletAddress) return;

    fetchedRef.current = true;

    setLoading(true);

    // Build batched aliases: topics as t0..tN, sessions as s0..sM
    const topicAliases = trackIds
      .map(
        (id, i) => `
        t${i}: triples(where: {
          predicate: { term_id: { _eq: "${PREDICATES["are interested by"]}" } }
          object: { term_id: { _eq: "${id}" } }
        }) { subject { term_id label } }`
      )
      .join("");

    const sessionAliases = sessAtomIds
      .map(
        (id, i) => `
        s${i}: triples(where: {
          predicate: { term_id: { _eq: "${PREDICATES["attending"]}" } }
          object: { term_id: { _eq: "${id}" } }
        }) { subject { term_id label } }`
      )
      .join("");

    const query = `{ ${topicAliases} ${sessionAliases} }`;

    fetch(GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((res) => {
        const data = res.data ?? {};
        const topicList = [...topics];

        // Accumulate per-user: shared topics + shared sessions
        const userMap = new Map<
          string,
          { label: string; topics: Set<string>; sessions: Set<string> }
        >();

        function ensureUser(termId: string, label: string) {
          if (!userMap.has(termId)) {
            userMap.set(termId, { label, topics: new Set(), sessions: new Set() });
          }
          return userMap.get(termId)!;
        }

        // Process topic triples
        trackIds.forEach((id, i) => {
          const triples = data[`t${i}`] ?? [];
          const topicName = topicList.find((t) => TRACK_ATOM_IDS[t] === id) ?? "";
          for (const triple of triples) {
            const u = ensureUser(triple.subject.term_id, triple.subject.label);
            u.topics.add(topicName);
          }
        });

        // Process session triples
        sessAtomIds.forEach((id, i) => {
          const triples = data[`s${i}`] ?? [];
          const sessId = sessionIds.find((sid) => SESSION_ATOM_IDS[sid] === id) ?? "";
          for (const triple of triples) {
            const u = ensureUser(triple.subject.term_id, triple.subject.label);
            u.sessions.add(sessId);
          }
        });

        // Convert to array, exclude current user, sort by score
        const addr = walletAddress.toLowerCase();
        const result: VibeMatch[] = [];

        for (const [termId, info] of userMap) {
          if (info.label.toLowerCase() === addr) continue;
          result.push({
            subjectTermId: termId,
            label: info.label,
            sharedTopics: [...info.topics],
            sharedSessions: [...info.sessions],
            matchScore: info.topics.size + info.sessions.size,
          });
        }

        result.sort((a, b) => b.matchScore - a.matchScore);
        setMatches(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey, sessionsKey, walletAddress]);

  return { matches, loading };
}
