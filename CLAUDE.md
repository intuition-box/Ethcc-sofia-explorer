# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EthCC[9] conference companion app (Cannes, March 30 – April 2, 2026). Attendees browse sessions, pick topics, and publish their profile on-chain via the Intuition Protocol (L3 Chain 1155, $TRUST token). Mobile-first PWA with dark glassmorphism UI.

## Development Commands

All commands run from the `web/` directory. Uses **bun** and requires **Node 22.14.0+**.

```bash
bun dev           # Vite dev server on localhost:5173 (proxies /api/graphql to Intuition)
bun run build     # tsc -b && vite build → dist/
bun run preview   # Serve built dist locally
bun test          # Vitest watch mode
bun run test:run  # Single test run (CI)
```

Run a single test file: `bun vitest run src/test/useCart.test.ts`

## Architecture

Layered architecture in `web/src/`:

- **Pages** — Thin orchestrators composing hooks + components. Routes defined in `main.tsx` (react-router-dom v7).
- **Hooks** — State management (useCart with `useSyncExternalStore`, useWallet, useSessionFilter). No Redux/Zustand — pure React hooks + external store pattern.
- **Components** — Presentational, props-driven. Inline styles using theme objects from `config/theme.ts`.
- **Services** — Business logic: `intuition.ts` (on-chain ops), `StorageService.ts` (localStorage OOP wrapper), `embeddedWallet.ts` (client-side AES-GCM encrypted wallet), ENS, voting, leaderboard, notifications.
- **Config** — `constants.ts` (storage keys, chain config, URLs), `theme.ts` (colors, glass helpers), `appkit.ts` (multi-wallet setup).

Static data lives in `bdd/` (sessions.json, speakers.json, tracks.json) imported via `data/index.ts`.

## Key Technical Details

- **React 19 + TypeScript 5.8 + Vite 6** — strict mode enabled, no unused locals/params
- **Styling**: Inline CSS objects, no CSS-in-JS library, no Tailwind. Design system defined in `config/theme.ts` with glass morphism helpers (`glassCard`, `glassSurface`, `glassNav`)
- **Web3**: ethers.js v6 + @reown/appkit (MetaMask, WalletConnect, Coinbase). Chain 1155 (Intuition L3)
- **PWA**: vite-plugin-pwa with Workbox, service worker for push notifications
- **Data fetching**: GraphQL via fetch (no Apollo/urql), Blockscout API for leaderboard
- **Testing**: Vitest + @testing-library/react + jsdom. Test setup mocks localStorage and clipboard in `src/test/setup.ts`

## Design System

Full design system reference is in [web/CLAUDE.md](web/CLAUDE.md). Key rules:

- **Dark mode only** — backgrounds are near-black (#0a0a0a), text is warm off-white
- **C.flat (#ffc6b0)** for all active/selected UI states (nav, buttons, tabs)
- **C.iridescence gradient** ONLY on large CTA buttons (btnPill, 56px height)
- **C.primary (#cea2fd)** is decorative only (avatars, QR, icons) — never for selection states
- All cards use `glassSurface` or `glassCard` spread objects — no flat `background: C.surface`
- Input fields use opaque `C.surfaceGray`, not transparent backgrounds
- All UI text must be in English

## On-Chain Context

- **Chain**: 1155 (Intuition L3), token: $TRUST
- **MultiVault**: `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e`
- **Sofia Fee Proxy**: `0x26F81d723Ad1648194FAa4b7E235105Fd1212c6c`
- **GraphQL**: `https://mainnet.intuition.sh/v1/graphql` (proxied in dev via `/api/graphql`)
- Profile triples: `[User] --are interested by--> [Track]`, `[User] --attending--> [Session]`
- Published sessions are permanent — once on-chain, cannot be removed from cart

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`): push to main triggers build + deploy. Vite base path is `/` (configured for Coolify). The workflow copies `dist/index.html` → `dist/404.html` for SPA routing.
