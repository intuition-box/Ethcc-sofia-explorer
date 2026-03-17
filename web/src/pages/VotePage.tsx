import { useState, useMemo, useCallback, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT } from "../config/theme";
import { categories, allTopics } from "../data/topics";
import type { Web3Category } from "../types";
import { useCart } from "../hooks/useCart";
import { Spark } from "../components/ui/Spark";
import { fetchTrendingTopics, fetchAllTopicEvents, type TopicVaultData } from "../services/trendingService";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { resolveTopicAtomIds } from "../services/voteService";
import { CHAIN_CONFIG } from "../config/constants";

// ─── Icon name → emoji mapping ───────────────────────

const ICON_EMOJI: Record<string, string> = {
  "chart-line": "📊",
  image: "🖼️",
  layers: "🔗",
  shield: "🔒",
  brain: "🤖",
  lock: "🛡️",
  users: "🏛️",
  wrench: "🛠️",
  "dollar-sign": "💲",
  building: "🏠",
  gamepad: "🎮",
  fingerprint: "👤",
  cube: "⚙️",
  server: "🥩",
  link: "🌐",
  gavel: "⚖️",
  fire: "🔥",
  "bar-chart": "📈",
  leaf: "🌿",
  rocket: "🚀",
};

function getIconEmoji(iconName: string): string {
  return ICON_EMOJI[iconName] ?? "📌";
}

// ─── Helpers ─────────────────────────────────────────

function generateTrendData(): number[] {
  const pts: number[] = [];
  let v = 20 + Math.random() * 60;
  for (let i = 0; i < 20; i++) {
    v += (Math.random() - 0.45) * 10;
    v = Math.max(5, Math.min(95, v));
    pts.push(v);
  }
  return pts;
}

/** Format wei string to human-readable TRUST amount */
function formatTrust(wei: string): string {
  const val = Number(BigInt(wei)) / 1e18;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  if (val >= 1) return val.toFixed(2);
  if (val >= 0.01) return val.toFixed(3);
  if (val > 0) return val.toFixed(4);
  return "0";
}

const VOTE_STORAGE_KEY = "ethcc-votes";

function loadVotes(): Set<string> {
  try {
    const raw = localStorage.getItem(VOTE_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveVotes(votes: Set<string>) {
  localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify([...votes]));
}

// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  color: C.textPrimary,
  fontFamily: FONT,
  overflow: "hidden",
};

const heroBox: CSSProperties = {
  background: "#D790C7",
  borderRadius: `0 0 ${R.xl}px ${R.xl}px`,
  padding: "0 0 24px",
  color: C.dark,
  overflow: "hidden",
  boxSizing: "border-box",
};

const statRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  marginTop: 12,
  padding: "0 20px",
};

const statItem: CSSProperties = {
  flex: 1,
  textAlign: "center" as const,
};

const statVal: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  fontFamily: FONT,
};

const statLabel: CSSProperties = {
  fontSize: 11,
  opacity: 0.6,
  marginTop: 2,
};

// bendsWrap removed

const tabRow: CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "12px 16px 8px",
  overflowX: "auto",
  flexShrink: 0,
};

const tabBtn = (active: boolean): CSSProperties => ({
  padding: "8px 18px",
  borderRadius: R.btn,
  border: "none",
  background: active ? "#D790C7" : C.surfaceGray,
  color: active ? "#0a0a0a" : C.textSecondary,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
});

const topicCard: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 10px",
  padding: 14,
  background: "rgba(22,22,24,0.29)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const topicIcon: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: R.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  flexShrink: 0,
};

const topicInfo: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const topicName: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: C.textPrimary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const topicMeta: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  marginTop: 2,
};

// voteCount inlined in topicMeta

const supportBtn = (state: "support" | "supported" | "redeem"): CSSProperties => ({
  padding: "6px 14px",
  borderRadius: R.btn,
  border: "none",
  background: state === "redeem" ? C.errorLight : state === "supported" ? C.successLight : "#D790C7",
  color: state === "redeem" ? C.error : state === "supported" ? C.success : "#0a0a0a",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
});

// Discover card styles
const discoverCard: CSSProperties = {
  ...glassSurface,
  margin: "0 16px",
  padding: 16,
  textAlign: "center" as const,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const discoverName: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: C.textPrimary,
};

const discoverDesc: CSSProperties = {
  fontSize: 13,
  color: C.textSecondary,
  lineHeight: 1.5,
  maxWidth: "100%",
  padding: "0 8px",
  boxSizing: "border-box" as const,
};

const discoverActions: CSSProperties = {
  display: "flex",
  gap: 16,
  marginTop: 12,
  padding: "0 16px",
  justifyContent: "center",
  flexShrink: 0,
};

// Skip/Like buttons inlined in discover section

// Portfolio styles
const portfolioCard: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 10px",
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const withdrawBtn: CSSProperties = {
  padding: "6px 14px",
  borderRadius: R.btn,
  border: `1px solid ${C.error}`,
  background: "transparent",
  color: C.error,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
  flexShrink: 0,
};

const perfBadge = (up: boolean): CSSProperties => ({
  fontSize: 12,
  fontWeight: 600,
  color: up ? C.success : C.error,
  marginRight: 8,
});

// ─── Component ───────────────────────────────────────

type Tab = "trending" | "myvotes" | "discover";

export default function VotePage() {
  const navigate = useNavigate();
  const { wallet, connect: openWalletModal } = useWalletConnection();
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("discover");
  const [userVotes, setUserVotes] = useState<Set<string>>(() => loadVotes());
  const [discoverIdx, setDiscoverIdx] = useState(0);
  const { addToCart, removeFromCart } = useCart();

  // ─── Real Intuition data ───────────────────────────
  const [realTrending, setRealTrending] = useState<TopicVaultData[]>([]);
  const [realChartData, setRealChartData] = useState<Map<string, number[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const hasRealData = realTrending.length > 0;

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTrendingTopics(), fetchAllTopicEvents()])
      .then(([trending, charts]) => {
        setRealTrending(trending);
        setRealChartData(charts);
      })
      .catch(() => { /* GraphQL failed — keep mock fallback */ })
      .finally(() => setLoading(false));
  }, []);

  // Index real trending data by topicId for quick lookup
  const realDataMap = useMemo(() => {
    const m = new Map<string, TopicVaultData>();
    for (const t of realTrending) m.set(t.topicId, t);
    return m;
  }, [realTrending]);

  // Persist votes
  useEffect(() => {
    saveVotes(userVotes);
  }, [userVotes]);

  // Pre-generate trend data per topic (stable across renders)
  const trendDataMap = useMemo(() => {
    const m = new Map<string, number[]>();
    allTopics.forEach((t) => m.set(t.id, generateTrendData()));
    return m;
  }, []);

  // Simulated vote counts
  const voteCountMap = useMemo(() => {
    const m = new Map<string, number>();
    allTopics.forEach((t) => {
      m.set(t.id, Math.floor(Math.random() * 200) + 5);
    });
    return m;
  }, []);

  // Category lookup
  const categoryMap = useMemo(() => {
    const m = new Map<string, Web3Category>();
    categories.forEach((c) => c.topics.forEach((t) => m.set(t.id, c)));
    return m;
  }, []);

  // Sorted topics for trending — prefer real on-chain data for ordering
  const trendingTopics = useMemo(() => {
    if (hasRealData) {
      return [...allTopics].sort((a, b) => {
        const aData = realDataMap.get(a.id);
        const bData = realDataMap.get(b.id);
        const aAssets = aData ? BigInt(aData.supportAssets) : 0n;
        const bAssets = bData ? BigInt(bData.supportAssets) : 0n;
        return Number(bAssets - aAssets);
      });
    }
    return [...allTopics].sort((a, b) => (voteCountMap.get(b.id) ?? 0) - (voteCountMap.get(a.id) ?? 0));
  }, [voteCountMap, hasRealData, realDataMap]);

  // My voted topics
  const myVotedTopics = useMemo(() => {
    return allTopics.filter((t) => userVotes.has(t.id));
  }, [userVotes]);

  // Unvoted for discover
  const unvotedTopics = useMemo(() => {
    return allTopics.filter((t) => !userVotes.has(t.id));
  }, [userVotes]);

  // Track "redeem" state per topic
  const [redeemState, setRedeemState] = useState<Set<string>>(new Set());

  const handleVoteClick = useCallback((topicId: string) => {
    const supported = userVotes.has(topicId);
    const inRedeem = redeemState.has(topicId);

    if (!supported) {
      // Support → add to cart (on-chain deposit happens at cart validation)
      setUserVotes((prev) => { const next = new Set(prev); next.add(topicId); return next; });
      addToCart(topicId);
    } else if (!inRedeem) {
      // Supported → show Redeem
      setRedeemState((prev) => { const next = new Set(prev); next.add(topicId); return next; });
    } else {
      // Redeem → remove from votes + cart, clear redeem
      setUserVotes((prev) => { const next = new Set(prev); next.delete(topicId); return next; });
      removeFromCart(topicId);
      setRedeemState((prev) => { const next = new Set(prev); next.delete(topicId); return next; });
    }
  }, [userVotes, redeemState, addToCart, removeFromCart]);

  const getVoteLabel = (topicId: string) => {
    if (!userVotes.has(topicId)) return "Support";
    if (redeemState.has(topicId)) return "Redeem";
    return "Supported";
  };

  const handleSkip = () => setDiscoverIdx((i) => i + 1);
  const handleSupport = () => {
    if (discoverIdx < unvotedTopics.length) {
      handleVoteClick(unvotedTopics[discoverIdx].id);
      setDiscoverIdx((i) => i + 1);
    }
  };

  // Category distribution colors for CBends
  // catBends removed

  const totalSupported = userVotes.size;

  // Real aggregate stats
  const realStats = useMemo(() => {
    if (!hasRealData) return null;
    let totalAssets = 0n;
    let totalSupporters = 0;
    let topicsWithVotes = 0;
    for (const t of realTrending) {
      totalAssets += BigInt(t.supportAssets);
      totalSupporters += t.supportCount;
      if (t.supportCount > 0) topicsWithVotes++;
    }
    return {
      totalTrust: formatTrust(totalAssets.toString()),
      supporters: totalSupporters,
      activeTopics: topicsWithVotes,
    };
  }, [hasRealData, realTrending]);

  return (
    <div style={page}>
      {/* Fixed color background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "#D790C7", borderRadius: `0 0 ${R.xl}px ${R.xl}px`, zIndex: 0 }} />

      {/* Scrollable content - hero + tabs + list */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 24, position: "relative", zIndex: 1 }}>
      {/* Hero stats */}
      <div style={{ ...heroBox, background: "transparent" }}>
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1 }}>Topic<br/>Market</div>
        </div>
        <div style={statRow}>
          <div style={statItem}>
            <div style={statVal}>{realStats ? realStats.activeTopics : "-"}</div>
            <div style={statLabel}>Active Topics</div>
          </div>
          <div style={statItem}>
            <div style={statVal}>{realStats ? realStats.totalTrust : "-"}</div>
            <div style={statLabel}>TRUST Staked</div>
          </div>
          <div style={statItem}>
            <div style={statVal}>{realStats ? realStats.supporters : "-"}</div>
            <div style={statLabel}>Supporters</div>
          </div>
          <div style={statItem}>
            <div style={statVal}>{totalSupported || "-"}</div>
            <div style={statLabel}>My Votes</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabRow}>
        <button style={tabBtn(tab === "discover")} onClick={() => setTab("discover")}>
          Discover
        </button>
        <button style={tabBtn(tab === "trending")} onClick={() => setTab("trending")}>
          Trending
        </button>
        <button style={tabBtn(tab === "myvotes")} onClick={() => setTab("myvotes")}>
          My Votes
        </button>
      </div>

      {/* ─── Trending ────────────────────── */}
      {tab === "trending" && (
        <div>
          {loading && (
            <div style={{ textAlign: "center", padding: 32, color: C.textTertiary, fontSize: 13 }}>
              Loading on-chain data...
            </div>
          )}
          {!loading && trendingTopics.map((topic) => {
            const cat = categoryMap.get(topic.id);
            const supported = userVotes.has(topic.id);
            const rd = realDataMap.get(topic.id);
            const count = rd ? rd.supportCount : (voteCountMap.get(topic.id) ?? 0);
            const trustLabel = rd && BigInt(rd.supportAssets) > 0n ? ` · ${formatTrust(rd.supportAssets)} TRUST` : "";
            const trend = realChartData.get(topic.id) ?? trendDataMap.get(topic.id) ?? [];
            return (
              <div key={topic.id} style={topicCard}>
                {/* Row 1: icon + name + votes */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ ...topicIcon, background: cat ? `${cat.color}22` : C.primaryLight }}>
                    {getIconEmoji(cat?.icon ?? "")}
                  </div>
                  <div style={topicInfo}>
                    <div style={topicName}>{topic.name}</div>
                    <div style={topicMeta}>{cat?.name ?? "Other"} &middot; {count} votes{trustLabel}</div>
                  </div>
                </div>
                {/* Row 2: spark + support */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Spark data={trend} color={cat?.color ?? C.primary} h={28} />
                  </div>
                  <button
                    style={supportBtn(!supported ? "support" : redeemState.has(topic.id) ? "redeem" : "supported")}
                    onClick={() => handleVoteClick(topic.id)}
                  >
                    {getVoteLabel(topic.id)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── My Votes (Portfolio) ─────────── */}
      {tab === "myvotes" && (
        <div>
          {myVotedTopics.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: C.textTertiary,
                fontSize: 14,
              }}
            >
              No votes yet. Support topics from Trending or Discover.
            </div>
          ) : (
            myVotedTopics.map((topic) => {
              const cat = categoryMap.get(topic.id);
              const rd = realDataMap.get(topic.id);
              const hasOnChain = rd && rd.supportCount > 0;
              const perfUp = Math.random() > 0.3;
              const perfPct = (Math.random() * 40 + 2).toFixed(1);
              return (
                <div
                  key={topic.id}
                  style={{ ...portfolioCard, cursor: "pointer" }}
                  onClick={() => navigate(`/topic/${topic.id}`)}
                >
                  <div
                    style={{
                      ...topicIcon,
                      background: cat ? `${cat.color}22` : C.primaryLight,
                    }}
                  >
                    {getIconEmoji(cat?.icon ?? "")}
                  </div>
                  <div style={topicInfo}>
                    <div style={topicName}>{topic.name}</div>
                    <div style={topicMeta}>
                      {cat?.name ?? "Other"}
                      {hasOnChain
                        ? ` · ${rd.supportCount} votes · ${formatTrust(rd.supportAssets)} TRUST`
                        : ""}
                    </div>
                  </div>
                  <span style={perfBadge(perfUp)}>
                    {perfUp ? "+" : "-"}{perfPct}%
                  </span>
                  <button
                    style={{ ...withdrawBtn, opacity: withdrawing === topic.id ? 0.5 : 1 }}
                    disabled={withdrawing === topic.id}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!wallet) { openWalletModal(); return; }
                      const { resolved } = resolveTopicAtomIds([topic.id]);
                      if (resolved.length === 0) {
                        // No on-chain atom — just remove locally
                        handleVoteClick(topic.id);
                        return;
                      }
                      const atomId = resolved[0].atomId;
                      setWithdrawing(topic.id);
                      try {
                        // Get max redeemable shares
                        const shares: bigint = await wallet.multiVault.maxRedeem(
                          wallet.address, atomId, CHAIN_CONFIG.CURVE_ID
                        );
                        if (shares === 0n) {
                          // No on-chain position — just remove locally
                          handleVoteClick(topic.id);
                          return;
                        }
                        // Preview to get min assets (5% slippage)
                        const [expectedAssets] = await wallet.multiVault.previewRedeem(
                          atomId, CHAIN_CONFIG.CURVE_ID, shares
                        );
                        const minAssets = (expectedAssets * 95n) / 100n;
                        // Redeem
                        const tx = await wallet.multiVault.redeem(
                          wallet.address, atomId, CHAIN_CONFIG.CURVE_ID, shares, minAssets
                        );
                        await tx.wait();
                        // Remove from local state
                        handleVoteClick(topic.id);
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : "";
                        if (!msg.includes("user rejected")) {
                          console.warn("[Withdraw] Failed:", msg);
                        }
                      } finally {
                        setWithdrawing(null);
                      }
                    }}
                  >
                    {withdrawing === topic.id ? "Withdrawing..." : "Withdraw"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── Discover (Swipe) ─────────────── */}
      {tab === "discover" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {discoverIdx >= unvotedTopics.length ? (
            <div style={discoverCard}>
              <div style={{ fontSize: 36 }}>&#127881;</div>
              <div style={discoverName}>All Explored!</div>
              <div style={discoverDesc}>
                You've seen all {allTopics.length} topics. Check your votes in the My Votes tab.
              </div>
            </div>
          ) : (
            (() => {
              const topic = unvotedTopics[discoverIdx];
              const cat = categoryMap.get(topic.id);
              const trend = realChartData.get(topic.id) ?? trendDataMap.get(topic.id) ?? [];
              return (
                <>
                  <div style={{
                    ...glassSurface, margin: "0 16px", padding: "28px 20px",
                    background: "rgba(22,22,24,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                    minHeight: 280,
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 56, height: 56, borderRadius: R.lg,
                      background: cat ? `${cat.color}22` : C.primaryLight,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                    }}>
                      {getIconEmoji(cat?.icon ?? "")}
                    </div>

                    {/* Topic name */}
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, textAlign: "center", lineHeight: 1.3 }}>
                      {topic.name}
                    </div>

                    {/* Type badge */}
                    <div style={{
                      padding: "4px 12px", borderRadius: R.btn,
                      background: "rgba(255,255,255,0.08)", fontSize: 11, color: C.textSecondary,
                    }}>
                      {topic.type}
                    </div>

                    {/* Description */}
                    <div style={{
                      fontSize: 13, color: C.textSecondary, lineHeight: 1.5,
                      textAlign: "center", maxWidth: "100%", padding: "0 8px",
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
                    }}>
                      {topic.description}
                    </div>

                    {/* Sparkline */}
                    <div style={{ width: "100%", marginTop: 4 }}>
                      <Spark data={trend} color={cat?.color ?? C.primary} h={32} />
                    </div>
                  </div>

                  {/* 2 buttons */}
                  <div style={discoverActions}>
                    <button
                      onClick={handleSkip}
                      style={{
                        flex: 1, height: 56, borderRadius: R.btn,
                        background: C.surfaceGray, color: C.textSecondary,
                        fontSize: 16, fontWeight: 600, border: "none",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 8, fontFamily: FONT,
                      }}
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleSupport}
                      style={{
                        flex: 1, height: 56, borderRadius: R.btn,
                        background: "#D790C7", color: "#0a0a0a",
                        fontSize: 16, fontWeight: 600, border: "none",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 8, fontFamily: FONT,
                      }}
                    >
                      Support
                    </button>
                  </div>
                </>
              );
            })()
          )}
        </div>
      )}
      </div>
    </div>
  );
}
