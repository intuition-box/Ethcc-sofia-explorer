import { useState, useEffect, useMemo, type CSSProperties  } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT, getTrackStyle } from "../config/theme";
import { sessions, trackNames, ratingsGraph } from "../data";
import { allTopics, categories } from "../data/topics";
import { Ic } from "../components/ui/Icons";
import { useCart } from "../hooks/useCart";
import { StorageService } from "../services/StorageService";
import { CHAIN_CONFIG, STORAGE_KEYS, DEFAULT_DEPOSIT_PER_TRIPLE } from "../config/constants";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { useEmbeddedWallet } from "../contexts/EmbeddedWalletContext";
import { depositOnAtoms, ensureUserAtom, buildProfileTriples, createProfileTriples, TRACK_ATOM_IDS } from "../services/intuition";
import { avatarColor } from "../config/theme";
import { resolveTopicAtomIds } from "../services/voteService";
import {
  scrollContent,
  fluidContent,
  cardTitle,
  metaText,
  monoText,
  deleteBtn,
  accentBar,
  avatarSmall,
  iconBoxSmall,
  truncateLabel,
  getInitials,
} from "../styles/common";

// ─── Icon mapping (same as VotePage) ────────────────
const ICON_EMOJI: Record<string, string> = {
  "chart-line": "📊", image: "🖼️", layers: "🔗", shield: "🔒", brain: "🤖",
  lock: "🛡️", users: "🏛️", wrench: "🛠️", "dollar-sign": "💲", building: "🏠",
  gamepad: "🎮", fingerprint: "👤", cube: "⚙️", server: "🥩", link: "🌐",
  gavel: "⚖️", fire: "🔥", "bar-chart": "📈", leaf: "🌿", rocket: "🚀",
};

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─── Styles ─────────────────────────────────────────
const page: CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "transparent", fontFamily: FONT, color: C.textPrimary, overflow: "hidden",
};

const sectionWrap: CSSProperties = { padding: "0 20px", marginBottom: 20 };

const sectionHead: CSSProperties = {
  fontSize: 14, fontWeight: 700, color: C.textSecondary,
  textTransform: "uppercase" as const, letterSpacing: 1,
  marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
};

const pill: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 14px", borderRadius: R.btn, fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 6,
};

const card: CSSProperties = {
  ...glassSurface, display: "flex", gap: 12, padding: 12,
  marginBottom: 8, boxSizing: "border-box" as const, overflow: "hidden",
};

const summaryCard: CSSProperties = {
  ...glassSurface, padding: 16, margin: "0 20px 16px", boxSizing: "border-box" as const,
};

const summaryRow: CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "8px 0", fontSize: 13, color: C.textSecondary,
  borderBottom: `1px solid ${C.border}`, gap: 8,
};

const bottomBar: CSSProperties = {
  flexShrink: 0, padding: "12px 20px 24px",
  background: C.background, borderTop: `1px solid ${C.border}`, boxSizing: "border-box" as const,
};

const emptyState: CSSProperties = {
  textAlign: "center" as const, padding: "32px 20px", color: C.textTertiary, fontSize: 13,
};

const topSpacer: CSSProperties = { height: 12, flexShrink: 0 };

const emptyIcon: CSSProperties = { fontSize: 40, marginBottom: 12 };

const emptyTitle: CSSProperties = { fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 4 };

const sectionEmoji: CSSProperties = { fontSize: 16 };

const interestWrap: CSSProperties = { display: "flex", flexWrap: "wrap" };

const interestPill = (color: string): CSSProperties => ({
  ...pill, background: color, color: "#fff", cursor: "pointer",
});

const topicIconBox = (color: string | undefined): CSSProperties => ({
  width: 36, height: 36, borderRadius: R.md, flexShrink: 0,
  background: color ? `${color}22` : C.primaryLight,
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
});

const topicTitle: CSSProperties = {
  fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

const topicMeta = (color: string): CSSProperties => ({
  fontSize: 11, color, marginTop: 2,
});

const deleteBtnCentered: CSSProperties = {
  ...deleteBtn, alignSelf: "center",
};

const sessionSpeakers: CSSProperties = {
  fontSize: 11, color: C.textSecondary, marginTop: 2,
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

const sessionTrackMeta = (color: string): CSSProperties => ({
  fontSize: 11, color, marginTop: 2,
});

const ratingIconBox: CSSProperties = {
  width: 36, height: 36, borderRadius: R.md, flexShrink: 0,
  background: C.flatLight,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 14, fontWeight: 700, color: C.flat,
};

const summaryTitle: CSSProperties = { fontSize: 14, fontWeight: 700, marginBottom: 10 };

const summaryValue = (color: string): CSSProperties => ({ color, fontWeight: 600 });

const summaryTotal: CSSProperties = { fontWeight: 700, color: C.textPrimary };

const summaryRowNoBorder: CSSProperties = { ...summaryRow, borderBottom: "none" };

const estimatedCost: CSSProperties = { fontSize: 15, fontWeight: 800, color: C.trust };

const publishErrorText: CSSProperties = {
  fontSize: 12, color: C.error, marginBottom: 8, textAlign: "center",
};

const successBtn: CSSProperties = { ...btnPill, background: C.success, color: "#fff" };

const connectBtn: CSSProperties = { ...btnPill, background: "#ffa7b1", color: "#0a0a0a" };

const publishBtn = (isPublishing: boolean): CSSProperties => ({
  ...btnPill, background: "#ffa7b1", color: "#0a0a0a", opacity: isPublishing ? 0.7 : 1,
});

// ─── Component ──────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate();
  const { cart, toggleCart, clearCart, removeFromCart } = useCart();
  const [pendingTopics, setPendingTopics] = useState<string[]>([]);
  const { wallet: appKitWallet, isConnected: appKitConnected, connect: openWalletModal } = useWalletConnection();
  const embeddedCtx = useEmbeddedWallet();
  const wallet = appKitWallet ?? embeddedCtx.wallet;
  const isConnected = appKitConnected || !!embeddedCtx.wallet;
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState("");
  const [publishDone, setPublishDone] = useState(false);
  const [publishError, setPublishError] = useState("");

  // Reload pending topics when page gets focus (coming back from other pages)
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.PENDING_TOPICS);
        setPendingTopics(raw ? JSON.parse(raw).filter((t: string) => trackNames.includes(t)) : []);
      } catch { setPendingTopics([]); }
    };
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  // Category lookup
  const categoryMap = useMemo(() => {
    const m = new Map<string, { icon: string; color: string; name: string }>();
    categories.forEach((c) => c.topics.forEach((t) => m.set(t.id, { icon: c.icon, color: c.color, name: c.name })));
    return m;
  }, []);

  // Build lookup maps
  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), []);
  const topicMap = useMemo(() => new Map(allTopics.map((t) => [t.id, t])), []);

  // Categorize all cart items
  const cartSessions = useMemo(() => {
    const result: typeof sessions = [];
    cart.forEach((id) => {
      const s = sessionMap.get(id);
      if (s) result.push(s);
    });
    return result;
  }, [cart, sessionMap]);

  const cartTopics = useMemo(() => {
    const result: typeof allTopics = [];
    cart.forEach((id) => {
      const t = topicMap.get(id);
      if (t) result.push(t);
    });
    return result;
  }, [cart, topicMap]);

  const topicList = pendingTopics;

  // Pending follows (from useFollow)
  const cartFollows = useMemo(() => {
    const result: string[] = [];
    cart.forEach((id) => {
      if (id.startsWith("follow:")) result.push(id.slice(7));
    });
    return result;
  }, [cart]);

  // Pending ratings (from RateSessionPage)
  const pendingRatings: Record<string, number> = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.RATINGS_PENDING) ?? "{}"
  );
  const cartRatings = useMemo(() => {
    const result: { session: typeof sessions[0]; rating: number }[] = [];
    for (const [sessionId, ratingValue] of Object.entries(pendingRatings)) {
      const s = sessionMap.get(sessionId);
      if (s) result.push({ session: s, rating: ratingValue });
    }
    return result;
  }, [pendingRatings, sessionMap]);

  const tripleCount = topicList.length + cartSessions.length + cartTopics.length + cartRatings.length + cartFollows.length;
  const isEmpty = tripleCount === 0;

  // Estimate cost: deposits use calculateDepositFee, sessions use getTotalCreationCost
  const depositCount = topicList.length + cartTopics.length; // interests + voted topics → deposit
  const sessionCount = cartSessions.length; // sessions → triples
  const ratingCount = cartRatings.length; // ratings → deposit into existing triple vaults

  const [realCost, setRealCost] = useState<string | null>(null);
  useEffect(() => {
    if (tripleCount === 0) { setRealCost(null); return; }
    let cancelled = false;
    import("ethers").then(async ({ ethers }) => {
      const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL);
      const proxy = new ethers.Contract(
        CHAIN_CONFIG.SOFIA_PROXY,
        [
          "function calculateDepositFee(uint256 depositCount, uint256 totalDeposit) view returns (uint256)",
          "function getTotalCreationCost(uint256 depositCount, uint256 totalDeposit, uint256 multiVaultCost) view returns (uint256)",
        ],
        provider
      );
      const mv = new ethers.Contract(
        CHAIN_CONFIG.MULTIVAULT,
        ["function getTripleCost() view returns (uint256)"],
        provider
      );

      const deposit = BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);
      let total = 0n;

      // Cost for deposits (interests + topics)
      if (depositCount > 0) {
        const n = BigInt(depositCount);
        const totalDep = deposit * n;
        const fee: bigint = await proxy.calculateDepositFee(n, totalDep);
        total += totalDep + fee;
      }

      // Cost for session triples (creation)
      if (sessionCount > 0) {
        const tripleCost: bigint = await mv.getTripleCost();
        const n = BigInt(sessionCount);
        const totalDep = deposit * n;
        const mvCost = (tripleCost + deposit) * n;
        const triCost: bigint = await proxy.getTotalCreationCost(n, totalDep, mvCost);
        total += triCost;
      }

      // Cost for rating deposits (deposit into existing triple vaults, 0.001 TRUST each)
      if (ratingCount > 0) {
        const ratingDeposit = ethers.parseEther("0.001");
        const n = BigInt(ratingCount);
        const totalRatingDep = ratingDeposit * n;
        // Ratings go through proxy depositBatch — add proxy fee
        try {
          const fee: bigint = await proxy.calculateDepositFee(n, totalRatingDep);
          total += totalRatingDep + fee;
        } catch {
          // Fallback: just the deposit amount without fee
          total += totalRatingDep;
        }
      }

      if (cancelled) return;
      const trustAmount = Number(total) / 1e18;
      setRealCost(trustAmount < 0.01 ? trustAmount.toFixed(4) : trustAmount.toFixed(2));
    }).catch(() => {
      if (!cancelled) setRealCost(null);
    });
    return () => { cancelled = true; };
  }, [depositCount, sessionCount, ratingCount, tripleCount]);

  return (
    <div style={page}>
      <div style={topSpacer} />

      <div style={scrollContent}>
        {isEmpty && (
          <div style={emptyState}>
            <div style={emptyIcon}>🛒</div>
            <p style={emptyTitle}>Cart is empty</p>
            <p>Select interests, sessions, or vote on topics to fill your cart.</p>
          </div>
        )}

        {/* ── Interests ──────────────────────── */}
        {topicList.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>💜</span>
              Interests ({topicList.length})
            </div>
            <div style={interestWrap}>
              {topicList.map((t) => {
                const ts = getTrackStyle(t);
                return (
                  <span key={t} style={interestPill(ts.color)}
                    onClick={() => {
                      const next = pendingTopics.filter((x) => x !== t);
                      setPendingTopics(next);
                      localStorage.setItem(STORAGE_KEYS.PENDING_TOPICS, JSON.stringify(next));
                      removeFromCart(t);
                    }}
                  >
                    {ts.icon} {t} <Ic.X s={10} c="#fff" />
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Supported Topics ────────────────── */}
        {cartTopics.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>🗳️</span>
              Supported Topics ({cartTopics.length})
            </div>
            {cartTopics.map((t) => {
              const cat = categoryMap.get(t.id);
              const emoji = ICON_EMOJI[cat?.icon ?? ""] ?? "📌";
              return (
                <div key={t.id} style={card}>
                  <div style={topicIconBox(cat?.color)}>
                    {emoji}
                  </div>
                  <div style={fluidContent}>
                    <div style={topicTitle}>
                      {t.name}
                    </div>
                    <div style={topicMeta(cat?.color ?? C.textTertiary)}>
                      {cat?.name ?? "Other"} &middot; {t.type}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCart(t.id)}
                    style={deleteBtnCentered}
                  >
                    <Ic.Trash s={12} c={C.error} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Sessions ───────────────────────── */}
        {cartSessions.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>📅</span>
              Sessions ({cartSessions.length})
            </div>
            {cartSessions.map((s) => {
              const ts = getTrackStyle(s.track);
              return (
                <div key={s.id} style={card}>
                  <div style={accentBar(ts.color)} />
                  <div style={iconBoxSmall(ts.color)}>
                    {ts.icon}
                  </div>
                  <div style={fluidContent}>
                    <div style={cardTitle}>
                      {s.title}
                    </div>
                    {s.speakers.length > 0 && (
                      <div style={sessionSpeakers}>
                        {s.speakers.map((sp) => sp.name).join(", ")}
                      </div>
                    )}
                    <div style={sessionTrackMeta(ts.color)}>
                      {fmtDate(s.date)} &middot; {s.startTime}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCart(s.id)}
                    style={deleteBtnCentered}
                  >
                    <Ic.Trash s={12} c={C.error} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Ratings ────────────────────────── */}
        {cartRatings.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>⭐</span>
              Ratings ({cartRatings.length})
            </div>
            {cartRatings.map(({ session: s, rating: r }) => {
              return (
                <div key={`rate-${s.id}`} style={card}>
                  <div style={accentBar(C.flat)} />
                  <div style={ratingIconBox}>
                    {r}/5
                  </div>
                  <div style={fluidContent}>
                    <div style={cardTitle}>
                      {s.title}
                    </div>
                    <div style={metaText}>
                      Deposit into {r}/5 vault
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const p = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATINGS_PENDING) ?? "{}");
                      delete p[s.id];
                      localStorage.setItem(STORAGE_KEYS.RATINGS_PENDING, JSON.stringify(p));
                      toggleCart(s.id);
                    }}
                    style={deleteBtnCentered}
                  >
                    <Ic.Trash s={12} c={C.error} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Follows ────────────────────────── */}
        {cartFollows.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>👤</span>
              Following ({cartFollows.length})
            </div>
            {cartFollows.map((addr) => {
              const short = truncateLabel(addr);
              const initials = getInitials(addr);
              return (
                <div key={`follow-${addr}`} style={card}>
                  <div style={accentBar(C.primary)} />
                  <div style={avatarSmall(avatarColor(addr))}>
                    {initials}
                  </div>
                  <div style={fluidContent}>
                    <div style={monoText}>
                      {short}
                    </div>
                    <div style={metaText}>
                      Follow triple
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      toggleCart(`follow:${addr}`);
                      // Also remove from pending follows in localStorage
                      try {
                        const pending = JSON.parse(localStorage.getItem("ethcc-pending-follows") ?? "[]");
                        const next = pending.filter((f: { label: string }) => f.label.toLowerCase() !== addr.toLowerCase());
                        localStorage.setItem("ethcc-pending-follows", JSON.stringify(next));
                      } catch { /* ignore */ }
                    }}
                    style={deleteBtnCentered}
                  >
                    <Ic.Trash s={12} c={C.error} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Transaction summary ────────────── */}
        {tripleCount > 0 && (
          <div style={summaryCard}>
            <div style={summaryTitle}>
              On-Chain Summary
            </div>
            <div style={summaryRow}>
              <span>Interests</span>
              <span style={summaryValue(C.textPrimary)}>{topicList.length}</span>
            </div>
            <div style={summaryRow}>
              <span>Supported topics</span>
              <span style={summaryValue(C.textPrimary)}>{cartTopics.length}</span>
            </div>
            <div style={summaryRow}>
              <span>Sessions</span>
              <span style={summaryValue(C.textPrimary)}>{cartSessions.length}</span>
            </div>
            {cartRatings.length > 0 && (
              <div style={summaryRow}>
                <span>Ratings</span>
                <span style={summaryValue(C.flat)}>{cartRatings.length}</span>
              </div>
            )}
            {cartFollows.length > 0 && (
              <div style={summaryRow}>
                <span>Following</span>
                <span style={summaryValue(C.primary)}>{cartFollows.length}</span>
              </div>
            )}
            <div style={summaryRow}>
              <span>Network</span>
              <span style={summaryValue(C.trust)}>Intuition L3 (1155)</span>
            </div>
            <div style={summaryRow}>
              <span>Total triples</span>
              <span style={summaryTotal}>{tripleCount}</span>
            </div>
            <div style={summaryRowNoBorder}>
              <span>Estimated cost</span>
              <span style={estimatedCost}>
                {realCost ? `~${realCost} TRUST` : `~${(tripleCount * 0.1).toFixed(1)} TRUST`}
              </span>
            </div>
          </div>
        )}
      </div>

      {tripleCount > 0 && (
        <div style={bottomBar}>
          {publishError && (
            <div style={publishErrorText}>{publishError}</div>
          )}
          {publishDone ? (
            <button
              style={successBtn}
              onClick={() => navigate("/vote")}
            >
              Published! View My Votes
            </button>
          ) : !isConnected ? (
            <button
              onClick={openWalletModal}
              style={connectBtn}
            >
              Connect Wallet to Publish
            </button>
          ) : (
            <button
              onClick={async () => {
                if (!wallet || publishing) return;
                setPublishing(true);
                setPublishError("");
                try {
                  // 1. Deposit on track atoms (interests)
                  const trackAtomIds = topicList.map((t) => TRACK_ATOM_IDS[t]).filter(Boolean);
                  if (trackAtomIds.length > 0) {
                    setPublishStatus(`Depositing on ${trackAtomIds.length} interests...`);
                    await depositOnAtoms(wallet, trackAtomIds);
                  }

                  // 2. Deposit on topic atoms (votes)
                  if (cartTopics.length > 0) {
                    const { resolved } = resolveTopicAtomIds(cartTopics.map((t) => t.id));
                    if (resolved.length > 0) {
                      setPublishStatus(`Depositing on ${resolved.length} topics...`);
                      await depositOnAtoms(wallet, resolved.map((r) => r.atomId));
                    }
                    // Mark topics as published on-chain
                    const pubVotes: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]");
                    for (const t of cartTopics) {
                      if (!pubVotes.includes(t.id)) pubVotes.push(t.id);
                    }
                    localStorage.setItem(STORAGE_KEYS.PUBLISHED_VOTES, JSON.stringify(pubVotes));
                  }

                  // 3. Create attending triples (sessions)
                  if (cartSessions.length > 0) {
                    setPublishStatus(`Creating ${cartSessions.length} session triples...`);
                    const userAtomId = await ensureUserAtom(wallet.multiVault, wallet.proxy, wallet.address, wallet.ethers);
                    const triples = buildProfileTriples(userAtomId, [], cartSessions.map((s) => s.id));
                    if (triples.length > 0) {
                      await createProfileTriples(wallet.multiVault, wallet.proxy, wallet.address, triples);
                    }
                    // Mark sessions as permanently published
                    const published: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");
                    for (const s of cartSessions) {
                      if (!published.includes(s.id)) published.push(s.id);
                    }
                    localStorage.setItem(STORAGE_KEYS.PUBLISHED_SESSIONS, JSON.stringify(published));
                  }

                  // 4. Deposit on rating triple vaults
                  if (cartRatings.length > 0) {
                    setPublishStatus(`Depositing ${cartRatings.length} ratings...`);
                    const ratingTripleIds: string[] = [];
                    for (const { session: s, rating: r } of cartRatings) {
                      const tripleData = ratingsGraph.sessionRatingTriples[s.id]?.[String(r)];
                      if (tripleData) {
                        const tripleId = await wallet.multiVault.calculateTripleId(
                          tripleData.subjectId, tripleData.predicateId, tripleData.objectId
                        );
                        ratingTripleIds.push(tripleId);
                      }
                    }
                    if (ratingTripleIds.length > 0) {
                      const depositPerRating = wallet.ethers.parseEther("0.001");
                      const n = BigInt(ratingTripleIds.length);
                      const totalDeposit = depositPerRating * n;
                      const fee: bigint = await wallet.proxy.calculateDepositFee(n, totalDeposit);
                      const curveIds = ratingTripleIds.map(() => CHAIN_CONFIG.CURVE_ID);
                      const assets = ratingTripleIds.map(() => depositPerRating);
                      const minShares = ratingTripleIds.map(() => 0n);

                      const tx = await wallet.proxy.depositBatch(
                        wallet.address, ratingTripleIds, curveIds, assets, minShares,
                        { value: totalDeposit + fee }
                      );
                      await tx.wait();
                    }
                  }

                  // Move pending topics to published topics
                  try {
                    const pending: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_TOPICS) ?? "[]");
                    if (pending.length > 0) {
                      const existingTopics = StorageService.loadTopics();
                      for (const t of pending) existingTopics.add(t);
                      StorageService.saveTopics(existingTopics);
                      localStorage.removeItem(STORAGE_KEYS.PENDING_TOPICS);
                    }
                  } catch { /* ignore */ }

                  // Clear cart after successful publish
                  clearCart();
                  setPendingTopics([]);
                  localStorage.removeItem(STORAGE_KEYS.VOTES);
                  localStorage.removeItem(STORAGE_KEYS.RATINGS_PENDING);

                  setPublishDone(true);
                  setPublishStatus("");
                } catch (e: unknown) {
                  setPublishError(e instanceof Error ? e.message : "Transaction failed");
                } finally {
                  setPublishing(false);
                }
              }}
              disabled={publishing}
              style={publishBtn(publishing)}
            >
              {publishing ? publishStatus || "Publishing..." : "Validate & Publish On-Chain"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
