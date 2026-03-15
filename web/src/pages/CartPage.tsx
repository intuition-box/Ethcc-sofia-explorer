import { useState, useEffect, useMemo, type CSSProperties  } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT, getTrackStyle } from "../config/theme";
import { sessions, trackNames } from "../data";
import { allTopics, categories } from "../data/topics";
import { Ic } from "../components/ui/Icons";
import { useCart } from "../hooks/useCart";
import { StorageService } from "../services/StorageService";

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

// ─── Component ──────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate();
  const { cart, toggleCart } = useCart();
  const [topics, setTopics] = useState<Set<string>>(new Set());

  useEffect(() => { setTopics(StorageService.loadTopics()); }, []);

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

  const topicList = [...topics].filter((t) => trackNames.includes(t));

  const tripleCount = topicList.length + cartSessions.length + cartTopics.length;
  const isEmpty = tripleCount === 0;

  return (
    <div style={page}>
      <div style={{ height: 12, flexShrink: 0 }} />

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 16 }}>
        {isEmpty && (
          <div style={emptyState}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>Cart is empty</p>
            <p>Select interests, sessions, or vote on topics to fill your cart.</p>
          </div>
        )}

        {/* ── Interests ──────────────────────── */}
        {topicList.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={{ fontSize: 16 }}>💜</span>
              Interests ({topicList.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {topicList.map((t) => {
                const ts = getTrackStyle(t);
                return (
                  <span key={t} style={{ ...pill, background: ts.color, color: "#fff" }}>
                    {ts.icon} {t}
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
              <span style={{ fontSize: 16 }}>🗳️</span>
              Supported Topics ({cartTopics.length})
            </div>
            {cartTopics.map((t) => {
              const cat = categoryMap.get(t.id);
              const emoji = ICON_EMOJI[cat?.icon ?? ""] ?? "📌";
              return (
                <div key={t.id} style={card}>
                  <div style={{
                    width: 36, height: 36, borderRadius: R.md, flexShrink: 0,
                    background: cat ? `${cat.color}22` : C.primaryLight,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: 11, color: cat?.color ?? C.textTertiary, marginTop: 2 }}>
                      {cat?.name ?? "Other"} &middot; {t.type}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCart(t.id)}
                    style={{
                      width: 28, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                      background: C.errorLight, display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, alignSelf: "center",
                    }}
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
              <span style={{ fontSize: 16 }}>📅</span>
              Sessions ({cartSessions.length})
            </div>
            {cartSessions.map((s) => {
              const ts = getTrackStyle(s.track);
              return (
                <div key={s.id} style={card}>
                  <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: ts.color, flexShrink: 0 }} />
                  <div style={{
                    width: 36, height: 36, borderRadius: R.md, flexShrink: 0,
                    background: `${ts.color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>
                    {ts.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.title}
                    </div>
                    {s.speakers.length > 0 && (
                      <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.speakers.map((sp) => sp.name).join(", ")}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: ts.color, marginTop: 2 }}>
                      {fmtDate(s.date)} &middot; {s.startTime}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCart(s.id)}
                    style={{
                      width: 28, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                      background: C.errorLight, display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, alignSelf: "center",
                    }}
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
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
              On-Chain Summary
            </div>
            <div style={summaryRow}>
              <span>Interests</span>
              <span style={{ color: C.textPrimary, fontWeight: 600 }}>{topicList.length}</span>
            </div>
            <div style={summaryRow}>
              <span>Supported topics</span>
              <span style={{ color: C.textPrimary, fontWeight: 600 }}>{cartTopics.length}</span>
            </div>
            <div style={summaryRow}>
              <span>Sessions</span>
              <span style={{ color: C.textPrimary, fontWeight: 600 }}>{cartSessions.length}</span>
            </div>
            <div style={summaryRow}>
              <span>Network</span>
              <span style={{ color: C.trust, fontWeight: 600 }}>Intuition L3 (1155)</span>
            </div>
            <div style={summaryRow}>
              <span>Total triples</span>
              <span style={{ fontWeight: 700, color: C.textPrimary }}>{tripleCount}</span>
            </div>
            <div style={{ ...summaryRow, borderBottom: "none" }}>
              <span>Estimated cost</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.trust }}>~{(tripleCount * 0.1).toFixed(1)} TRUST</span>
            </div>
          </div>
        )}
      </div>

      {tripleCount > 0 && (
        <div style={bottomBar}>
          <button
            onClick={() => navigate("/profile")}
            style={{ ...btnPill, background: "#ffa7b1", color: "#0a0a0a" }}
          >
            Validate &amp; Publish On-Chain
          </button>
        </div>
      )}
    </div>
  );
}
