import { useMemo, useState, useEffect, useCallback, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glass, glassSurface, FONT, getTrackStyle, avatarColor } from "../config/theme";
import { CartToggleButton } from "../components/shared";
import { sessions, dates } from "../data";
import { Ic } from "../components/ui/Icons";
import { useCart } from "../hooks/useCart";
import { useVibeMatches } from "../hooks/useVibeMatches";
import { SkeletonCircle, Skeleton } from "../components/ui/Skeleton";
import { UserLabel } from "../components/ui/UserLabel";
import {
  hasEmbeddedWallet,
  getEmbeddedAddress,
  isBackupDone,
  connectEmbeddedWallet,
  markBackupDone,
} from "../services/embeddedWallet";
import { STORAGE_KEYS } from "../config/constants";
import { useEmbeddedWallet } from "../contexts/EmbeddedWalletContext";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { followNotificationService } from "../services/followNotificationService";
import {
  scrollContent,
  fluidContent,
  accentBar,
  heroBackground,
  horizontalScroll,
  metaText,
} from "../styles/common";

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

// vibeCardStyle removed — now using VibeCard component

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

const heroBackgroundStyle: CSSProperties = heroBackground(C.flat);

const scrollableContent: CSSProperties = {
  ...scrollContent,
  paddingBottom: 0,
};

const heroTransparent: CSSProperties = {
  ...heroSection,
  background: "transparent",
};

const headerRowWithPadding: CSSProperties = {
  ...headerRow,
  paddingTop: 16,
};

const eventName: CSSProperties = {
  fontSize: 14,
  color: "rgba(0,0,0,0.6)",
};

const trophyBtn: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
};

const notificationBtn: CSSProperties = {
  position: "relative",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
};

const notificationBadge: CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  background: C.error,
  color: C.white,
  fontSize: 10,
  fontWeight: 700,
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 5px",
};

const circleIconSend: CSSProperties = {
  ...circleIcon,
  background: "#D790C7",
};

const circleIconInvite: CSSProperties = {
  ...circleIcon,
  background: "#cea2fd",
};

const actionLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: C.textPrimary,
};

const backupCard: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 12px",
  padding: 14,
  border: `1px solid ${C.warning}44`,
};

const backupTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: C.warning,
  marginBottom: 6,
};

const backupDesc: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
  marginBottom: 10,
};

const backupKeyDisplay: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  fontFamily: "monospace",
  wordBreak: "break-all",
  background: C.surfaceGray,
  padding: 10,
  borderRadius: R.md,
  marginBottom: 8,
};

const flexRow: CSSProperties = {
  display: "flex",
  gap: 8,
};

const btnCopy: CSSProperties = {
  flex: 1,
  padding: "8px 0",
  borderRadius: R.btn,
  border: "none",
  background: C.surfaceGray,
  color: C.textPrimary,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT,
};

const btnSaved: CSSProperties = {
  flex: 1,
  padding: "8px 0",
  borderRadius: R.btn,
  border: "none",
  background: C.flat,
  color: "#0a0a0a",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT,
};

const btnReveal: CSSProperties = {
  padding: "8px 16px",
  borderRadius: R.btn,
  border: "none",
  background: C.warning,
  color: "#0a0a0a",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT,
};

const unlockBanner: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 12px",
  padding: 14,
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
  border: `1px solid ${C.primary}44`,
};

const unlockBannerContent: CSSProperties = {
  flex: 1,
};

const unlockBannerTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: C.textPrimary,
};

const unlockBannerSubtitle: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
};

const unlockFormCard: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 12px",
  padding: 14,
};

const unlockFormTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 8,
};

const passwordInput: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: R.md,
  border: `1px solid ${C.border}`,
  background: C.surfaceGray,
  color: C.textPrimary,
  fontSize: 14,
  fontFamily: FONT,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 8,
};

const errorText: CSSProperties = {
  fontSize: 11,
  color: C.error,
  marginBottom: 6,
};

const btnCancel: CSSProperties = {
  flex: 1,
  padding: "8px 0",
  borderRadius: R.btn,
  border: "none",
  background: C.surfaceGray,
  color: C.textSecondary,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT,
};

const btnUnlock: CSSProperties = {
  flex: 1,
  padding: "8px 0",
  borderRadius: R.btn,
  border: "none",
  background: C.flat,
  color: "#0a0a0a",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT,
};

const seeAllLink: CSSProperties = {
  fontSize: 12,
  color: C.flat,
  cursor: "pointer",
};

const vibeScrollRow: CSSProperties = {
  ...horizontalScroll,
  padding: "0 20px 8px",
};

const vibeCard: CSSProperties = {
  ...glassSurface,
  padding: 14,
  minWidth: 140,
  maxWidth: 160,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  flexShrink: 0,
};

const vibeAvatar = (bg: string): CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: 24,
  background: bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  fontWeight: 700,
  color: "#0a0a0a",
});

const vibeLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: C.white,
  fontFamily: "monospace",
  textAlign: "center",
};

const vibeTopics: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
};

const vibeScore: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: C.success,
};

const sessionsListWrap: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "0 20px 24px",
};

const trackIconSpan: CSSProperties = {
  fontSize: 20,
  flexShrink: 0,
};

const sessionTitleText: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: C.white,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const sessionMeta: CSSProperties = {
  ...metaText,
  fontSize: 12,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const emptySessionsText: CSSProperties = {
  fontSize: 14,
  color: C.textSecondary,
  textAlign: "center",
  padding: 20,
};

// ─── Component ──────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { cart, toggleCart } = useCart();
  const publishedSessions: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");

  const [walletAddress, setWalletAddress] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? ""
  );
  const embeddedCtx = useEmbeddedWallet();
  const trustBalance = embeddedCtx.balance ?? "0.000";

  // Pull-to-refresh: reload page when pulling down from top
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);
  const scrollRef = usePullToRefresh(handleRefresh);

  // Re-check localStorage when page becomes visible (coming back from BuyTrust, etc.)
  useEffect(() => {
    const handleFocus = () => {
      const saved = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? "";
      setWalletAddress(saved);
      embeddedCtx.refreshBalance();
    };
    window.addEventListener("focus", handleFocus);
    handleFocus();
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Today's sessions: filter by actual today, fallback to nearest future date
  const todaySessions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const targetDate = dates.includes(today)
      ? today
      : dates.find((d) => d >= today) ?? dates[dates.length - 1];
    if (!targetDate) return [];
    return sessions.filter((s) => s.date === targetDate).slice(0, 10);
  }, []);

  // Real vibe matches — use ONLY on-chain published data, not cart
  const [savedTopics, setSavedTopics] = useState<Set<string>>(new Set());
  const [profileSynced, setProfileSynced] = useState(false);
  const publishedSessionIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); }
    catch { return []; }
  }, []);

  // Sync interests from on-chain when wallet connects
  useEffect(() => {
    if (walletAddress) {
      setProfileSynced(false);
      import("../services/profileSync").then(({ syncProfileFromChain }) => {
        syncProfileFromChain(walletAddress).then(result => {
          setSavedTopics(new Set(result.interests));
          setProfileSynced(true);
        }).catch(err => {
          console.error("Failed to sync profile from chain:", err);
          setProfileSynced(true); // Still mark as synced to avoid blocking
        });
      });
    } else {
      setProfileSynced(false);
    }
  }, [walletAddress]);

  // Only fetch vibe matches AFTER profile is synced
  const emptyTopics = useMemo(() => new Set<string>(), []);
  const emptySessions = useMemo(() => [], []);

  const { matches: vibeMatches, loading: vibesLoading } = useVibeMatches(
    profileSynced ? savedTopics : emptyTopics,
    profileSynced ? publishedSessionIds : emptySessions,
    walletAddress,
    undefined, // votedTopicIds
    0 // No need for refreshKey, topics change will trigger update
  );

  // Notification count for followers
  const [notificationCount, setNotificationCount] = useState(0);
  useEffect(() => {
    if (walletAddress) {
      followNotificationService.getUnseenFollowerCount(walletAddress).then(setNotificationCount).catch(() => {});
    }
  }, [walletAddress]);

  // Embedded wallet state
  const isEmbedded = hasEmbeddedWallet() && getEmbeddedAddress() === walletAddress;
  const needsBackup = isEmbedded && !isBackupDone();
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [walletUnlocked, setWalletUnlocked] = useState(!!embeddedCtx.wallet);
  // Sync with context auto-reconnect
  useEffect(() => {
    if (embeddedCtx.wallet) setWalletUnlocked(true);
  }, [embeddedCtx.wallet]);
  const [showBackupReminder, setShowBackupReminder] = useState(needsBackup);
  const [backupKey, setBackupKey] = useState("");

  const handleUnlock = async () => {
    setUnlockError("");
    const ok = await embeddedCtx.unlock(unlockPassword);
    if (ok) {
      setWalletUnlocked(true);
      setShowUnlock(false);
      setUnlockPassword("");
    } else {
      setUnlockError("Wrong password");
    }
  };

  const handleBackupAck = () => {
    markBackupDone();
    setShowBackupReminder(false);
    setBackupKey("");
  };

  return (
    <div style={page}>
      {/* Fixed color background */}
      <div style={heroBackgroundStyle} />

      {/* ── Scrollable content ─────────────────────────────── */}
      <div ref={scrollRef} style={scrollableContent}>
      {/* ── Hero / Balance ─────────────────────────────────── */}
      <div style={heroTransparent}>
        <div style={headerRowWithPadding}>
          <span style={eventName}>EthCC[9] Cannes</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {walletAddress && (
              <button
                onClick={() => navigate("/profile")}
                style={notificationBtn}
              >
                <Ic.Bell s={22} c="#0a0a0a" />
                {notificationCount > 0 && (
                  <span style={notificationBadge}>{notificationCount}</span>
                )}
              </button>
            )}
            <button
              onClick={() => navigate("/leaderboard")}
              style={trophyBtn}
            >
              <Ic.Trophy s={22} c="#0a0a0a" />
            </button>
          </div>
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
          <div style={circleIconSend}>
            <Ic.Send s={22} c="#0a0a0a" />
          </div>
          <span style={actionLabel}>Send</span>
        </button>
        <button style={actionCircle} onClick={() => navigate("/invite")}>
          <div style={circleIconInvite}>
            <Ic.Share s={22} c="#0a0a0a" />
          </div>
          <span style={actionLabel}>Invite</span>
        </button>
      </div>

      {/* ── Backup reminder (embedded wallet, never backed up) ── */}
      {showBackupReminder && isEmbedded && (
        <div style={backupCard}>
          <div style={backupTitle}>
            Backup your private key
          </div>
          <div style={backupDesc}>
            You created an embedded wallet but never saved your private key. If you lose it, your funds are gone.
          </div>
          {backupKey ? (
            <>
              <div style={backupKeyDisplay}>
                {backupKey}
              </div>
              <div style={flexRow}>
                <button
                  onClick={() => { navigator.clipboard.writeText(backupKey); }}
                  style={btnCopy}
                >
                  Copy
                </button>
                <button
                  onClick={handleBackupAck}
                  style={btnSaved}
                >
                  I've saved it
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={async () => {
                // Need password to reveal key
                const pw = prompt("Enter your wallet password to reveal the key:");
                if (!pw) return;
                try {
                  const conn = await connectEmbeddedWallet(pw);
                  embeddedCtx.setWalletDirectly(conn, conn.address);
                  setBackupKey(conn.signer.privateKey ?? "Could not retrieve key");
                } catch {
                  alert("Wrong password");
                }
              }}
              style={btnReveal}
            >
              Reveal Private Key
            </button>
          )}
        </div>
      )}

      {/* ── Unlock embedded wallet banner ──────────────────── */}
      {isEmbedded && !walletUnlocked && !showUnlock && (
        <div
          style={unlockBanner}
          onClick={() => setShowUnlock(true)}
        >
          <Ic.Wallet s={20} c={C.primary} />
          <div style={unlockBannerContent}>
            <div style={unlockBannerTitle}>Unlock Embedded Wallet</div>
            <div style={unlockBannerSubtitle}>Enter password to sign transactions</div>
          </div>
          <Ic.Right s={16} c={C.textTertiary} />
        </div>
      )}

      {showUnlock && (
        <div style={unlockFormCard}>
          <div style={unlockFormTitle}>Enter wallet password</div>
          <input
            type="password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
            placeholder="Password"
            autoFocus
            style={passwordInput}
          />
          {unlockError && <div style={errorText}>{unlockError}</div>}
          <div style={flexRow}>
            <button
              onClick={() => { setShowUnlock(false); setUnlockPassword(""); setUnlockError(""); }}
              style={btnCancel}
            >
              Cancel
            </button>
            <button
              onClick={handleUnlock}
              style={btnUnlock}
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      {/* ── Vibe Matches (real on-chain data) ────────────── */}
      {vibeMatches.length > 0 && !vibesLoading && (
        <>
          <div style={sectionHeader}>
            <span style={sectionTitle}>Nearby Vibes</span>
            <span
              style={seeAllLink}
              onClick={() => navigate("/vibes")}
            >
              See all
            </span>
          </div>
          <div style={vibeScrollRow}>
            {vibeMatches.slice(0, 8).map((m, idx) => (
              <div
                key={m.subjectTermId}
                onClick={() => navigate(`/vibe/${idx}`)}
                style={vibeCard}
              >
                <div style={vibeAvatar(avatarColor(m.label))}>
                  {m.label.slice(2, 4).toUpperCase()}
                </div>
                <UserLabel address={m.label} style={vibeLabel} />
                <div style={vibeTopics}>
                  {m.sharedTopics.length > 0
                    ? `${m.sharedTopics.length} shared interest${m.sharedTopics.length > 1 ? 's' : ''}`
                    : m.sharedSessions.length > 0
                    ? `${m.sharedSessions.length} shared session${m.sharedSessions.length > 1 ? 's' : ''}`
                    : 'Similar vibe'
                  }
                </div>
                <span style={vibeScore}>{m.matchScore}%</span>
              </div>
            ))}
          </div>
        </>
      )}
      {vibesLoading && vibeMatches.length === 0 && (
        <>
          <div style={sectionHeader}>
            <span style={sectionTitle}>Nearby Vibes</span>
          </div>
          <div style={vibeScrollRow}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={vibeCard}>
                <SkeletonCircle size={48} />
                <Skeleton height={14} width="80%" />
                <Skeleton height={11} width="60%" />
                <Skeleton height={20} width={40} borderRadius={6} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Today's Sessions ───────────────────────────────── */}
      <div style={sectionHeader}>
        <span style={sectionTitle}>Today's Sessions</span>
        <span
          style={seeAllLink}
          onClick={() => navigate("/agenda")}
        >
          View all
        </span>
      </div>
      <div style={sessionsListWrap}>
        {todaySessions.map((s) => {
          const ts = getTrackStyle(s.track);
          const isPublished = publishedSessions.includes(s.id);
          const inCart = isPublished || cart.has(s.id);
          return (
            <div
              key={s.id}
              style={sessionRow}
              onClick={() => navigate(`/session/${s.id}`)}
            >
              {/* Track accent */}
              <div style={accentBar(ts.color)} />
              <span style={trackIconSpan}>{ts.icon}</span>
              <div style={fluidContent}>
                <div style={sessionTitleText}>
                  {s.title}
                </div>
                <div style={sessionMeta}>
                  {s.speakers.length > 0 ? s.speakers[0].name : "TBA"} &middot;{" "}
                  {s.startTime} &ndash; {s.endTime}
                </div>
              </div>
              <CartToggleButton
                state={isPublished ? "published" : inCart ? "incart" : "default"}
                onClick={() => { if (!isPublished) toggleCart(s.id); }}
              />
            </div>
          );
        })}
        {todaySessions.length === 0 && (
          <p style={emptySessionsText}>
            No sessions scheduled for today.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
