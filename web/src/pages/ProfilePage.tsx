import { useState, useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT } from "../config/theme";
import { PLATFORMS } from "../data/social";

import { Ic } from "../components/ui/Icons";
import { StorageService } from "../services/StorageService";
import { useVibeMatches } from "../hooks/useVibeMatches";

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

// ─── Component ───────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(
    new Set(["github", "x"])
  );

  const walletAddress = localStorage.getItem("ethcc-wallet-address") ?? "";
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

  // Real vibe matches from on-chain data
  const cartSessionIds = useMemo(() => [...savedCart].map(String), [savedCart]);
  const { matches: realMatches, loading: matchesLoading } = useVibeMatches(
    savedTopics,
    cartSessionIds,
    walletAddress
  );

  const matchCount = realMatches.length > 0 ? realMatches.length : (walletAddress ? 0 : null);

  return (
    <div style={page}>
      {/* Fixed color background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "#fff", borderRadius: `0 0 ${R.xl}px ${R.xl}px`, zIndex: 0 }} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 24, position: "relative", zIndex: 1 }}>
      {/* Hero — same layout as VotePage */}
      <div style={{ background: "transparent", borderRadius: `0 0 ${R.xl}px ${R.xl}px`, padding: "0 0 24px", color: "#0a0a0a", overflow: "hidden", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 20px 0" }}>
          <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1 }}>
            {walletAddress ? (
              <>{walletAddress.slice(0, 6)}...<br/>{walletAddress.slice(-4)}</>
            ) : "Profile"}
          </div>
          <button style={{ ...settingsBtn, background: "rgba(0,0,0,0.1)", flexShrink: 0, marginTop: 4 }} onClick={() => navigate("/settings")}>
            <Ic.Settings s={18} c="#0a0a0a" />
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 12, padding: "0 20px" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{topicNames.length || "-"}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Interests</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{savedCart.size || "-"}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Sessions</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{voteCount || "-"}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Votes</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{matchesLoading ? "..." : (matchCount ?? "-")}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Matches</div>
          </div>
        </div>
      </div>

      {/* Invite Button */}
      <button style={inviteBtn} onClick={() => navigate("/invite")}>
        Invite Nearby Participants
      </button>

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

      </div>
    </div>
  );
}
