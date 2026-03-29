import { useMemo, useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../config/constants";
import { useNavigate, useParams } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT, getTrackStyle, TYPE_COLORS } from "../config/theme";
import { sessions } from "../data";
import { Ic } from "../components/ui/Icons";
import { getReplayUrl } from "../services/replayService";

import { useCart } from "../hooks/useCart";
import { Spark } from "../components/ui/Spark";
import { GraphQLClient, GET_SESSION_ATTENDEES, type GetSessionAttendeesQuery } from "@ethcc/graphql";
import { GQL_URL } from "../config/constants";
import { SESSION_ATOM_IDS, PREDICATES } from "../services/intuition";
import type { CSSProperties } from "react";
import {
  scrollContent,
  fluidContent,
  cardTitle,
  metaText,
  emptyStateText,
  glassInfoCard,
  avatarSmall,
  twoColGrid,
  glassListItem,
} from "../styles/common";

// ─── Helpers ──────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

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

const topNav: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 16px",
  flexShrink: 0,
};

const navBtn: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: C.surfaceGray,
};

const heroSection: CSSProperties = {
  borderRadius: R.lg,
  margin: "0 20px 20px",
  padding: 20,
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
};

const tagPill: CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: R.btn,
  fontSize: 11,
  fontWeight: 500,
  marginRight: 6,
  marginBottom: 4,
};

const infoCard: CSSProperties = {
  ...glassSurface,
  padding: 14,
  display: "flex",
  alignItems: "center",
  gap: 12,
  overflow: "hidden",
  minWidth: 0,
};

const descSection: CSSProperties = {
  padding: "0 20px",
  marginBottom: 24,
};

const bottomBar: CSSProperties = {
  flexShrink: 0,
  padding: "12px 20px 24px",
  background: "rgba(10,10,10,0.95)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderTop: `1px solid ${C.border}`,
  display: "flex",
  gap: 12,
  boxSizing: "border-box",
};

// ─── Extracted styles ─────────────────────────────────

const navTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
};

const navSpacer: CSSProperties = {
  width: 42,
};

const notFoundText: CSSProperties = {
  textAlign: "center",
  color: C.textTertiary,
  marginTop: 60,
  fontSize: 14,
};

const notifyBtnActive: CSSProperties = {
  ...navBtn,
  background: C.flatLight,
};

const notifyBtnInactive: CSSProperties = {
  ...navBtn,
  background: "rgba(255,255,255,0.06)",
};

const notifyBubble: CSSProperties = {
  position: "absolute",
  top: 48,
  right: 0,
  width: 220,
  padding: 12,
  borderRadius: R.lg,
  background: C.surfaceGray,
  border: `1px solid ${C.border}`,
  fontSize: 12,
  color: C.textSecondary,
  fontFamily: FONT,
  zIndex: 10,
  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
};

const relativeWrapper: CSSProperties = {
  position: "relative",
};

const heroIcon: CSSProperties = {
  fontSize: 36,
  marginBottom: 12,
};

const heroTitle: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1.3,
  marginBottom: 8,
};

const heroSpeakers: CSSProperties = {
  fontSize: 14,
  color: C.textSecondary,
  marginBottom: 12,
};

const heroTagsRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
};

const heroDynamic = (color: string): CSSProperties => ({
  ...heroSection,
  background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)`,
  border: `1px solid ${color}33`,
});

const trackPill = (color: string): CSSProperties => ({
  ...tagPill,
  background: `${color}22`,
  color,
});

const typePill = (typeColor: string): CSSProperties => ({
  ...tagPill,
  background: `${typeColor}22`,
  color: typeColor,
});

const interestSection: CSSProperties = {
  padding: "0 20px",
  marginBottom: 20,
};

const statsGrid: CSSProperties = {
  ...twoColGrid,
  marginBottom: 12,
};

const statCard: CSSProperties = {
  ...glassSurface,
  padding: 14,
  textAlign: "center",
};

const statLabel: CSSProperties = {
  fontSize: 11,
  color: C.textTertiary,
  marginBottom: 6,
};

const statValueRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

const attendeeValue = (loading: boolean, count: number): CSSProperties => ({
  fontSize: 22,
  fontWeight: 700,
  color: loading ? C.textTertiary : count > 0 ? C.primary : C.textSecondary,
});

const onChainValue = (count: number): CSSProperties => ({
  fontSize: 22,
  fontWeight: 700,
  color: count > 0 ? C.success : C.textTertiary,
});

const sparkCard: CSSProperties = {
  ...glassSurface,
  padding: 16,
};

const sparkLabel: CSSProperties = {
  fontSize: 12,
  color: C.textTertiary,
  marginBottom: 8,
};

const sparkEmpty: CSSProperties = {
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: C.textTertiary,
};

const infoGridWrapper: CSSProperties = {
  ...twoColGrid,
  padding: "0 20px",
  marginBottom: 20,
};

const infoLabel: CSSProperties = {
  fontSize: 11,
  color: C.textTertiary,
};

const infoValue: CSSProperties = {
  ...cardTitle,
};

const infoSubValue: CSSProperties = {
  fontSize: 11,
  color: C.textTertiary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const descHeading: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
};

const descBody: CSSProperties = {
  fontSize: 13,
  color: C.textSecondary,
  lineHeight: 1.65,
  margin: 0,
};

const descEmpty: CSSProperties = {
  fontSize: 13,
  color: C.textTertiary,
  lineHeight: 1.65,
  margin: 0,
  fontStyle: "italic",
};

const speakersSection: CSSProperties = {
  padding: "0 20px",
  marginBottom: 24,
};

const speakersHeading: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 10,
};

const speakerRow: CSSProperties = {
  ...glassListItem,
  marginBottom: 8,
};

const speakerAvatar = (color: string): CSSProperties => ({
  ...avatarSmall(color + "22"),
  fontSize: 14,
  color,
});

const speakerName: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const speakerOrg: CSSProperties = {
  fontSize: 12,
  color: C.textTertiary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const noSpeakersCard: CSSProperties = {
  ...glassInfoCard,
  margin: 0,
};

const noSpeakersText: CSSProperties = {
  ...emptyStateText,
};

const ratingsSection: CSSProperties = {
  padding: "0 20px",
  marginBottom: 20,
};

const ratingsHeading: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 10,
};

const ratingCard: CSSProperties = {
  ...glassSurface,
  padding: 14,
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const ratingStarsRow: CSSProperties = {
  display: "flex",
  gap: 2,
};

const ratingStar = (active: boolean): CSSProperties => ({
  fontSize: 18,
  color: active ? C.flat : C.textTertiary,
});

const ratingLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: C.flat,
};

const editRatingBtn: CSSProperties = {
  padding: "6px 14px",
  borderRadius: R.btn,
  border: "none",
  background: C.surfaceGray,
  color: C.textSecondary,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT,
};

const unratedCard: CSSProperties = {
  ...glassSurface,
  padding: 16,
  textAlign: "center",
  cursor: "pointer",
};

const unratedStarsRow: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 4,
  marginBottom: 8,
};

const unratedStar: CSSProperties = {
  fontSize: 22,
  color: C.textTertiary,
};

const unratedHint: CSSProperties = {
  fontSize: 13,
  color: C.textSecondary,
};

const replaySection: CSSProperties = {
  padding: "0 20px",
  marginBottom: 24,
};

const replayLink: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: R.lg,
  border: `1px solid ${C.success}44`,
  background: C.successLight,
  display: "flex",
  alignItems: "center",
  gap: 12,
  textDecoration: "none",
  fontFamily: FONT,
  boxSizing: "border-box",
};

const replayIcon: CSSProperties = {
  fontSize: 20,
};

const replayTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: C.success,
};

const replaySubtitle: CSSProperties = {
  ...metaText,
};

const cartBtnDynamic = (isPublished: boolean, inCart: boolean): CSSProperties => ({
  ...btnPill,
  flex: 1,
  background: isPublished ? C.successLight : inCart ? C.successLight : C.flat,
  color: isPublished ? C.success : inCart ? C.success : C.dark,
  cursor: isPublished ? "default" : "pointer",
});

const shareBtn: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: R.btn,
  background: C.surfaceGray,
  border: `1px solid ${C.border}`,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const flexOne: CSSProperties = {
  flex: 1,
};

const replayTextCol: CSSProperties = {
  flex: 1,
  textAlign: "left",
};

// ─── Component ────────────────────────────────────────

export default function SessionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { cart, toggleCart } = useCart();

  const session = useMemo(() => sessions.find((s) => s.id === id), [id]);

  if (!session) {
    return (
      <div style={page}>
        <div style={topNav}>
          <button style={navBtn} onClick={() => navigate(-1)}>
            <Ic.Back s={22} c={C.textPrimary} />
          </button>
          <span style={navTitle}>Details</span>
          <div style={navSpacer} />
        </div>
        <p style={notFoundText}>
          Session not found.
        </p>
      </div>
    );
  }

  const ts = getTrackStyle(session.track);
  const publishedSessions: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");
  const isPublished = publishedSessions.includes(session.id);
  const inCart = isPublished || cart.has(session.id);

  // ── Ratings from localStorage ──────────────────────
  const allRatings: Record<string, { rating: number; timestamp: number }> = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.RATINGS) ?? "{}"
  );
  const myRating = allRatings[session.id];

  // ── Replay URL (fetched from replays.json) ─────────
  const [replayUrl, setReplayUrl] = useState<string | null>(null);
  useEffect(() => {
    getReplayUrl(session.id).then((url) => setReplayUrl(url));
  }, [session.id]);

  // ── Notify replay ──────────────────────────────────
  const [notifyReplay, setNotifyReplay] = useState(() => {
    const replays = JSON.parse(localStorage.getItem(STORAGE_KEYS.WANT_REPLAY) ?? "[]") as string[];
    return replays.includes(session.id);
  });
  const [showNotifyBubble, setShowNotifyBubble] = useState(false);

  const toggleNotifyReplay = useCallback(() => {
    const replays = JSON.parse(localStorage.getItem(STORAGE_KEYS.WANT_REPLAY) ?? "[]") as string[];
    if (notifyReplay) {
      localStorage.setItem(STORAGE_KEYS.WANT_REPLAY, JSON.stringify(replays.filter((id: string) => id !== session.id)));
      setNotifyReplay(false);
      setShowNotifyBubble(false);
    } else {
      localStorage.setItem(STORAGE_KEYS.WANT_REPLAY, JSON.stringify([...replays, session.id]));
      setNotifyReplay(true);
      setShowNotifyBubble(true);
      setTimeout(() => setShowNotifyBubble(false), 3000);
    }
  }, [notifyReplay, session.id]);

  // Fetch real attendees from on-chain (attending triples for this session)
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [attendeeChart, setAttendeeChart] = useState<number[]>([]);
  const [attendeeLoading, setAttendeeLoading] = useState(true);
  const [attendees, setAttendees] = useState<Array<{ termId: string; label: string }>>([]);

  useEffect(() => {
    const sessionAtomId = SESSION_ATOM_IDS[session.id];
    if (!sessionAtomId) {
      console.warn(`[SessionDetail] No atomId found for session ${session.id}`);
      setAttendeeLoading(false);
      return;
    }

    console.log(`[SessionDetail] Fetching attendees for session ${session.id}, atomId: ${sessionAtomId}`);
    const gql = new GraphQLClient({ endpoint: GQL_URL });
    gql.request<GetSessionAttendeesQuery>(GET_SESSION_ATTENDEES, {
      predicateId: PREDICATES["attending"],
      sessionAtomId,
    }).then((data) => {
      const triples = data.triples ?? [];
      console.log(`[SessionDetail] Found ${triples.length} attendees for session ${session.id}`);
      setAttendeeCount(triples.length);

      // Extract participant data
      const participants = triples
        .filter(t => t.subject?.term_id && t.subject?.label)
        .map(t => ({
          termId: t.subject!.term_id,
          label: t.subject!.label!,  // Already filtered for non-null
        }));
      setAttendees(participants);

      // Build cumulative chart: each triple created_at adds 1 attendee
      const chart: number[] = [];
      triples.forEach((_, i) => chart.push(i + 1));
      setAttendeeChart(chart);
    }).catch((err) => {
      console.error(`[SessionDetail] Failed to fetch attendees for session ${session.id}:`, err);
    }).finally(() => setAttendeeLoading(false));
  }, [session.id]);

  const speakerLine = session.speakers.map((sp) => sp.name).join(", ");

  return (
    <div style={page}>
      {/* Top nav */}
      <div style={topNav}>
        <button style={navBtn} onClick={() => navigate(-1)}>
          <Ic.Back s={22} c={C.textPrimary} />
        </button>
        <span style={navTitle}>Details</span>
        <div style={relativeWrapper}>
          <button
            style={notifyReplay ? notifyBtnActive : notifyBtnInactive}
            onClick={toggleNotifyReplay}
          >
            <Ic.Bell s={20} c={notifyReplay ? C.flat : C.textSecondary} />
          </button>
          {showNotifyBubble && (
            <div style={notifyBubble}>
              You'll receive a notification when the replay is available.
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={scrollContent}>

      {/* Hero */}
      <div
        style={heroDynamic(ts.color)}
      >
        <div style={heroIcon}>{ts.icon}</div>
        <h1 style={heroTitle}>
          {session.title}
        </h1>
        {speakerLine && (
          <div style={heroSpeakers}>
            {speakerLine}
          </div>
        )}
        <div style={heroTagsRow}>
          <span
            style={trackPill(ts.color)}
          >
            {session.track}
          </span>
          <span
            style={typePill(TYPE_COLORS[session.type] ?? C.primary)}
          >
            {session.type}
          </span>
        </div>
      </div>

      {/* Interest over time (always visible) */}
      <div style={interestSection}>
        <div style={statsGrid}>
          <div style={statCard}>
            <div style={statLabel}>Attending</div>
            <div style={statValueRow}>
              {attendeeLoading ? (
                <>
                  <Ic.People s={16} c={C.textTertiary} />
                  <span style={attendeeValue(true, 0)}>Loading...</span>
                </>
              ) : (
                <>
                  <Ic.People s={16} c={attendeeCount > 0 ? C.primary : C.textTertiary} />
                  <span style={attendeeValue(false, attendeeCount)}>{attendeeCount}</span>
                </>
              )}
            </div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>On-chain</div>
            <div style={onChainValue(attendeeCount)}>
              {attendeeLoading ? (
                <span style={{ fontSize: 14, color: C.textTertiary }}>Loading...</span>
              ) : attendeeCount > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ic.Check s={16} c={C.success} />
                  <span>verified</span>
                </div>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
        <div style={sparkCard}>
          <div style={sparkLabel}>Interest over time</div>
          {attendeeLoading ? (
            <div style={sparkEmpty}>Loading chart data...</div>
          ) : attendeeChart.length > 1 ? (
            <Spark data={attendeeChart} color={ts.color} h={48} />
          ) : (
            <div style={sparkEmpty}>
              No interest data yet — be the first to attend!
            </div>
          )}
        </div>
      </div>

      {/* Time & Stage info cards */}
      <div style={infoGridWrapper}>
        <div style={infoCard}>
          <Ic.Clock s={18} c={C.primary} />
          <div style={fluidContent}>
            <div style={infoLabel}>Time</div>
            <div style={infoValue}>
              {session.startTime} - {session.endTime}
            </div>
            <div style={infoSubValue}>{fmtDate(session.date)}</div>
          </div>
        </div>
        <div style={infoCard}>
          <Ic.Pin s={18} c={C.primary} />
          <div style={fluidContent}>
            <div style={infoLabel}>Stage</div>
            <div style={infoValue}>{session.stage}</div>
          </div>
        </div>
      </div>

      {/* Description */}
      {session.description ? (
        <div style={descSection}>
          <div style={descHeading}>Description</div>
          <p style={descBody}>
            {session.description}
          </p>
        </div>
      ) : (
        <div style={descSection}>
          <div style={descHeading}>Description</div>
          <p style={descEmpty}>
            No description available for this session yet.
          </p>
        </div>
      )}

      {/* Speakers detail */}
      {session.speakers.length > 0 ? (
        <div style={speakersSection}>
          <div style={speakersHeading}>
            Speaker{session.speakers.length > 1 ? "s" : ""}
          </div>
          {session.speakers.map((sp) => (
            <div
              key={sp.slug}
              style={speakerRow}
              onClick={() => navigate(`/speaker/${sp.slug}`)}
            >
              <div
                style={speakerAvatar(ts.color)}
              >
                {sp.name.charAt(0)}
              </div>
              <div style={fluidContent}>
                <div style={speakerName}>{sp.name}</div>
                {sp.organization && (
                  <div style={speakerOrg}>{sp.organization}</div>
                )}
              </div>
              <Ic.Right s={16} c={C.textTertiary} />
            </div>
          ))}
        </div>
      ) : (
        <div style={speakersSection}>
          <div style={speakersHeading}>Speakers</div>
          <div style={noSpeakersCard}>
            <div style={noSpeakersText}>No speakers listed for this session.</div>
          </div>
        </div>
      )}

      {/* Attendees section */}
      {attendeeCount > 0 && (
        <div style={speakersSection}>
          <div style={speakersHeading}>
            Attendees ({attendeeCount})
          </div>
          {attendeeLoading ? (
            <div style={noSpeakersCard}>
              <div style={noSpeakersText}>Loading attendees...</div>
            </div>
          ) : attendees.length > 0 ? (
            <>
              {attendees.slice(0, 10).map((attendee) => (
                <div
                  key={attendee.termId}
                  style={speakerRow}
                  onClick={() => navigate(`/vibe-profile/${encodeURIComponent(attendee.label)}`)}
                >
                  <div style={speakerAvatar(ts.color)}>
                    {attendee.label.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={fluidContent}>
                    <div style={speakerName}>
                      {attendee.label.startsWith('0x')
                        ? `${attendee.label.substring(0, 6)}...${attendee.label.substring(attendee.label.length - 4)}`
                        : attendee.label
                      }
                    </div>
                    <div style={speakerOrg}>Attending</div>
                  </div>
                  <Ic.Right s={16} c={C.textTertiary} />
                </div>
              ))}
              {attendees.length > 10 && (
                <div style={noSpeakersCard}>
                  <div style={noSpeakersText}>
                    + {attendees.length - 10} more attendee{attendees.length - 10 > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={noSpeakersCard}>
              <div style={noSpeakersText}>No attendees yet — be the first!</div>
            </div>
          )}
        </div>
      )}

      {/* Ratings section */}
      <div style={ratingsSection}>
        <div style={ratingsHeading}>Ratings</div>

        {myRating ? (
          <div style={ratingCard}>
            <div style={ratingStarsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={ratingStar(s <= myRating.rating)}>★</span>
              ))}
            </div>
            <div style={flexOne}>
              <div style={ratingLabel}>You rated {myRating.rating}/5</div>
            </div>
            <button
              style={editRatingBtn}
              onClick={() => navigate(`/rate/${session.id}`)}
            >
              Edit
            </button>
          </div>
        ) : (
          <div
            style={unratedCard}
            onClick={() => navigate(`/rate/${session.id}`)}
          >
            <div style={unratedStarsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={unratedStar}>★</span>
              ))}
            </div>
            <div style={unratedHint}>
              Attended this session? Tap to rate it
            </div>
          </div>
        )}

        {/* TODO: Show other people's ratings from on-chain data */}
        {/* When on-chain ratings are available, display rating distribution here */}
      </div>

      {/* Replay link (shown when available) */}
      {replayUrl && (
        <div style={replaySection}>
          <a
            href={replayUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={replayLink}
          >
            <span style={replayIcon}>▶️</span>
            <div style={replayTextCol}>
              <div style={replayTitle}>
                Watch Replay
              </div>
              <div style={replaySubtitle}>
                Available on YouTube
              </div>
            </div>
            <Ic.Right s={16} c={C.success} />
          </a>
        </div>
      )}

      </div>{/* end scrollable content */}

      {/* Bottom action bar */}
      <div style={bottomBar}>
        <button
          onClick={() => { if (!isPublished) toggleCart(session.id); }}
          style={cartBtnDynamic(isPublished, inCart)}
        >
          {isPublished ? (
            <>
              <Ic.Check s={18} c={C.success} />
              Attending (on-chain)
            </>
          ) : inCart ? (
            <>
              <Ic.Check s={18} c={C.success} />
              In Cart
            </>
          ) : (
            <>
              <Ic.Plus s={18} c={C.dark} />
              Add to Cart
            </>
          )}
        </button>
        <button
          style={shareBtn}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: session.title,
                text: `${session.title} - ${session.track} at EthCC`,
                url: window.location.href,
              }).catch(() => {});
            }
          }}
        >
          <Ic.Share s={20} c={C.textPrimary} />
        </button>
      </div>
    </div>
  );
}
