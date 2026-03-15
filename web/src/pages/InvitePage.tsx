import { useMemo, useState, useCallback, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, glassSurface, FONT } from "../config/theme";
import { QRCodeSVG } from "qrcode.react";
import { Ic } from "../components/ui/Icons";
import { VIBES } from "../data/social";


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
  padding: "16px 16px 8px",
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

const title: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  flex: 1,
};

// Radar map
const radarWrap: CSSProperties = {
  margin: "12px 16px",
  height: 220,
  position: "relative" as const,
  ...glassSurface,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const radarSvgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
};


// ─── Helpers ─────────────────────────────────────────

function parseDistance(dist: string): number {
  const n = parseInt(dist);
  return isNaN(n) ? 100 : n;
}


// ─── Component ───────────────────────────────────────

// ─── EthCC Cannes location (Palais des Festivals) ──
const ETHCC_CENTER = { lat: 43.5513, lng: 7.0170 };

export default function InvitePage() {
  const navigate = useNavigate();
  const walletAddr = localStorage.getItem("ethcc-wallet-address") ?? "";

  // ── Live geolocation ─────────────────────────────────
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "watching" | "denied" | "unavailable">("idle");
  const [geoError, setGeoError] = useState("");

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      setGeoError("Geolocation not supported");
      return;
    }
    setGeoStatus("watching");
    navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("watching");
      },
      (err) => {
        setGeoStatus("denied");
        setGeoError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }, []);

  // Distance from EthCC in meters
  const distFromVenue = useMemo(() => {
    if (!userPos) return null;
    const R = 6371000;
    const dLat = (userPos.lat - ETHCC_CENTER.lat) * Math.PI / 180;
    const dLng = (userPos.lng - ETHCC_CENTER.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(ETHCC_CENTER.lat * Math.PI / 180) * Math.cos(userPos.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [userPos]);

  const formatDist = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;

  // Sort by distance
  const sortedVibes = useMemo(() => {
    return [...VIBES].sort((a, b) => parseDistance(a.dist) - parseDistance(b.dist));
  }, []);

  // Generate deterministic positions for radar dots
  const radarDots = useMemo(() => {
    return sortedVibes.map((v, i) => {
      const dist = parseDistance(v.dist);
      const maxDist = 250;
      const r = Math.min(dist / maxDist, 0.95) * 110;
      const angle = ((i * 137.5 + 30) % 360) * (Math.PI / 180);
      return {
        x: 140 + Math.cos(angle) * r,
        y: 140 + Math.sin(angle) * r,
        vibe: v,
        idx: VIBES.indexOf(v),
      };
    });
  }, [sortedVibes]);

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          &#8249;
        </button>
        <div style={title}>Invite Nearby</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

      {/* Radar Map */}
      <div style={radarWrap}>
        <svg
          viewBox="0 0 280 280"
          style={radarSvgStyle}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid lines */}
          <line x1="0" y1="140" x2="280" y2="140" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="140" y1="0" x2="140" y2="280" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="40" y1="40" x2="240" y2="240" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <line x1="240" y1="40" x2="40" y2="240" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

          {/* Range circles */}
          {[35, 70, 105].map((r) => (
            <circle
              key={r}
              cx="140"
              cy="140"
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          ))}

          {/* Range labels */}
          <text x="178" y="108" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily={FONT}>
            50m
          </text>
          <text x="213" y="73" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily={FONT}>
            150m
          </text>
          <text x="248" y="38" fill="rgba(255,255,255,0.12)" fontSize="8" fontFamily={FONT}>
            250m
          </text>

          {/* Radar sweep (animated via CSS) */}
          <defs>
            <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.primary} stopOpacity="0" />
              <stop offset="100%" stopColor={C.primary} stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* ME center dot */}
          <circle cx="140" cy="140" r="6" fill={C.primary} />
          <circle cx="140" cy="140" r="10" fill="none" stroke={C.primary} strokeWidth="1" opacity="0.4">
            <animate attributeName="r" values="10;18;10" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
          <text
            x="140"
            y="157"
            textAnchor="middle"
            fill={C.primary}
            fontSize="8"
            fontWeight="700"
            fontFamily={FONT}
          >
            ME
          </text>

          {/* User dots */}
          {radarDots.map((dot, i) => (
            <g
              key={i}
              onClick={() => navigate(`/vibe/${dot.idx}`)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={dot.x}
                cy={dot.y}
                r="5"
                fill={dot.vibe.online ? C.success : C.textTertiary}
                opacity={dot.vibe.online ? 0.9 : 0.5}
              />
              {dot.vibe.online && (
                <circle cx={dot.x} cy={dot.y} r="8" fill="none" stroke={C.success} strokeWidth="0.5" opacity="0.3">
                  <animate attributeName="r" values="8;14;8" dur="4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                </circle>
              )}
              <text
                x={dot.x}
                y={dot.y + 14}
                textAnchor="middle"
                fill={C.textSecondary}
                fontSize="7"
                fontFamily={FONT}
              >
                {dot.vibe.name.length > 8 ? dot.vibe.name.slice(0, 8) + ".." : dot.vibe.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Live Location Section */}
      <div style={{ ...glassSurface, margin: "0 16px 16px", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Ic.MapPin s={18} c={C.primary} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Live Location</div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
              {geoStatus === "watching" && userPos
                ? `${distFromVenue !== null ? formatDist(distFromVenue) + " from Palais des Festivals" : "Tracking..."}`
                : geoStatus === "denied"
                  ? geoError || "Location access denied"
                  : "Share your position with nearby attendees"}
            </div>
          </div>
          {geoStatus === "watching" && userPos && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: C.success, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.success }}>Live</span>
            </div>
          )}
        </div>

        {geoStatus === "watching" && userPos && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.04)", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary }}>{userPos.lat.toFixed(4)}</div>
              <div style={{ fontSize: 10, color: C.textTertiary }}>Latitude</div>
            </div>
            <div style={{ flex: 1, padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.04)", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary }}>{userPos.lng.toFixed(4)}</div>
              <div style={{ fontSize: 10, color: C.textTertiary }}>Longitude</div>
            </div>
            {distFromVenue !== null && (
              <div style={{ flex: 1, padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.04)", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.trust }}>{formatDist(distFromVenue)}</div>
                <div style={{ fontSize: 10, color: C.textTertiary }}>Distance</div>
              </div>
            )}
          </div>
        )}

        {geoStatus === "idle" && (
          <button
            onClick={startTracking}
            style={{
              width: "100%", height: 44, borderRadius: 22,
              background: C.flat, color: "#0a0a0a",
              fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: FONT,
            }}
          >
            <Ic.MapPin s={16} c="#0a0a0a" /> Enable Live Location
          </button>
        )}

        {geoStatus === "denied" && (
          <button
            onClick={startTracking}
            style={{
              width: "100%", height: 44, borderRadius: 22,
              background: C.surfaceGray, color: C.textSecondary,
              fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            Retry Location Access
          </button>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

      {/* QR Code Section */}
      <div style={{ ...glassSurface, margin: "0 16px 16px", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Share Invite Link</div>
        <div style={{ fontSize: 12, color: C.textSecondary, textAlign: "center" }}>
          Let nearby attendees scan your code to connect on Intuition
        </div>
        <QRCodeSVG
          value={walletAddr ? `https://portal.intuition.systems/explore/atom/${walletAddr}` : "https://ethcc.io"}
          size={200}
          bgColor="transparent"
          fgColor="#ffffff"
          level="M"
        />
        <div style={{ fontSize: 11, color: C.textTertiary, fontFamily: "monospace", textAlign: "center" }}>
          {walletAddr ? `${walletAddr.slice(0, 10)}...${walletAddr.slice(-8)}` : "ethcc.io/invite"}
        </div>
      </div>

      </div>{/* end scrollable content */}
    </div>
  );
}
