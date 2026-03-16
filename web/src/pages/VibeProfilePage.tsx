import { useMemo, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle } from "../config/theme";
import { VIBES } from "../data/social";
import type { Vibe } from "../types";


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

const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px 0",
  flexShrink: 0,
};

const backBtn: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: C.surfaceGray,
  border: "none",
  color: C.textPrimary,
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const titleText: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  flex: 1,
};

// Avatar section
const avatarSection: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "28px 16px 20px",
};

const avatarOuter: CSSProperties = {
  width: 88,
  height: 88,
  borderRadius: 44,
  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative" as const,
};

const avatarInner: CSSProperties = {
  width: 80,
  height: 80,
  borderRadius: 40,
  background: C.surface,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  fontWeight: 700,
  color: C.primary,
};

const onlineIndicator = (online: boolean): CSSProperties => ({
  position: "absolute" as const,
  bottom: 4,
  right: 4,
  width: 16,
  height: 16,
  borderRadius: 8,
  background: online ? C.success : C.textTertiary,
  border: `3px solid ${C.background}`,
});

const nameText: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  marginTop: 14,
};

const addrText: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
  marginTop: 4,
};

const statusRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 8,
};

const statusBadge = (online: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: R.btn,
  background: online ? C.successLight : "rgba(255,255,255,0.06)",
  color: online ? C.success : C.textTertiary,
  fontSize: 11,
  fontWeight: 600,
});

const distBadge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: R.btn,
  background: C.primaryLight,
  color: C.primary,
  fontSize: 11,
  fontWeight: 600,
};

// Stats
const statsRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-around",
  padding: "16px",
  margin: "0 16px",
  ...glassSurface,
};

const statItem: CSSProperties = {
  textAlign: "center" as const,
  flex: 1,
};

const statVal: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
};

const statLabel: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  marginTop: 2,
};

// Shared interests
const sectionTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  padding: "24px 16px 12px",
};

const interestPills: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  padding: "0 16px 16px",
};

const interestPill = (color: string): CSSProperties => ({
  padding: "8px 16px",
  borderRadius: R.btn,
  background: `${color}18`,
  color: color,
  fontSize: 13,
  fontWeight: 600,
  border: `1px solid ${color}33`,
  display: "flex",
  alignItems: "center",
  gap: 6,
});

// Intuition card
const intuitionCard: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 16px",
  padding: 16,
};

const intuitionHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
};

const intuitionIcon: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 18,
  background: C.primaryLight,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
};

const intuitionTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
};

const intuitionSub: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  marginTop: 1,
};

const intuitionRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: `1px solid ${C.border}`,
};

const intuitionLabel: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
};

const intuitionValue: CSSProperties = {
  fontSize: 12,
  color: C.textPrimary,
  fontWeight: 600,
};

// Action buttons
const actionRow: CSSProperties = {
  display: "flex",
  gap: 12,
  padding: "8px 16px 24px",
};

const connectBtn: CSSProperties = {
  flex: 1,
  height: 48,
  borderRadius: R.btn,
  background: C.flat,
  color: "#0a0a0a",
  fontSize: 15,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const shareBtn: CSSProperties = {
  flex: 1,
  height: 48,
  borderRadius: R.btn,
  background: "transparent",
  border: `1px solid ${C.flat}`,
  color: C.flat,
  fontSize: 15,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

// Not found
const notFound: CSSProperties = {
  ...glassSurface,
  margin: "40px 16px",
  padding: 32,
  textAlign: "center" as const,
};

// ─── Component ───────────────────────────────────────

export default function VibeProfilePage() {
  const navigate = useNavigate();
  const { index } = useParams<{ index: string }>();

  const vibe: Vibe | undefined = useMemo(() => {
    const idx = parseInt(index ?? "", 10);
    if (isNaN(idx) || idx < 0 || idx >= VIBES.length) return undefined;
    return VIBES[idx];
  }, [index]);

  if (!vibe) {
    return (
      <div style={page}>
        <div style={header}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            &#8249;
          </button>
          <div style={titleText}>Profile</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={notFound}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>&#128566;</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>User not found</div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
            This vibe profile doesn't exist.
          </div>
        </div>
        </div>
      </div>
    );
  }

  const initials = vibe.name.slice(0, 2).toUpperCase();

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          &#8249;
        </button>
        <div style={titleText}>Profile</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

      {/* Avatar + Info */}
      <div style={avatarSection}>
        <div style={avatarOuter}>
          <div style={avatarInner}>{initials}</div>
          <div style={onlineIndicator(vibe.online)} />
        </div>
        <div style={nameText}>{vibe.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <span
            style={{ fontSize: 18, cursor: "pointer", opacity: 0.7 }}
            title="GitHub"
            onClick={() => window.open(`https://github.com/${vibe.name.replace(/\.eth$/, "")}`, "_blank")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={C.textSecondary}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </span>
          <span
            style={{ fontSize: 18, cursor: "pointer", opacity: 0.7 }}
            title="Discord"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={C.textSecondary}><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </span>
        </div>
        <div style={addrText}>{vibe.addr}</div>
        <div style={statusRow}>
          <div style={statusBadge(vibe.online)}>
            <span style={{ fontSize: 8 }}>&#9679;</span>
            {vibe.online ? "Online" : "Offline"}
          </div>
          <div style={distBadge}>{vibe.dist} away</div>
        </div>
      </div>

      {/* Stats */}
      <div style={statsRow}>
        <div style={statItem}>
          <div style={{ ...statVal, color: C.success }}>{vibe.pct}%</div>
          <div style={statLabel}>Match</div>
        </div>
        <div style={statItem}>
          <div style={statVal}>{vibe.shared.length}</div>
          <div style={statLabel}>Shared</div>
        </div>
        <div style={statItem}>
          <div style={{ ...statVal, color: C.primary }}>{vibe.dist}</div>
          <div style={statLabel}>Distance</div>
        </div>
      </div>

      {/* Shared Interests */}
      <div style={sectionTitle}>Shared Interests</div>
      <div style={interestPills}>
        {vibe.shared.map((interest) => {
          const ts = getTrackStyle(interest);
          return (
            <div key={interest} style={interestPill(ts.color)}>
              <span>{ts.icon}</span>
              {interest}
            </div>
          );
        })}
      </div>

      {/* Intuition Card */}
      <div style={sectionTitle}>Intuition Profile</div>
      <div style={intuitionCard}>
        <div style={intuitionHeader}>
          <div style={intuitionIcon}>&#9830;</div>
          <div>
            <div style={intuitionTitle}>On-Chain Identity</div>
            <div style={intuitionSub}>Verified via Intuition Protocol</div>
          </div>
        </div>
        <div style={intuitionRow}>
          <span style={intuitionLabel}>Chain</span>
          <span style={intuitionValue}>Intuition (1155)</span>
        </div>
        <div style={intuitionRow}>
          <span style={intuitionLabel}>Triples</span>
          <span style={intuitionValue}>{vibe.shared.length + Math.floor(Math.random() * 5 + 3)}</span>
        </div>
        <div style={intuitionRow}>
          <span style={intuitionLabel}>Attestations</span>
          <span style={intuitionValue}>{Math.floor(Math.random() * 12 + 2)}</span>
        </div>
        <div style={{ ...intuitionRow, borderBottom: "none" }}>
          <span style={intuitionLabel}>Trust Score</span>
          <span style={{ ...intuitionValue, color: C.success }}>
            {(vibe.pct * 0.1 + Math.random() * 2).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={actionRow}>
        <button
          style={connectBtn}
          onClick={() => {
            const addr = vibe.addr.replace("...", "");
            window.open(`https://sofia.intuition.box/profile/${addr}`, "_blank");
          }}
        >
          Follow on Sofia
        </button>
        <button
          style={shareBtn}
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: vibe.name, text: `Check out ${vibe.name} on EthCC`, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert("Profile link copied!");
            }
          }}
        >
          Share
        </button>
      </div>

      </div>{/* end scrollable content */}
    </div>
  );
}
