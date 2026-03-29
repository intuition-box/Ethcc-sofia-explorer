import { useMemo } from "react";
import type { CSSProperties } from "react";
import { C, glassSurface, btnPill, FONT, getTrackStyle } from "../../config/theme";
import { sessions } from "../../data";
import { QRCodeSVG } from "qrcode.react";
import { Ic } from "../ui/Icons";
import { WalletPickerModal } from "./WalletPickerModal";
import styles from "./Step6ReviewPublish.module.css";
import shared from "../../styles/shared.module.css";
import { linkBtn } from "../../styles/common";
import type { useOnboardingWallet } from "../../hooks/useOnboardingWallet";

// ─── Extracted inline styles ────────────────────────────────────

/** Progress dot: active vs inactive */
const progressDotStyle = (active: boolean): CSSProperties => ({
  background: active ? C.flat : C.surfaceGray,
});

/** Settings menu item with colored text */
const settingsMenuItemStyle = (color: string): CSSProperties => ({
  color,
  fontFamily: FONT,
});

/** Wrapper around nickname input section */
const nicknameWrap: CSSProperties = { marginTop: 8 };

/** Glass row containing the nickname input + icon */
const nicknameInputCard: CSSProperties = {
  ...glassSurface,
  padding: 12,
  display: "flex",
  alignItems: "center",
  gap: 10,
};

/** The text input itself (transparent, fills available space) */
const nicknameInput: CSSProperties = {
  flex: 1,
  background: "none",
  border: "none",
  outline: "none",
  color: C.textPrimary,
  fontSize: 15,
  fontWeight: 600,
  fontFamily: FONT,
};

/** Hint text below nickname input */
const nicknameHint: CSSProperties = {
  fontSize: 11,
  color: C.textTertiary,
  marginTop: 6,
  paddingLeft: 4,
};

/** Nickname shown above QR code */
const qrNickname: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: C.white,
  marginBottom: 8,
};

/** Balance text color: green when funded, yellow when waiting */
const balanceColor = (hasFunds: boolean): CSSProperties => ({
  color: hasFunds ? C.success : C.warning,
});

/** Disconnect link below QR card */
const disconnectLinkStyle: CSSProperties = { fontFamily: FONT };

/** Transaction details glass card */
const txDetailsCard: CSSProperties = {
  ...glassSurface,
  marginTop: 16,
  padding: 16,
};

/** Skip link with extra top margin (used inside error card) */
const skipLinkWithMargin: CSSProperties = {
  ...linkBtn,
  marginTop: 8,
};

/** Interests / Sessions section wrapper */
const sectionWrap: CSSProperties = { marginTop: 20 };

/** Track pill: background + border from track color */
const trackPillStyle = (color: string): CSSProperties => ({
  background: color,
  borderColor: color,
});

/** Session list item glass card */
const sessionItemCard: CSSProperties = {
  ...glassSurface,
  padding: 12,
};

/** Backup key copy button (changes color on copy) */
const backupCopyBtn = (copied: boolean): CSSProperties => ({
  ...btnPill,
  height: 40,
  fontSize: 13,
  background: copied ? C.success : C.surfaceGray,
  color: copied ? "#0a0a0a" : C.textPrimary,
});

/** "I've saved it — Continue" button */
const backupContinueBtn: CSSProperties = { ...btnPill, background: C.flat };

/** Back button */
const backBtn: CSSProperties = {
  ...btnPill,
  flex: 1,
  background: C.surfaceGray,
  color: C.textPrimary,
};

/** Primary action button (connect / publish) */
const primaryBtn: CSSProperties = { ...btnPill, flex: 2, background: C.flat };

/** Connecting / disabled button */
const connectingBtn: CSSProperties = {
  ...btnPill,
  flex: 2,
  background: C.flat,
  opacity: 0.5,
};

/** Wrapper column when waiting for $TRUST */
const waitingColumn: CSSProperties = {
  flex: 2,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

/** Disabled "Waiting for $TRUST" button */
const waitingBtn: CSSProperties = {
  ...btnPill,
  background: C.flat,
  opacity: 0.5,
};

/** Signing in-progress button */
const signingBtn: CSSProperties = {
  ...btnPill,
  flex: 1,
  background: C.flat,
  opacity: 0.5,
};

/** Published / done button */
const doneBtn: CSSProperties = {
  ...btnPill,
  flex: 1,
  background: C.success,
};

interface Props {
  selectedTracks: Set<string>;
  selectedSessions: Set<string>;
  walletState: "idle" | "connecting" | "connected" | "signing" | "done";
  w: ReturnType<typeof useOnboardingWallet>;
  nickname: string;
  onNicknameChange: (v: string) => void;
  onBack: () => void;
  onPublish: () => void;
  onSkip: () => void;
}

export function Step6ReviewPublish({ selectedTracks, selectedSessions, walletState, w, nickname, onNicknameChange, onBack, onPublish, onSkip }: Props) {
  const selectedSessionObjects = useMemo(
    () => sessions.filter((s) => selectedSessions.has(s.id)),
    [selectedSessions],
  );
  const tripleCount = selectedTracks.size + selectedSessions.size;
  const isWalletActive = walletState === "connected" || walletState === "signing" || walletState === "done";

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.progressBar}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.progressDot} style={progressDotStyle(i <= 2)} />
          ))}
        </div>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Review &amp; publish</h2>
          <div className={styles.settingsWrap}>
            <button className={styles.settingsBtn} onClick={() => w.setShowSettings((v: boolean) => !v)}>
              <Ic.Settings s={18} c={C.textSecondary} />
            </button>
            {w.showSettings && (
              <div className={`${shared.glass} ${styles.settingsMenu}`}>
                {(w.walletConnected || w.embeddedWallet) && (
                  <button className={styles.settingsMenuItem} style={settingsMenuItemStyle(C.warning)} onClick={w.handleDisconnect}>
                    Disconnect wallet
                  </button>
                )}
                <button className={styles.settingsMenuItem} style={settingsMenuItemStyle(C.error)} onClick={w.handleClearAllData}>
                  Clear all data
                </button>
              </div>
            )}
          </div>
        </div>
        <p className={styles.subtitle}>
          {walletState === "idle" && "Connect your wallet, then sign to publish on-chain."}
          {walletState === "connecting" && "Connecting to your wallet..."}
          {walletState === "connected" && (parseFloat(w.effectiveBalance ?? "0") > 0
            ? "Wallet connected. Ready to publish."
            : "Scan QR to receive $TRUST, then sign to publish on-chain.")}
          {walletState === "signing" && "⏳ Transaction in progress - this may take 30-60 seconds..."}
          {walletState === "done" && "Published! Redirecting..."}
        </p>
      </div>

      {/* Scroll area */}
      <div className={styles.scrollArea}>
        {/* Nickname input */}
        <div style={nicknameWrap}>
          <p className={styles.sectionLabel}>Your Nickname</p>
          <div className={shared.glass} style={nicknameInputCard}>
            <Ic.User s={18} c={C.textTertiary} />
            <input
              type="text"
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              placeholder="Enter a nickname..."
              maxLength={32}
              style={nicknameInput}
            />
          </div>
          {nickname.trim() && (
            <p style={nicknameHint}>
              This name will be linked to your on-chain profile.
            </p>
          )}
        </div>

        {/* QR Code */}
        {isWalletActive ? (
          <div className={`${shared.glass} ${styles.qrCard}`}>
            {nickname.trim() && (
              <div style={qrNickname}>{nickname.trim()}</div>
            )}
            <QRCodeSVG value={w.effectiveAddress ?? ""} size={160} bgColor="transparent" fgColor="#ffffff" level="M" />
            <div
              className={styles.addressRow}
              onClick={() => { if (w.effectiveAddress) { navigator.clipboard.writeText(w.effectiveAddress); w.setTxStatus("Address copied!"); setTimeout(() => w.setTxStatus(""), 2000); } }}
            >
              <p className={styles.address}>
                {w.effectiveAddress ? `${w.effectiveAddress.slice(0, 6)}...${w.effectiveAddress.slice(-4)}` : ""}
              </p>
              {w.effectiveAddress && <Ic.Copy s={14} c={C.textTertiary} />}
            </div>
            {w.effectiveBalance !== null && (
              <div className={styles.balanceRow}>
                <p className={styles.balance} style={balanceColor(parseFloat(w.effectiveBalance) > 0)}>
                  {parseFloat(w.effectiveBalance) > 0 ? `${parseFloat(w.effectiveBalance).toFixed(4)} TRUST` : "Waiting for $TRUST..."}
                </p>
                {w.embeddedWallet && (
                  <button className={styles.refreshBtn} onClick={w.refreshEmbeddedBalance} disabled={w.balanceRefreshing}>
                    {w.balanceRefreshing ? "..." : "Refresh"}
                  </button>
                )}
              </div>
            )}
            {walletState === "connected" && w.walletConnected && (
              <button className={styles.disconnectLink} style={disconnectLinkStyle} onClick={w.disconnectWallet}>
                Disconnect wallet
              </button>
            )}
          </div>
        ) : (
          <div className={`${shared.glass} ${styles.qrCard}`}>
            <div className={styles.qrPlaceholder}>QR Code</div>
            <p className={styles.qrHint}>Connect wallet to show your address QR</p>
          </div>
        )}

        {/* Transaction details */}
        <div className={shared.glass} style={txDetailsCard}>
          <p className={styles.txDetailsTitle}>Transaction Details</p>
          <div className={styles.txRow}><span>Network</span><span>Intuition (Chain 1155)</span></div>
          <div className={styles.txRow}><span>Triples to create</span><span>{tripleCount}</span></div>
          <div className={styles.txRow}><span>Est. cost</span><span>{(tripleCount * 0.1).toFixed(1)} TRUST</span></div>
        </div>

        {/* Transaction progress */}
        {walletState === "signing" && (
          <div className={`${shared.glass} ${styles.signingCard}`}>
            <div className={styles.signingSpinner}>⏳</div>
            <p className={styles.signingTitle}>Publishing to blockchain...</p>
            <p className={styles.signingStatus}>{w.txStatus || "Creating triples on-chain"}</p>
            <div className={styles.signingSteps}>
              <div>1. Signing transaction</div>
              <div>2. Broadcasting to network</div>
              <div>3. Waiting for confirmation</div>
            </div>
            <p className={styles.signingHint}>This usually takes 30-60 seconds. Please don't close this window.</p>
          </div>
        )}

        {/* Error */}
        {w.txError && (
          <div className={`${shared.glass} ${styles.errorCard}`}>
            <p className={styles.errorText}>{w.txError}</p>
            <button
              onClick={onSkip}
              style={skipLinkWithMargin}
            >
              Skip and enter the app &rarr;
            </button>
          </div>
        )}

        {/* Interests */}
        <div style={sectionWrap}>
          <p className={styles.sectionLabel}>Interests ({selectedTracks.size})</p>
          <div className={styles.trackPills}>
            {[...selectedTracks].map((name) => {
              const ts = getTrackStyle(name);
              return (
                <span key={name} className={styles.trackPill} style={trackPillStyle(ts.color)}>
                  {ts.icon} {name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sessions */}
        {selectedSessionObjects.length > 0 && (
          <div style={sectionWrap}>
            <p className={styles.sectionLabel}>Sessions ({selectedSessionObjects.length})</p>
            <div className={styles.sessionList}>
              {selectedSessionObjects.map((s) => {
                const ts = getTrackStyle(s.track);
                return (
                  <div key={s.id} className={shared.glass} style={sessionItemCard}>
                    <div className={styles.sessionRow}>
                      <span className={styles.sessionIcon}>{ts.icon}</span>
                      <span className={styles.sessionTitle}>{s.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        {w.embeddedMode === "backup" ? (
          <div className={styles.backupColumn}>
            <div className={`${shared.glass} ${styles.backupCard}`}>
              <p className={styles.backupWarning}>Save your private key! You won't see it again.</p>
              <p className={styles.backupKey}>{w.embeddedPrivateKey}</p>
              <button
                style={backupCopyBtn(w.embeddedKeyCopied)}
                onClick={() => { navigator.clipboard.writeText(w.embeddedPrivateKey); w.setEmbeddedKeyCopied(true); }}
              >
                {w.embeddedKeyCopied ? "Copied!" : "Copy Private Key"}
              </button>
            </div>
            <button style={backupContinueBtn} onClick={w.handleBackupDone}>I've saved it — Continue</button>
          </div>
        ) : (
          <div className={styles.buttonRow}>
            {walletState !== "signing" && walletState !== "done" && (
              <button style={backBtn} onClick={onBack}>Back</button>
            )}
            {walletState === "idle" && w.embeddedMode === "none" && (
              <button style={primaryBtn} onClick={() => w.setShowWalletPicker(true)}>Connect Wallet</button>
            )}
            {walletState === "connecting" && (
              <button style={connectingBtn} disabled>Connecting...</button>
            )}
            {walletState === "connected" && (
              parseFloat(w.effectiveBalance ?? "0") > 0
                ? <button style={primaryBtn} onClick={onPublish}>Publish On-Chain</button>
                : <div style={waitingColumn}>
                    <button style={waitingBtn} disabled>Waiting for $TRUST...</button>
                    <button
                      onClick={onSkip}
                      style={linkBtn}
                    >
                      Skip for now &rarr;
                    </button>
                  </div>
            )}
            {walletState === "signing" && (
              <button style={signingBtn} disabled>Signing... {w.txStatus}</button>
            )}
            {walletState === "done" && (
              <button style={doneBtn} disabled>Published!</button>
            )}
          </div>
        )}
      </div>

      {/* Wallet Picker Modal */}
      {w.showWalletPicker && walletState === "idle" && (
        <WalletPickerModal
          onClose={() => w.setShowWalletPicker(false)}
          onExternalWallet={w.openWalletModal}
          onCreateEmbedded={w.handleCreateEmbedded}
          onUnlockEmbedded={async (pw: string) => { if (await w.handleUnlockEmbedded(pw)) w.setShowWalletPicker(false); }}
          onBackupDone={w.handleBackupDone}
          embeddedMode={w.embeddedMode}
          setEmbeddedMode={w.setEmbeddedMode}
          embeddedPrivateKey={w.embeddedPrivateKey}
          embeddedKeyCopied={w.embeddedKeyCopied}
          setEmbeddedKeyCopied={w.setEmbeddedKeyCopied}
          txError={w.txError}
        />
      )}
    </>
  );
}
