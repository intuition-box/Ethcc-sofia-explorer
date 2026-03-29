import { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, FONT, glassSurface } from "../config/theme";
import { Ic } from "../components/ui/Icons";
import { followNotificationService, type Follower } from "../services/followNotificationService";
import { scrollContent, fluidContent, avatarSmall, glassListItem } from "../styles/common";
import { StorageService } from "../services/StorageService";
import { STORAGE_KEYS } from "../config/constants";

// ─── Styles ───────────────────────────────────────────────────

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

const navTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
};

const navSpacer: CSSProperties = {
  width: 42,
};

const contentSection: CSSProperties = {
  padding: "0 20px",
  marginBottom: 20,
};

const sectionHeading: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 12,
  color: C.textSecondary,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const followerRow: CSSProperties = {
  ...glassListItem,
  marginBottom: 8,
  cursor: "pointer",
};

const followerAvatar: CSSProperties = {
  ...avatarSmall(C.primary + "22"),
  fontSize: 14,
  color: C.primary,
};

const followerName: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const followerTime: CSSProperties = {
  fontSize: 12,
  color: C.textTertiary,
};

const emptyState: CSSProperties = {
  ...glassSurface,
  padding: 40,
  textAlign: "center",
};

const emptyIcon: CSSProperties = {
  fontSize: 48,
  marginBottom: 16,
};

const emptyTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 8,
};

const emptyText: CSSProperties = {
  fontSize: 14,
  color: C.textSecondary,
  lineHeight: 1.5,
};

const loadingState: CSSProperties = {
  ...glassSurface,
  padding: 20,
  textAlign: "center",
  color: C.textTertiary,
};

const newBadge: CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: R.btn,
  background: C.primary + "22",
  color: C.primary,
  fontSize: 10,
  fontWeight: 600,
  marginLeft: 8,
};

// ─── Helpers ──────────────────────────────────────────────────

function formatFollowTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(label: string): string {
  if (label.startsWith("0x")) {
    return label.substring(2, 4).toUpperCase();
  }
  const parts = label.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return label.substring(0, 2).toUpperCase();
}

function formatLabel(label: string): string {
  if (label.startsWith("0x") && label.length > 10) {
    return `${label.substring(0, 6)}...${label.substring(label.length - 4)}`;
  }
  return label;
}

// ─── Component ────────────────────────────────────────────────

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenFollowerIds, setSeenFollowerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFollowers();
  }, []);

  const loadFollowers = async () => {
    setLoading(true);

    // Get user atom ID from profile
    const profile = StorageService.loadObject<{ atomId?: string }>(STORAGE_KEYS.PROFILE);
    const userAtomId = profile?.atomId;

    if (!userAtomId) {
      console.warn("[NotificationsPage] No user atomId found in profile");
      setLoading(false);
      return;
    }

    // Load seen followers
    const seen = StorageService.loadSet("sofia:seen_followers");
    setSeenFollowerIds(seen);

    // Fetch all followers
    const allFollowers = await followNotificationService.getAllFollowers(userAtomId);
    setFollowers(allFollowers);

    // Mark all as seen now that user has viewed the page
    followNotificationService.markAsSeen(allFollowers.map((f) => f.termId));

    setLoading(false);
  };

  const handleFollowerClick = (follower: Follower) => {
    navigate(`/vibe-profile/${encodeURIComponent(follower.label)}`);
  };

  return (
    <div style={page}>
      {/* Top nav */}
      <div style={topNav}>
        <button style={navBtn} onClick={() => navigate(-1)}>
          <Ic.Back s={22} c={C.textPrimary} />
        </button>
        <span style={navTitle}>Notifications</span>
        <div style={navSpacer} />
      </div>

      {/* Scrollable content */}
      <div style={scrollContent}>
        <div style={contentSection}>
          <div style={sectionHeading}>Followers</div>

          {loading ? (
            <div style={loadingState}>Loading followers...</div>
          ) : followers.length === 0 ? (
            <div style={emptyState}>
              <div style={emptyIcon}>🔔</div>
              <div style={emptyTitle}>No followers yet</div>
              <div style={emptyText}>
                When someone follows you on-chain, you'll see them here.
              </div>
            </div>
          ) : (
            <>
              {followers.map((follower) => {
                const isNew = !seenFollowerIds.has(follower.termId);
                return (
                  <div
                    key={follower.termId}
                    style={followerRow}
                    onClick={() => handleFollowerClick(follower)}
                  >
                    <div style={followerAvatar}>{getInitials(follower.label)}</div>
                    <div style={fluidContent}>
                      <div style={followerName}>
                        {formatLabel(follower.label)}
                        {isNew && <span style={newBadge}>NEW</span>}
                      </div>
                      <div style={followerTime}>
                        Started following you • {formatFollowTime(follower.followedAt)}
                      </div>
                    </div>
                    <Ic.Right s={16} c={C.textTertiary} />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
