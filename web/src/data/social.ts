import type { Vibe, Platform, LeaderboardUser } from "../types";

// ─── Mock vibe matches (to be replaced by Intuition GraphQL) ────
export const VIBES: Vibe[] = [
  { name: "Alice.eth", addr: "0xAlice...1234", shared: ["DeFi", "Privacy & ZK", "AI & Crypto"], pct: 91, online: true, dist: "12m" },
  { name: "0xBob", addr: "0xBob...5678", shared: ["Infrastructure", "Core Protocol"], pct: 72, online: true, dist: "45m" },
  { name: "CryptoCarla", addr: "0xCarla...9abc", shared: ["DeFi", "Governance", "MEV"], pct: 87, online: false, dist: "120m" },
  { name: "DevDave.eth", addr: "0xDave...def0", shared: ["AI & Crypto", "Security"], pct: 68, online: true, dist: "8m" },
  { name: "EthEnthusiast", addr: "0xEth...1111", shared: ["Core Protocol", "DeFi", "Infrastructure"], pct: 83, online: true, dist: "30m" },
  { name: "ZkZara.eth", addr: "0xZara...2222", shared: ["Privacy & ZK", "Security", "Core Protocol"], pct: 79, online: false, dist: "200m" },
  { name: "NftNina", addr: "0xNina...3333", shared: ["NFT & Culture", "Social & Identity"], pct: 65, online: true, dist: "55m" },
];

// ─── Connected platforms ────────────────────────────────────────
export const PLATFORMS: Platform[] = [
  { id: "github", name: "GitHub", icon: "🐙", color: "#333", desc: "Verify your repos & contributions", score: "+120 XP" },
  { id: "discord", name: "Discord", icon: "💬", color: "#5865F2", desc: "Link your Discord communities", score: "+60 XP" },
];

// ─── Mock leaderboard ───────────────────────────────────────────
export const LEADERBOARD: LeaderboardUser[] = [
  { name: "Alice.eth", addr: "0xAlice...1234", pnl: "+52.3%", up: true, votes: 24, mktCap: "412K", rank: 1 },
  { name: "0xBob", addr: "0xBob...5678", pnl: "+41.8%", up: true, votes: 19, mktCap: "328K", rank: 2 },
  { name: "Samuel.eth", addr: "0x1a2b...3c4d", pnl: "+38.1%", up: true, votes: 15, mktCap: "285K", rank: 3, isMe: true },
  { name: "DevDave.eth", addr: "0xDave...def0", pnl: "+29.4%", up: true, votes: 12, mktCap: "198K", rank: 4 },
  { name: "CryptoCarla", addr: "0xCarla...9abc", pnl: "+22.7%", up: true, votes: 18, mktCap: "176K", rank: 5 },
  { name: "EthEnthusiast", addr: "0xEth...1111", pnl: "+14.2%", up: true, votes: 11, mktCap: "142K", rank: 6 },
  { name: "ZkZara.eth", addr: "0xZara...2222", pnl: "+8.5%", up: true, votes: 9, mktCap: "98K", rank: 7 },
  { name: "NftNina", addr: "0xNina...3333", pnl: "-2.1%", up: false, votes: 7, mktCap: "67K", rank: 8 },
  { name: "GovGreg.eth", addr: "0xGreg...4444", pnl: "-5.8%", up: false, votes: 14, mktCap: "54K", rank: 9 },
  { name: "MevMaxi", addr: "0xMev...5555", pnl: "-11.3%", up: false, votes: 6, mktCap: "32K", rank: 10 },
];
