import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle, TYPE_COLORS } from "../config/theme";
import { sessions, dates } from "../data";
import { Ic } from "../components/ui/Icons";

import { useCart } from "../hooks/useCart";
import type { CSSProperties } from "react";

// ─── Helpers ──────────────────────────────────────────

function fmtShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SESSION_TYPES = ["All", "Talk", "Workshop", "Panel", "Demo"] as const;

// ─── Styles ───────────────────────────────────────────

const page: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  fontFamily: FONT,
  color: C.textPrimary,
  overflow: "hidden",
};

// header inlined - color block is now a fixed absolute div

const searchBar: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderRadius: R.xl,
  padding: "10px 16px",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)",
  border: `1px solid ${C.border}`,
};

const searchInput: CSSProperties = {
  flex: 1,
  background: "none",
  border: "none",
  outline: "none",
  color: "#0a0a0a",
  fontSize: 14,
  fontFamily: FONT,
  boxSizing: "border-box",
  minWidth: 0,
};

const pillRow: CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  paddingBottom: 4,
  scrollbarWidth: "none",
};

const pillBase: CSSProperties = {
  padding: "6px 14px",
  borderRadius: R.btn,
  fontSize: 13,
  fontWeight: 500,
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: FONT,
  transition: "all 0.2s",
  flexShrink: 0,
};

const cardWrap: CSSProperties = {
  ...glassSurface,
  display: "flex",
  gap: 12,
  padding: 14,
  marginBottom: 10,
  cursor: "pointer",
  transition: "transform 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
  overflow: "hidden",
  background: "rgba(22,22,24,0.29)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const trackIcon: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: R.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  flexShrink: 0,
};

const sessionListWrap: CSSProperties = {
  padding: "0 20px 24px",
};

// ─── Component ────────────────────────────────────────

export default function AgendaPage() {
  const navigate = useNavigate();
  const { cart, toggleCart } = useCart();
  const [selectedDay, setSelectedDay] = useState(dates[0] ?? "");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sessions.filter((s) => {
      if (s.date !== selectedDay) return false;
      if (selectedType !== "All" && s.type !== selectedType) return false;
      if (q) {
        const haystack = `${s.title} ${s.speakers.map((sp) => sp.name).join(" ")} ${s.track} ${s.stage}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [selectedDay, selectedType, search]);

  return (
    <div style={page}>
      {/* Fixed color background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "#cea2fd", borderRadius: `0 0 ${20}px ${20}px`, zIndex: 0 }} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative", zIndex: 1 }}>
      {/* Header content */}
      <div style={{ padding: "16px 20px 0", color: "#0a0a0a" }}>
        <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1, marginBottom: 20 }}>Agenda</div>
      </div>

      {/* Glass toolbar - search + filters */}
      <div style={{
        ...glassSurface,
        margin: "0 16px 16px",
        padding: 16,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        {/* Search */}
        <div style={{ ...searchBar, marginBottom: 12 }}>
          <Ic.Search s={18} c={C.textSecondary} />
          <input
            className="agenda-search"
            style={{ ...searchInput, color: C.textPrimary }}
            placeholder="Search sessions, speakers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Day pills */}
        <div style={{ ...pillRow, marginBottom: 10 }}>
          {dates.map((d) => {
            const active = d === selectedDay;
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                style={{
                  ...pillBase,
                  background: active ? C.flat : C.surfaceGray,
                  color: active ? "#0a0a0a" : C.textPrimary,
                  borderColor: active ? C.flat : "transparent",
                }}
              >
                {fmtShortDate(d)}
              </button>
            );
          })}
        </div>

        {/* Type pills */}
        <div style={pillRow}>
          {SESSION_TYPES.map((t) => {
            const active = t === selectedType;
            return (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                style={{
                  ...pillBase,
                  background: active ? C.flat : C.surfaceGray,
                  color: active ? "#0a0a0a" : C.textPrimary,
                  borderColor: active ? C.flat : "transparent",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Session list */}
      <div style={sessionListWrap}>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: C.textTertiary, marginTop: 40 }}>
            No sessions match your filters.
          </p>
        )}

        {filtered.map((s) => {
          const ts = getTrackStyle(s.track);
          const inCart = cart.has(s.id);
          const speakerLine = s.speakers.map((sp) => sp.name).join(", ");

          return (
            <div
              key={s.id}
              style={cardWrap}
              onClick={() => navigate(`/session/${s.id}`)}
            >
              {/* Track icon */}
              <div
                style={{
                  ...trackIcon,
                  background: `${ts.color}22`,
                }}
              >
                {ts.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: C.textPrimary }}>
                  {s.title}
                </div>
                {speakerLine && (
                  <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {speakerLine}
                  </div>
                )}
                <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.startTime} - {s.endTime} &middot; {s.stage}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: R.sm,
                      background: `${ts.color}22`,
                      color: ts.color,
                    }}
                  >
                    {s.track}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: R.sm,
                      background: `${TYPE_COLORS[s.type] ?? C.primary}22`,
                      color: TYPE_COLORS[s.type] ?? C.primary,
                    }}
                  >
                    {s.type}
                  </span>
                </div>
              </div>

              {/* Cart toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCart(s.id);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  alignSelf: "center",
                  background: inCart ? C.successLight : "rgba(255,255,255,0.06)",
                  transition: "background 0.2s",
                }}
              >
                {inCart ? (
                  <Ic.Check s={16} c={C.success} />
                ) : (
                  <Ic.Plus s={16} c={C.textSecondary} />
                )}
              </button>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
