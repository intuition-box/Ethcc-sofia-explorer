import { useState, useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, FONT } from "../config/theme";
import { sessions, dates } from "../data";
import { Ic } from "../components/ui/Icons";
import { useCart } from "../hooks/useCart";
import { STORAGE_KEYS } from "../config/constants";
import { SessionCard } from "../components/session/SessionCard";
import { CartToggleButton } from "../components/shared";
import { scrollContent } from "../styles/common";

// ─── Helpers ──────────────────────────────────────────

function fmtShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
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

const sessionListWrap: CSSProperties = {
  padding: "0 20px 24px",
};

const heroBlock: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 200,
  background: "#cea2fd",
  borderRadius: `0 0 ${20}px ${20}px`,
  zIndex: 0,
};

const headerContent: CSSProperties = {
  padding: "16px 20px 0",
  color: "#0a0a0a",
};

const headerTitle: CSSProperties = {
  fontSize: 60,
  fontWeight: 900,
  lineHeight: 1,
  marginBottom: 20,
};

const glassToolbar: CSSProperties = {
  margin: "0 16px 16px",
  padding: 16,
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  borderRadius: R.lg,
  border: `1px solid ${C.border}`,
};

const searchBarWithMargin: CSSProperties = {
  ...searchBar,
  marginBottom: 12,
};

const searchInputStyled: CSSProperties = {
  ...searchInput,
  color: C.textPrimary,
};

const pillRowWithMargin: CSSProperties = {
  ...pillRow,
  marginBottom: 10,
};

const pillStyle = (active: boolean): CSSProperties => ({
  ...pillBase,
  background: active ? C.flat : C.surfaceGray,
  color: active ? "#0a0a0a" : C.textPrimary,
  borderColor: active ? C.flat : "transparent",
});

const emptyMessage: CSSProperties = {
  textAlign: "center",
  color: C.textTertiary,
  marginTop: 40,
};

// ─── Component ────────────────────────────────────────

export default function AgendaPage() {
  const navigate = useNavigate();
  const { cart, toggleCart } = useCart();
  const publishedSessions: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");

  // Filter state
  const [selectedDay, _setSelectedDay] = useState(() => sessionStorage.getItem("agenda-day") ?? dates[0] ?? "");
  const [selectedType, _setSelectedType] = useState(() => sessionStorage.getItem("agenda-type") ?? "All");
  const [search, _setSearch] = useState(() => sessionStorage.getItem("agenda-search") ?? "");

  const setSelectedDay = (v: string) => { _setSelectedDay(v); sessionStorage.setItem("agenda-day", v); };
  const setSelectedType = (v: string) => { _setSelectedType(v); sessionStorage.setItem("agenda-type", v); };
  const setSearch = (v: string) => { _setSearch(v); sessionStorage.setItem("agenda-search", v); };

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
      <div style={heroBlock} />

      {/* Scrollable content */}
      <div style={scrollContent}>
      {/* Header content */}
      <div style={headerContent}>
        <div style={headerTitle}>Agenda</div>
      </div>

      {/* Glass toolbar - search + filters */}
      <div style={glassToolbar}>
        {/* Search */}
        <div style={searchBarWithMargin}>
          <Ic.Search s={18} c={C.textSecondary} />
          <input
            className="agenda-search"
            style={searchInputStyled}
            placeholder="Search sessions, speakers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Day pills */}
        <div style={pillRowWithMargin}>
          {dates.map((d) => {
            const active = d === selectedDay;
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                style={pillStyle(active)}
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
                style={pillStyle(active)}
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
          <p style={emptyMessage}>
            No sessions match your filters.
          </p>
        )}

        {filtered.map((s) => {
          const isPublished = publishedSessions.includes(s.id);
          const inCart = cart.has(s.id);
          const cartState = isPublished ? "published" : inCart ? "incart" : "default";

          return (
            <SessionCard
              key={s.id}
              session={s}
              onClick={() => navigate(`/session/${s.id}`)}
              action={
                <CartToggleButton
                  state={cartState}
                  onClick={() => { if (!isPublished) toggleCart(s.id); }}
                />
              }
            />
          );
        })}
      </div>
      </div>
    </div>
  );
}
