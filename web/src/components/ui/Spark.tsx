import React from "react";

interface SparkProps {
  data: number[];
  color: string;
  h?: number;
}

export const Spark: React.FC<SparkProps> = ({ data, color, h = 36 }) => {
  const mx = Math.max(...data);
  return (
    <div style={{ height: h, display: "flex", alignItems: "flex-end", gap: 2 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, height: `${(v / mx) * 100}%`, borderRadius: 2,
          background: color, opacity: 0.25 + (i / data.length) * 0.75,
        }} />
      ))}
    </div>
  );
};
