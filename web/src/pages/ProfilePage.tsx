import { useState, useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT } from "../config/theme";
import { VIBES, PLATFORMS } from "../data/social";

import { Ic } from "../components/ui/Icons";
import { StorageService } from "../services/StorageService";

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
  justifyContent: "space-between",
  padding: "12px 16px 0",
  flexShrink: 0,
};

const settingsBtn: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: C.surfaceGray,
  border: "none",
  color: C.textSecondary,
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const avatarWrap: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "24px 16px 16px",
};

const avatar: CSSProperties = {
  width: 80,
  height: 80,
  borderRadius: 40,
  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  fontWeight: 700,
  color: C.dark,
};

const userName: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginTop: 12,
};

const userAddr: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
  marginTop: 4,
};

const chainBadge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: R.btn,
  background: C.successLight,
  color: C.success,
  fontSize: 11,
  fontWeight: 600,
  marginTop: 8,
};

const statsRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-around",
  padding: "16px",
  margin: "0 16px",
  ...glassSurface,
  background: "#fff",
};

const statItem: CSSProperties = {
  textAlign: "center" as const,
  flex: 1,
};

const statVal: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#0a0a0a",
};

const statLabel: CSSProperties = {
  fontSize: 11,
  color: "rgba(10,10,10,0.6)",
  marginTop: 2,
};

const inviteBtn: CSSProperties = {
  width: "calc(100% - 32px)",
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
  margin: "16px",
  boxSizing: "border-box" as const,
};

const sectionTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  padding: "20px 16px 10px",
  color: C.textPrimary,
};

const vibeCard: CSSProperties = {
  ...glassSurface,
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
};

const vibeAvatar: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 20,
  background: "rgba(206,162,253,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
  color: C.primary,
  flexShrink: 0,
};

const vibeName: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const vibePct: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: C.success,
  marginLeft: "auto",
};

const platformRow: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 8px",
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const platformIcon: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: R.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
};

const platformInfo: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const platformName: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const platformDesc: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  marginTop: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const toggleTrack = (on: boolean): CSSProperties => ({
  width: 44,
  height: 24,
  borderRadius: 12,
  background: on ? C.success : "rgba(255,255,255,0.1)",
  position: "relative" as const,
  cursor: "pointer",
  transition: "background 0.2s",
  border: "none",
  flexShrink: 0,
});

const toggleKnob = (on: boolean): CSSProperties => ({
  width: 20,
  height: 20,
  borderRadius: 10,
  background: "#fff",
  position: "absolute" as const,
  top: 2,
  left: on ? 22 : 2,
  transition: "left 0.2s",
});

const footerRow: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 8px",
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
};

const footerLabel: CSSProperties = {
  fontSize: 14,
  color: C.textPrimary,
};

const footerValue: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
};

// ─── Component ───────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(
    new Set(["github", "x"])
  );

  const walletAddress = localStorage.getItem("ethcc-wallet-address") ?? "";
  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "Not connected";
  const initials = walletAddress
    ? walletAddress.slice(2, 4).toUpperCase()
    : "??";

  const savedTopics = useMemo(() => StorageService.loadTopics(), []);
  const topicNames = useMemo(() => [...savedTopics], [savedTopics]);
  const savedCart = useMemo(() => StorageService.loadCart(), []);
  const voteCount = useMemo(() => {
    try {
      const r = localStorage.getItem("ethcc-votes");
      return r ? (JSON.parse(r) as unknown[]).length : 0;
    } catch {
      return 0;
    }
  }, []);

  const togglePlatform = (id: string) => {
    setConnectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const topVibes = VIBES.slice(0, 4);

  return (
    <div style={page}>
      {/* Header */}
      <div style={{ ...header, justifyContent: "flex-end" }}>
        <button style={settingsBtn}>
          <Ic.Settings s={18} />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 24 }}>
      {/* Avatar + Info */}
      <div style={avatarWrap}>
        <div style={avatar}>{initials}</div>
        <div style={userName}>{walletAddress ? shortAddr : "Anonymous"}</div>
        <div style={userAddr}>{walletAddress || "No wallet connected"}</div>
        <div style={chainBadge}>
          <span style={{ fontSize: 8 }}>&#9679;</span>{" "}
          {walletAddress ? "On-Chain" : "Off-Chain"}
        </div>
      </div>

      {/* Stats */}
      <div style={statsRow}>
        <div style={statItem}>
          <div style={statVal}>{topicNames.length || "-"}</div>
          <div style={statLabel}>Interests</div>
        </div>
        <div style={statItem}>
          <div style={statVal}>{savedCart.size || "-"}</div>
          <div style={statLabel}>Sessions</div>
        </div>
        <div style={statItem}>
          <div style={statVal}>{voteCount || "-"}</div>
          <div style={statLabel}>Votes</div>
        </div>
        <div style={statItem}>
          <div style={statVal}>-</div>
          <div style={statLabel}>Matches</div>
        </div>
      </div>

      {/* Invite Button */}
      <button style={inviteBtn} onClick={() => navigate("/invite")}>
        Invite Nearby Participants
      </button>

      {/* Vibe Matches */}
      <div style={sectionTitle}>Vibe Matches</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px 16px" }}>
        {topVibes.map((vibe, idx) => (
          <div
            key={vibe.name}
            style={vibeCard}
            onClick={() => navigate(`/vibe/${idx}`)}
          >
            <div style={vibeAvatar}>
              {vibe.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={vibeName}>{vibe.name}</div>
              <div style={{ fontSize: 11, color: C.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {vibe.shared.slice(0, 2).join(", ")}
              </div>
            </div>
            <div style={vibePct}>{vibe.pct}%</div>
            <div style={{ color: C.textTertiary, fontSize: 16 }}>&#8250;</div>
          </div>
        ))}
      </div>

      {/* Connected Platforms */}
      <div style={sectionTitle}>Connected Platforms</div>
      {PLATFORMS.map((p) => {
        const on = connectedPlatforms.has(p.id);
        return (
          <div key={p.id} style={platformRow}>
            <div style={{ ...platformIcon, background: `${p.color}22` }}>
              {p.icon}
            </div>
            <div style={platformInfo}>
              <div style={platformName}>{p.name}</div>
              <div style={platformDesc}>{p.desc}</div>
            </div>
            <div style={{ fontSize: 11, color: C.success, marginRight: 8 }}>{p.score}</div>
            <button
              style={toggleTrack(on)}
              onClick={() => togglePlatform(p.id)}
            >
              <div style={toggleKnob(on)} />
            </button>
          </div>
        );
      })}

      {/* Footer Info */}
      <div style={{ ...sectionTitle, marginTop: 8 }}>Account</div>
      <div style={footerRow}>
        <span style={footerLabel}>Wallet</span>
        <span style={footerValue}>{shortAddr}</span>
      </div>
      <div style={footerRow}>
        <span style={footerLabel}>Balance</span>
        <span style={footerValue}>{walletAddress ? "—" : "—"} TRUST</span>
      </div>
      <div style={footerRow}>
        <span style={footerLabel}>TX History</span>
        <span style={footerValue}>15 transactions</span>
      </div>
      <div style={footerRow}>
        <span style={footerLabel}>About EthCC</span>
        <span style={{ ...footerValue, color: C.primary }}>ethcc.io</span>
      </div>
      </div>
    </div>
  );
}
