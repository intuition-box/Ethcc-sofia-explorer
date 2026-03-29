import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ width = "100%", height = 20, borderRadius = 8, style }: SkeletonProps) {
  const skeletonStyle: CSSProperties = {
    width,
    height,
    borderRadius,
    background: "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    ...style,
  };

  return <div style={skeletonStyle} />;
}

export function SkeletonCircle({ size = 40, style }: { size?: number; style?: CSSProperties }) {
  return <Skeleton width={size} height={size} borderRadius="50%" style={style} />;
}

export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? "70%" : "100%"}
        />
      ))}
    </div>
  );
}

// Profile skeleton (avatar + name + stats)
export function SkeletonProfile() {
  return (
    <div style={{ textAlign: "center", padding: "20px 16px" }}>
      {/* Avatar */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <SkeletonCircle size={80} />
      </div>

      {/* Name */}
      <Skeleton height={24} width={180} style={{ margin: "0 auto 8px" }} />
      <Skeleton height={14} width={120} style={{ margin: "0 auto 16px" }} />

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 20 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <Skeleton height={28} width={50} />
            <Skeleton height={12} width={60} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Session list skeleton
export function SkeletonSessionList({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            padding: 12,
            display: "flex",
            gap: 10,
          }}
        >
          <SkeletonCircle size={40} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton height={16} width="100%" />
            <Skeleton height={12} width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Vibe match card skeleton
export function SkeletonVibeCard() {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      <SkeletonCircle size={36} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={10} width="50%" />
      </div>
      <Skeleton height={24} width={40} borderRadius={6} />
    </div>
  );
}
