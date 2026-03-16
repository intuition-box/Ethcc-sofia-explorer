import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glass, glassSurface, FONT, getTrackStyle } from "../config/theme";
import { sessions, dates } from "../data";
import { Ic } from "../components/ui/Icons";
// StatusBar removed - real OS handles it on mobile
import { VIBES } from "../data/social";
import { useCart } from "../hooks/useCart";

// ─── Styles ─────────────────────────────────────────────────────
const page: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  color: C.textPrimary,
  fontFamily: FONT,
  overflow: "hidden",
};

const heroSection: CSSProperties = {
  background: C.flat,
  borderRadius: `0 0 ${R.xl}px ${R.xl}px`,
  padding: "0 0 24px",
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
};

const headerRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 20px 0",
};

const balanceWrap: CSSProperties = {
  textAlign: "center",
  padding: "20px 20px 0",
};

const balanceAmount: CSSProperties = {
  fontSize: 36,
  fontWeight: 900,
  color: "#0a0a0a",
  letterSpacing: -1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const balanceLabel: CSSProperties = {
  fontSize: 13,
  color: "rgba(10,10,10,0.5)",
  marginTop: 4,
};

const addBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  marginTop: 16,
  padding: "10px 24px",
  borderRadius: R.btn,
  background: "rgba(0,0,0,0.15)",
  color: "#0a0a0a",
  fontSize: 14,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
};

const actionBar: CSSProperties = {
  ...glass,
  borderRadius: R.lg,
  margin: "-20px 20px 0",
  padding: "16px 0",
  display: "flex",
  justifyContent: "center",
  gap: 32,
  position: "relative",
  boxSizing: "border-box",
};

const actionCircle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  background: "none",
  border: "none",
  fontFamily: FONT,
  color: C.textPrimary,
};

const circleIcon: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 18,
  background: C.flat,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "24px 20px 12px",
};

const sectionTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: C.white,
};

const vibeCardStyle: CSSProperties = {
  ...glassSurface,
  minWidth: 140,
  maxWidth: 200,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  cursor: "pointer",
  flexShrink: 0,
  boxSizing: "border-box",
  overflow: "hidden",
};

const sessionRow: CSSProperties = {
  ...glassSurface,
  padding: 14,
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
};

// ─── Component ──────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { cart, toggleCart } = useCart();

  const [walletAddress, setWalletAddress] = useState<string>(() =>
    localStorage.getItem("ethcc-wallet-address") ?? ""
  );
  const [trustBalance, setTrustBalance] = useState<string>("0.000");

  // Re-check localStorage when page becomes visible (coming back from BuyTrust, etc.)
  useEffect(() => {
    const handleFocus = () => {
      const saved = localStorage.getItem("ethcc-wallet-address") ?? "";
      setWalletAddress(saved);
    };
    window.addEventListener("focus", handleFocus);
    // Also check on mount in case navigated back via router
    handleFocus();
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Try to fetch balance if we have an address
  useEffect(() => {
    if (!walletAddress) return;
    import("ethers").then(({ ethers }) => {
      const provider = new ethers.JsonRpcProvider("https://rpc.intuition.systems/http");
      provider
        .getBalance(walletAddress)
        .then((bal) => {
          setTrustBalance(ethers.formatEther(bal));
        })
        .catch(() => {});
    });
  }, [walletAddress]);

  // Today's sessions: filter by first available date
  const todaySessions = useMemo(() => {
    const firstDate = dates[0];
    if (!firstDate) return [];
    return sessions.filter((s) => s.date === firstDate).slice(0, 10);
  }, []);

  // Online vibes
  const onlineVibes = useMemo(() => VIBES.filter((v) => v.online), []);

  return (
    <div style={page}>
      {/* Fixed color background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: C.flat, borderRadius: `0 0 ${R.xl}px ${R.xl}px`, zIndex: 0 }} />

      {/* ── Scrollable content ─────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative", zIndex: 1 }}>
      {/* ── Hero / Balance ─────────────────────────────────── */}
      <div style={{ ...heroSection, background: "transparent" }}>
        <div style={{ ...headerRow, paddingTop: 16 }}>
          <span style={{ fontSize: 14, color: "rgba(0,0,0,0.6)" }}>EthCC[9] Cannes</span>
          <button
            onClick={() => navigate("/leaderboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Ic.Trophy s={22} c="#0a0a0a" />
          </button>
        </div>
        <div style={balanceWrap}>
          <div style={balanceAmount}>
            {walletAddress
              ? `${parseFloat(trustBalance).toFixed(4)} $TRUST`
              : "\u2014 $TRUST"}
          </div>
          <div style={balanceLabel}>Available Balance</div>
          <button style={addBtn} onClick={() => navigate("/buy")}>
            <Ic.Plus s={14} c="#0a0a0a" />
            {walletAddress ? "Add TRUST" : "Connect Wallet"}
          </button>
        </div>
      </div>
      {/* ── Glass action bar ───────────────────────────────── */}
      <div style={actionBar}>
        <button style={actionCircle} onClick={() => navigate("/send")}>
          <div style={{ ...circleIcon, background: "#D790C7" }}>
            <Ic.Send s={22} c="#0a0a0a" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>Send</span>
        </button>
        <button style={actionCircle} onClick={() => navigate("/invite")}>
          <div style={{ ...circleIcon, background: "#cea2fd" }}>
            <Ic.Share s={22} c="#0a0a0a" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>Invite</span>
        </button>
      </div>

      {/* ── Nearby Vibes ───────────────────────────────────── */}
      <div style={sectionHeader}>
        <span style={sectionTitle}>Nearby Vibes</span>
        <span
          style={{ fontSize: 12, color: C.flat, cursor: "pointer" }}
          onClick={() => navigate("/vibes")}
        >
          See all
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          padding: "0 20px 8px",
          scrollbarWidth: "none",
        }}
      >
        {onlineVibes.map((v, idx) => (
          <div
            key={idx}
            style={vibeCardStyle}
            onClick={() => navigate(`/vibe/${idx}`)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0a0a0a",
                  flexShrink: 0,
                }}
              >
                {v.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.name}
                </div>
                <div style={{ fontSize: 11, color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.dist} away
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: C.success,
                }}
              />
              <span style={{ fontSize: 11, color: C.success }}>Online</span>
              <span style={{ fontSize: 11, color: C.textTertiary, marginLeft: "auto" }}>
                {v.pct}% match
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {v.shared.slice(0, 2).map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.06)",
                    color: C.textSecondary,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Today's Sessions ───────────────────────────────── */}
      <div style={sectionHeader}>
        <span style={sectionTitle}>Today's Sessions</span>
        <span
          style={{ fontSize: 12, color: C.flat, cursor: "pointer" }}
          onClick={() => navigate("/agenda")}
        >
          View all
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "0 20px 24px",
        }}
      >
        {todaySessions.map((s) => {
          const ts = getTrackStyle(s.track);
          const inCart = cart.has(s.id);
          return (
            <div
              key={s.id}
              style={sessionRow}
              onClick={() => navigate(`/session/${s.id}`)}
            >
              {/* Track accent */}
              <div
                style={{
                  width: 4,
                  alignSelf: "stretch",
                  borderRadius: 2,
                  background: ts.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 20, flexShrink: 0 }}>{ts.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.white,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.speakers.length > 0 ? s.speakers[0].name : "TBA"} &middot;{" "}
                  {s.startTime} &ndash; {s.endTime}
                </div>
              </div>
              {/* Cart toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCart(s.id);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: inCart ? C.successLight : "rgba(255,255,255,0.06)",
                }}
              >
                {inCart ? (
                  <Ic.Check s={14} c={C.success} />
                ) : (
                  <Ic.Plus s={14} c={C.textSecondary} />
                )}
              </button>
            </div>
          );
        })}
        {todaySessions.length === 0 && (
          <p style={{ fontSize: 14, color: C.textSecondary, textAlign: "center", padding: 20 }}>
            No sessions scheduled for today.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
