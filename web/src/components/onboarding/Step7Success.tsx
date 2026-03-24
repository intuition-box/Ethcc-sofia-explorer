import { C, glassSurface, btnPill, getTrackStyle } from "../../config/theme";
import { VIBES } from "../../data/social";
import { SplashBg } from "../ui/SplashBg";
import { CBends } from "../ui/CBends";
import { explorerTxUrl } from "../../config/constants";
import styles from "./Step7Success.module.css";
import shared from "../../styles/shared.module.css";
import type { useVibeMatches } from "../../hooks/useVibeMatches";

interface Props {
  selectedTracks: Set<string>;
  txHash: string;
  vibeMatchesData: ReturnType<typeof useVibeMatches>["matches"];
  vibeLoading: boolean;
  canInstall: boolean;
  installed: boolean;
  promptInstall: () => void;
  onComplete: () => void;
}

export function Step7Success({
  selectedTracks, txHash, vibeMatchesData, vibeLoading,
  canInstall, installed, promptInstall, onComplete,
}: Props) {
  const staticVibeMatches = VIBES.filter((v) => v.shared.some((s) => selectedTracks.has(s))).slice(0, 4);
  const cbendItems = [...selectedTracks].map((name) => ({ c: getTrackStyle(name).color, v: 1 }));

  return (
    <SplashBg>
      <div className={styles.center}>
        <div className={styles.emoji}>&#127881;</div>
        <h1 className={styles.heading}>Profile Published!</h1>
        <p className={styles.sub}>Your preferences are now on-chain.</p>

        {txHash && (
          <a href={explorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className={styles.txLink}>
            View transaction &rarr;
          </a>
        )}

        {/* Interests */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Your Interests</p>
          {cbendItems.length > 0 && <div style={{ marginBottom: 12 }}><CBends items={cbendItems} /></div>}
          <div className={styles.trackPills}>
            {[...selectedTracks].map((name) => {
              const ts = getTrackStyle(name);
              return <span key={name} className={styles.trackPill} style={{ background: ts.color, borderColor: ts.color }}>{ts.icon} {name}</span>;
            })}
          </div>
        </div>

        {/* Vibe matches — real data */}
        {vibeLoading && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Searching for your vibe tribe...</p>
          </div>
        )}

        {!vibeLoading && vibeMatchesData.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Vibe Matches ({vibeMatchesData.length})</p>
            <div className={styles.vibeList}>
              {vibeMatchesData.slice(0, 6).map((m) => (
                <div key={m.subjectTermId} className={`${shared.glass} ${styles.vibeCard}`} style={glassSurface}>
                  <div className={styles.vibeAvatar}>{m.label.slice(2, 4).toUpperCase()}</div>
                  <div className={styles.vibeInfo}>
                    <div className={styles.vibeNameMono}>{m.label.slice(0, 6)}...{m.label.slice(-4)}</div>
                    <div className={styles.vibeShared}>{m.sharedTopics.join(", ")}</div>
                  </div>
                  <span className={styles.vibeScore}>{m.matchScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback static vibes */}
        {!vibeLoading && vibeMatchesData.length === 0 && staticVibeMatches.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Vibe Matches</p>
            <div className={styles.vibeList}>
              {staticVibeMatches.map((v, i) => (
                <div key={i} className={`${shared.glass} ${styles.vibeCard}`} style={glassSurface}>
                  <div className={styles.vibeAvatar}>{v.name.slice(0, 2).toUpperCase()}</div>
                  <div className={styles.vibeInfo}>
                    <div className={styles.vibeName}>{v.name}</div>
                    <div className={styles.vibeShared}>{v.shared.join(", ")}</div>
                  </div>
                  <span className={styles.vibeScore}>{v.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {canInstall && (
        <button className={styles.installBtn} style={{ ...btnPill, background: C.flat }} onClick={promptInstall}>
          Install App on Home Screen
        </button>
      )}
      {installed && <div className={styles.installedText}>App installed!</div>}

      <button className={styles.enterBtn} style={{ ...btnPill, background: C.flat }} onClick={onComplete}>
        Enter the App
      </button>
    </SplashBg>
  );
}
