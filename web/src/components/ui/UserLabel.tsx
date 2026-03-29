import { useState, useEffect } from "react";
import { fetchUserNickname } from "../../services/intuition";

interface UserLabelProps {
  address: string;
  style?: React.CSSProperties;
  truncate?: boolean;
}

export function UserLabel({ address, style, truncate = true }: UserLabelProps) {
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    fetchUserNickname(address)
      .then((name) => {
        setNickname(name);
      })
      .catch(() => {
        // Keep nickname as null, will show address
      });
  }, [address]);

  // Show nickname if available, otherwise show address immediately
  const displayText = nickname || (
    truncate && address.startsWith("0x") && address.length === 42
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address
  );

  return <div style={style}>{displayText}</div>;
}
