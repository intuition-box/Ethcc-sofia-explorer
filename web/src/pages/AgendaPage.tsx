import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle } from "../config/theme";
import { sessions, dates, trackNames, tracks } from "../data";
import { Ic } from "../components/ui/Icons";
import { useCart } from "../hooks/useCart";
import { StorageService } from "../services/StorageService";
import { STORAGE_KEYS } from "../config/constants";
import { SessionCard } from "../components/session/SessionCard";
import { CartToggleButton } from "../components/shared";
import {
  scrollContent,
  fluidContent,
  cardTitle,
  metaText,
  modalOverlay,
  modalSheet,
  modalHeader,
  modalTitleRow,
  modalDesc,
  modalScrollArea,
  closeBtn,
  iconBox,
} from "../styles/common";

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
  ...glassSurface,
  margin: "0 16px 16px",
  padding: 16,
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
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

const addInterestBtn: CSSProperties = {
  marginTop: 10,
  padding: "8px 16px",
  borderRadius: R.btn,
  border: `1px solid ${C.flat}`,
  background: "transparent",
  color: C.flat,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const addInterestOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 100,
  background: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const addInterestSheet: CSSProperties = {
  width: "100%",
  maxWidth: 390,
  background: C.background,
  borderRadius: "20px 20px 0 0",
  border: `1px solid ${C.border}`,
  borderBottom: "none",
  maxHeight: "70vh",
  fontFamily: FONT,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const addInterestHeader: CSSProperties = {
  flexShrink: 0,
  padding: "24px 24px 0",
};

const addInterestTitleRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const addInterestTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
  fontFamily: FONT,
};

const addInterestDesc: CSSProperties = {
  fontSize: 13,
  color: C.textSecondary,
  marginBottom: 16,
  fontFamily: FONT,
};

const addInterestScrollArea: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "0 24px 32px",
};

const addInterestListCol: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const modalTopicItem = (inCart: boolean, isPublished: boolean): CSSProperties => ({
  ...glassSurface,
  padding: 14,
  cursor: isPublished ? "default" : "pointer",
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: inCart && !isPublished
    ? `1px solid ${C.flat}44`
    : isPublished
      ? `1px solid ${C.success}44`
      : undefined,
});

const modalTopicName: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: C.textPrimary,
};

const modalTopicMeta: CSSProperties = {
  ...metaText,
  fontSize: 11,
};

const publishedBadge: CSSProperties = {
  color: C.success,
  marginLeft: 6,
};

const inCartBadge: CSSProperties = {
  color: C.flat,
  marginLeft: 6,
};

const emptyMessage: CSSProperties = {
  textAlign: "center",
  color: C.textTertiary,
  marginTop: 40,
};

// ─── Locked-track modal styles ────────────────────────

const lockedModalHeaderRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const lockedTrackTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: C.textPrimary,
};

const lockedTrackMeta: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
};

const addInterestCta = (alreadyAdded: boolean): CSSProperties => ({
  width: "100%",
  height: 44,
  borderRadius: R.btn,
  background: alreadyAdded ? C.successLight : C.flat,
  color: alreadyAdded ? C.success : "#0a0a0a",
  fontSize: 14,
  fontWeight: 600,
  border: "none",
  cursor: alreadyAdded ? "default" : "pointer",
  fontFamily: FONT,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  marginBottom: 16,
});

const trackSectionLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: C.textTertiary,
  marginBottom: 8,
};

const trackSessionListCol: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const trackSessionItem: CSSProperties = {
  ...glassSurface,
  padding: 10,
  display: "flex",
  alignItems: "center",
  gap: 8,
  opacity: 0.6,
};

const trackSessionIcon: CSSProperties = {
  fontSize: 14,
  flexShrink: 0,
};

const trackSessionTitle: CSSProperties = {
  ...cardTitle,
  fontSize: 12,
};

const trackSessionMeta: CSSProperties = {
  fontSize: 10,
  color: C.textSecondary,
  marginTop: 2,
};

// ─── Component ────────────────────────────────────────

export default function AgendaPage() {
  const navigate = useNavigate();
  const { cart, toggleCart, addToCart, removeFromCart } = useCart();
  const publishedSessions: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");

  // Published interests (on-chain) — reload on focus (coming back from other pages)
  const [publishedTopics, setPublishedTopics] = useState(() => StorageService.loadTopics());
  useEffect(() => {
    const reload = () => setPublishedTopics(StorageService.loadTopics());
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);
  const [pendingTopics, setPendingTopics] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PENDING_TOPICS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  const allMyTopics = useMemo(() => new Set([...publishedTopics, ...pendingTopics]), [publishedTopics, pendingTopics]);
  const availableTopics = useMemo(() => trackNames.filter((t) => !allMyTopics.has(t)), [allMyTopics]);
  // All tracks for the modal — show published + pending + available
  const modalTopics = useMemo(() => trackNames, []);

  const [showAddInterest, setShowAddInterest] = useState(false);
  const [lockedTrack, setLockedTrack] = useState<string | null>(null);
  const [selectedDay, _setSelectedDay] = useState(() => sessionStorage.getItem("agenda-day") ?? dates[0] ?? "");
  const [selectedType, _setSelectedType] = useState(() => sessionStorage.getItem("agenda-type") ?? "All");
  const [search, _setSearch] = useState(() => sessionStorage.getItem("agenda-search") ?? "");

  const setSelectedDay = (v: string) => { _setSelectedDay(v); sessionStorage.setItem("agenda-day", v); };
  const setSelectedType = (v: string) => { _setSelectedType(v); sessionStorage.setItem("agenda-type", v); };
  const setSearch = (v: string) => { _setSearch(v); sessionStorage.setItem("agenda-search", v); };

  const toggleInterest = (track: string) => {
    const next = new Set(pendingTopics);
    if (next.has(track)) {
      next.delete(track);
      removeFromCart(track);
    } else {
      next.add(track);
      addToCart(track);
    }
    setPendingTopics(next);
    localStorage.setItem(STORAGE_KEYS.PENDING_TOPICS, JSON.stringify([...next]));
  };

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

        {/* Add Interest button */}
        {availableTopics.length > 0 && (
          <button
            onClick={() => setShowAddInterest(!showAddInterest)}
            style={addInterestBtn}
          >
            <Ic.Plus s={14} c={C.flat} />
            Add Interest ({availableTopics.length} available)
          </button>
        )}
      </div>

      {/* Add Interest modal */}
      {showAddInterest && (
        <div
          style={addInterestOverlay}
          onClick={() => setShowAddInterest(false)}
        >
          <div
            style={addInterestSheet}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed header */}
            <div style={addInterestHeader}>
              <div style={addInterestTitleRow}>
                <h3 style={addInterestTitle}>Add Interest</h3>
                <button
                  onClick={() => setShowAddInterest(false)}
                  style={closeBtn}
                >
                  <Ic.X s={16} c={C.textSecondary} />
                </button>
              </div>
              <div style={addInterestDesc}>
                Select a topic to unlock its sessions. The interest will be added to your cart for on-chain validation.
              </div>
            </div>
            {/* Scrollable list */}
            <div style={addInterestScrollArea}>
            <div style={addInterestListCol}>
              {modalTopics.map((track) => {
                const ts = getTrackStyle(track);
                const sessionCount = sessions.filter((s) => s.track === track).length;
                const isPublished = publishedTopics.has(track);
                const inCart = pendingTopics.has(track);
                const cartState = isPublished ? "published" : inCart ? "incart" : "default";
                return (
                  <div
                    key={track}
                    onClick={() => { if (!isPublished) toggleInterest(track); }}
                    style={modalTopicItem(inCart, isPublished)}
                  >
                    <div style={iconBox(ts.color)}>
                      {ts.icon}
                    </div>
                    <div style={fluidContent}>
                      <div style={modalTopicName}>{track}</div>
                      <div style={modalTopicMeta}>
                        {sessionCount} sessions
                        {isPublished && <span style={publishedBadge}>· published</span>}
                        {inCart && !isPublished && <span style={inCartBadge}>· in cart</span>}
                      </div>
                    </div>
                    <CartToggleButton
                      state={cartState}
                      onClick={() => { if (!isPublished) toggleInterest(track); }}
                    />
                  </div>
                );
              })}
            </div>
            </div>{/* end scrollable list */}
          </div>
        </div>
      )}

      {/* Session list */}
      <div style={sessionListWrap}>
        {filtered.length === 0 && (
          <p style={emptyMessage}>
            No sessions match your filters.
          </p>
        )}

        {filtered.map((s) => {
          const isPublished = publishedSessions.includes(s.id);
          const isTrackPublished = publishedTopics.has(s.track);
          const isTrackPending = pendingTopics.has(s.track);
          // Sessions whose interest is pending (in cart, not yet on-chain) are locked
          if (isTrackPending && !isTrackPublished) {
            return <SessionCard key={s.id} session={s} locked />;
          }

          // Sessions whose track is not in user's interests — show locked
          if (!isTrackPublished && !isTrackPending && !isPublished) {
            return (
              <SessionCard
                key={s.id}
                session={s}
                locked
                onClick={() => setLockedTrack(s.track)}
              />
            );
          }

          const inCart = isPublished || cart.has(s.id);
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

      {/* Add Interest Modal */}
      {lockedTrack && (() => {
        const ts = getTrackStyle(lockedTrack);
        const trackInfo = tracks.find((t) => t.name === lockedTrack);
        const trackSessions = sessions.filter((s) => s.track === lockedTrack);
        const alreadyAdded = pendingTopics.has(lockedTrack) || publishedTopics.has(lockedTrack);
        return (
          <div
            style={modalOverlay}
            onClick={() => setLockedTrack(null)}
          >
            <div
              style={modalSheet}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={modalHeader}>
                <div style={modalTitleRow}>
                  <div style={lockedModalHeaderRow}>
                    <div style={iconBox(ts.color)}>{ts.icon}</div>
                    <div>
                      <div style={lockedTrackTitle}>{lockedTrack}</div>
                      {trackInfo && <div style={lockedTrackMeta}>{trackInfo.sector} · {trackInfo.sessionCount} sessions</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => setLockedTrack(null)}
                    style={closeBtn}
                  >
                    <Ic.X s={16} c={C.textSecondary} />
                  </button>
                </div>
                <div style={modalDesc}>
                  Add this interest to your profile to unlock {trackSessions.length} sessions and see their details.
                </div>
                <button
                  onClick={() => { if (!alreadyAdded) { toggleInterest(lockedTrack); setLockedTrack(null); } }}
                  style={addInterestCta(alreadyAdded)}
                >
                  {alreadyAdded
                    ? <><Ic.Check s={16} c={C.success} /> Added to cart</>
                    : <><Ic.Plus s={16} c="#0a0a0a" /> Add Interest</>
                  }
                </button>
              </div>

              {/* Session list */}
              <div style={modalScrollArea}>
                <div style={trackSectionLabel}>Sessions in this track</div>
                <div style={trackSessionListCol}>
                  {trackSessions.map((s) => (
                    <div key={s.id} style={trackSessionItem}>
                      <span style={trackSessionIcon}>{ts.icon}</span>
                      <div style={fluidContent}>
                        <div style={trackSessionTitle}>{s.title}</div>
                        <div style={trackSessionMeta}>{s.startTime} · {s.stage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
