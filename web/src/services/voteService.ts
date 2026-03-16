import topicGraph from "../../../bdd/web3_topics_graph.json";
import { DEFAULT_DEPOSIT_PER_TRIPLE } from "../config/constants";
import type { WalletConnection } from "./intuition";
import { approveProxy, depositOnAtoms } from "./intuition";

const TOPIC_ATOM_IDS = topicGraph.topicAtomIds as Record<string, string>;

// ─── Types ───────────────────────────────────────────────────────

export interface VoteResult {
  hash: string;
  blockNumber: number;
  topicCount: number;
}

// ─── Resolve topic IDs to atom IDs ───────────────────────────────

export function getTopicAtomId(topicId: string): string | null {
  return TOPIC_ATOM_IDS[topicId] ?? null;
}

export function resolveTopicAtomIds(topicIds: string[]): {
  resolved: { topicId: string; atomId: string }[];
  missing: string[];
} {
  const resolved: { topicId: string; atomId: string }[] = [];
  const missing: string[] = [];
  for (const id of topicIds) {
    const atomId = TOPIC_ATOM_IDS[id];
    if (atomId) resolved.push({ topicId: id, atomId });
    else missing.push(id);
  }
  return { resolved, missing };
}

// ─── Submit votes on-chain (deposit into atom vaults) ────────────

/**
 * Deposit into topic atom vaults to signal support.
 * No triples created — users are identified by their vault positions.
 * 1. Approves proxy (if needed)
 * 2. Batch deposits into all selected topic atom vaults
 */
export async function submitVotes(
  wallet: WalletConnection,
  topicIds: string[],
  depositPerAtom?: bigint,
  onStep?: (step: string) => void
): Promise<VoteResult> {
  const { resolved, missing } = resolveTopicAtomIds(topicIds);

  if (resolved.length === 0) {
    throw new Error(
      `No valid topics to vote on.${missing.length > 0 ? ` Missing: ${missing.join(", ")}` : ""}`
    );
  }

  // Step 1: Approve proxy
  onStep?.("Approving proxy contract...");
  try {
    await approveProxy(wallet.multiVault);
  } catch {
    // Already approved — ignore
  }

  // Step 2: Deposit into atom vaults
  const atomIds = resolved.map((r) => r.atomId);
  const deposit = depositPerAtom ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);

  const result = await depositOnAtoms(wallet, atomIds, deposit, onStep);

  return {
    hash: result.hash,
    blockNumber: result.blockNumber,
    topicCount: resolved.length,
  };
}
