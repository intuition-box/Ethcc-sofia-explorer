import { useState, useEffect } from "react";
import { GQL_URL } from "../config/constants";
import { TRACK_ATOM_IDS } from "../services/intuition";

/**
 * Count how many users have deposited (taken a position) on each track atom.
 * Position-based: reads vault positions instead of triples.
 */
export function useInterestCounts(topics: Set<string>): Record<string, number> {
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (topics.size === 0) return;
    const trackIds = [...topics]
      .map((t) => TRACK_ATOM_IDS[t])
      .filter(Boolean);
    if (trackIds.length === 0) return;

    const query = `{
      ${trackIds.map((id, i) => `
        p${i}: positions_aggregate(where: {
          atom: { term_id: { _eq: "${id}" } }
          shares: { _gt: "0" }
        }) { aggregate { count } }
      `).join("")}
    }`;

    fetch(GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((res) => {
        const counts: Record<string, number> = {};
        const topicList = [...topics];
        trackIds.forEach((id, i) => {
          const c = res.data?.[`p${i}`]?.aggregate?.count ?? 0;
          const name = topicList.find((t) => TRACK_ATOM_IDS[t] === id);
          if (name) counts[name] = c;
        });
        setInterestCounts(counts);
      })
      .catch(() => {});
  }, [topics]);

  return interestCounts;
}
