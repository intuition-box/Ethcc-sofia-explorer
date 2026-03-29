import { useState, useEffect } from "react";
import { GQL_URL } from "../config/constants";
import { GraphQLClient, GET_POSITIONS_BY_ATOMS, type GetPositionsByAtomsQuery } from "@ethcc/graphql";
import { TRACK_ATOM_IDS } from "../services/intuition";

/**
 * Count how many users have deposited (taken a position) on each track atom.
 * Position-based: reads vault positions instead of triples.
 * Now uses type-safe codegen query instead of inline string interpolation.
 */
export function useInterestCounts(topics: Set<string>): Record<string, number> {
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (topics.size === 0) return;
    const trackIds = [...topics]
      .map((t) => TRACK_ATOM_IDS[t])
      .filter(Boolean);
    if (trackIds.length === 0) return;

    const client = new GraphQLClient({ endpoint: GQL_URL });
    client.request<GetPositionsByAtomsQuery>(GET_POSITIONS_BY_ATOMS, { atomIds: trackIds })
      .then((data) => {
        // Count unique accounts per atom
        const counts: Record<string, number> = {};
        const atomToTrack = new Map(Object.entries(TRACK_ATOM_IDS).map(([k, v]) => [v, k]));

        const accountsByAtom = new Map<string, Set<string>>();
        for (const pos of data.positions) {
          const atomId = pos.term_id;
          if (!accountsByAtom.has(atomId)) {
            accountsByAtom.set(atomId, new Set());
          }
          accountsByAtom.get(atomId)!.add(pos.account_id);
        }

        for (const [atomId, accounts] of accountsByAtom) {
          const trackName = atomToTrack.get(atomId);
          if (trackName) {
            counts[trackName] = accounts.size;
          }
        }

        setInterestCounts(counts);
      })
      .catch((err) => {
        console.warn('[useInterestCounts] Failed to fetch interest counts from GraphQL:', err);
        // Continue silently - UI will show no counts (empty object)
      });
  }, [topics]);

  return interestCounts;
}
