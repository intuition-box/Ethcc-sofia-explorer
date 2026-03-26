import { C, glassSurface, btnPill, getTrackStyle, avatarColor } from "../../config/theme";
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
  onComplete,
}: Props) {
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
                  <div className={styles.vibeAvatar} style={{ background: avatarColor(m.label) }}>{m.label.slice(2, 4).toUpperCase()}</div>
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

        {/* No matches yet */}
        {!vibeLoading && vibeMatchesData.length === 0 && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Vibe matches will appear after others publish their profiles.</p>
          </div>
        )}
      </div>

      <button className={styles.enterBtn} style={{ ...btnPill, background: C.flat }} onClick={onComplete}>
        Enter the App
      </button>
    </SplashBg>
  );
}
