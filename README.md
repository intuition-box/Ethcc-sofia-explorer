# EthCC[9] Agenda & On-Chain Profile

> **Cannes, March 30 – April 2, 2026**

A conference companion app for [EthCC\[9\]](https://ethcc.io) that lets attendees browse the full agenda, pick sessions, select topics of interest, and publish their profile on-chain via the [Intuition Protocol](https://intuition.systems).

---

## What it does

1. **Browse** — Explore 83 sessions across 17 tracks, filter by day / topic / type, search by keyword or speaker
2. **Curate** — Add sessions to your cart (track interests are automatically added)
3. **Commit on-chain** — One-click MetaMask flow creates your profile as triples on Intuition's knowledge graph (L3, Chain 1155)
4. **Discover** — See how many other attendees share your interests in real-time via Intuition's GraphQL API
5. **Find Your Tribe** — After publishing, discover users with shared interests through vibe matching

> **New in March 2026:**
> - Mobile-optimized publish success UI with bottom sheet design
> - "Find Your Tribe" feature to discover users with shared interests/sessions
> - Back navigation in cart for better UX
> - Real-time cost breakdown with collapsible details

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6 |
| Routing | react-router-dom v7 |
| On-chain | ethers.js v6, Intuition MultiVault (Chain 1155) |
| Data | Static JSON dataset (83 sessions, 278 speakers, 17 tracks, 8 stages) |
| Style | Dark "Riviera Crypto Festival" theme, glass-morphism, Sora + DM Sans |
| Deployment | GitHub Pages via GitHub Actions |

---

## Quick start

```bash
# Prerequisites: Node.js 18+, bun

cd web
bun install
bun dev         # http://localhost:5173
```

Production build:

```bash
bun run build   # type-check + bundle
bun run preview # serve the build locally
```

---

## Project structure

```
Treepl/
├── bdd/                              # Static data layer
│   ├── sessions.json                 # 83 sessions
│   ├── speakers.json                 # 278 speakers
│   ├── stages.json                   # 8 stages
│   ├── tracks.json                   # 17 tracks
│   ├── daily_schedule.json           # Sessions grouped by day
│   ├── intuition_graph.json          # On-chain atom & triple IDs
│   └── schema.graphql                # Canonical data model
│
├── web/                              # React SPA
│   └── src/
│       ├── main.tsx                  # Router + ErrorBoundary
│       │
│       ├── config/
│       │   └── constants.ts          # Storage keys, colors, chain config, URLs
│       │
│       ├── types/
│       │   └── index.ts              # Session, Speaker, Track interfaces
│       │
│       ├── data/
│       │   └── index.ts              # JSON imports + derived lists
│       │
│       ├── utils/
│       │   ├── date.utils.ts         # Date formatting helpers
│       │   └── session.utils.ts      # Grouping, set toggle helpers
│       │
│       ├── services/
│       │   ├── StorageService.ts     # localStorage abstraction (OOP)
│       │   └── intuition.ts          # Intuition SDK (wallet, atoms, triples)
│       │
│       ├── hooks/
│       │   ├── useCart.ts            # Cart state + persistence
│       │   ├── useSessionFilter.ts   # Filter state + derived data
│       │   ├── useInterestCounts.ts  # GraphQL interest polling
│       │   └── useWallet.ts          # Wallet connection + tx flow
│       │
│       ├── components/
│       │   ├── ui/
│       │   │   └── ErrorBoundary.tsx
│       │   ├── session/
│       │   │   └── SessionCard.tsx   # Glass card with type-colored accent
│       │   ├── toolbar/
│       │   │   └── Toolbar.tsx       # Search + day/type/topic filter pills
│       │   ├── cart/
│       │   │   └── PublishSuccessSheet.tsx  # Mobile-optimized success modal with vibe matching
│       │   └── profile/
│       │       ├── RecapStep.tsx     # Interests + sessions recap
│       │       ├── WalletStep.tsx    # QR code + wallet connect
│       │       ├── SuccessStep.tsx   # On-chain success view
│       │       └── TransactionSummary.tsx
│       │
│       ├── pages/
│       │   ├── AgendaPage.tsx        # Main layout, session grid
│       │   ├── SpeakerPage.tsx       # Speaker profile & talk timeline
│       │   └── ProfilePage.tsx       # Cart recap, tx preview, MetaMask flow
│       │
│       └── styles/
│           ├── index.css             # Barrel import
│           ├── globals.css           # Tokens, reset, keyframes
│           ├── hero.css              # Hero header
│           ├── toolbar.css           # Toolbar + pills
│           ├── session.css           # Cards + grid
│           ├── speaker.css           # Speaker profile
│           ├── profile.css           # Profile + wallet + tx
│           └── responsive.css        # Media queries
│
└── Triples/                          # On-chain seeding tools (browser + MetaMask)
    ├── seed.html                     # Batch-create all atoms & triples
    ├── fix_missing.html              # Patch missing speaker triples
    └── create_predicates.html        # Create interest/attending predicates
```

---

## Architecture

The app follows a **layered architecture** with clear separation of concerns:

- **Config** — Centralized constants (no magic strings scattered in components)
- **Services** — Business logic classes (`StorageService` for persistence, `intuition.ts` for Web3, `profileSync.ts` for on-chain queries)
- **Hooks** — State management encapsulated in custom hooks (`useCart`, `useWallet`, `useSessionFilter`, `useInterestCounts`)
- **Components** — Presentational components receiving data via props
- **Pages** — Thin orchestrators that compose hooks + components

### On-Chain First Architecture

The app uses **on-chain data as the source of truth** via Intuition's GraphQL API:

- **Before publish**: Interests derived from cart (sessions auto-add their tracks)
- **After publish**: Profile synced from blockchain via `syncProfileFromChain()`
- **Real-time counts**: GraphQL polling shows how many attendees share your interests

```
┌─────────────┐  auto-add   ┌──────────────┐   publish   ┌─────────────────┐
│  Add Session│ ────────────►│ Cart Storage │ ────────────►│  On-Chain Triple│
│             │  interest:*  │ (localStorage)│  MetaMask   │   (Chain 1155)  │
└─────────────┘              └──────────────┘             └─────────────────┘
                                                                   │
                                                                   │ sync
                                                                   ▼
                                                           ┌─────────────────┐
                                                           │ GraphQL Query   │
                                                           │ (source of truth)│
                                                           └─────────────────┘
```

---

## User flow

### Simplified Flow (March 2026)

```
┌──────────┐   filter/search   ┌──────────────┐  select sessions   ┌──────────┐
│  Agenda  │ ─────────────────►│ Session Grid │ ─────────────────►│   Cart   │
│  Page    │  day/type/topic   │ (all visible)│  auto-add track   │          │
└──────────┘                   └──────────────┘                    └────┬─────┘
                                                                         │ "Publish"
     ┌───────────────┐   sign tx    ┌──────────┐   connect     ┌────────▼────┐
     │   Success     │◄─────────────│  Wallet  │◄──────────────│   Profile   │
     │  (on-chain!)  │  MetaMask    │  Connect │               │   Recap     │
     └───────┬───────┘              └──────────┘               └─────────────┘
             │
             │ sync profile from chain
             ▼
     ┌───────────────┐
     │  GraphQL API  │ ← Source of truth for all on-chain data
     └───────────────┘
```

**Key improvements:**
- ✅ All sessions visible by default (no unlocking needed)
- ✅ Adding a session automatically adds its track interest
- ✅ Single publish flow (one transaction for everything)
- ✅ Profile synced from blockchain after publish

---

## Intuition integration

All conference data lives on-chain as **atoms** and **triples** on the Intuition knowledge graph.

| Concept | Count |
|---|---|
| Atoms (sessions, speakers, tracks, predicates) | 173 |
| `has tag` triples (session -> track) | 83 |
| `presented at` triples (speaker -> session) | 83 |
| `speaking at` triples (speaker -> session) | 73 |

**User profile flow:**

When you add sessions to your cart and publish, the app creates triples like:

```
[Your wallet] ──are interested by──► [DeFi]               # Auto-added from session
[Your wallet] ──are interested by──► [AI & Crypto]        # Auto-added from session
[Your wallet] ──attending──► [Session: "ZK Proofs in Practice"]
[Your wallet] ──attending──► [Session: "MEV Panel"]
```

All triples are created in a **single batch transaction** on Chain 1155 ($TRUST).

**Auto-add logic:**
- When you add a session to cart → its track is automatically added as `interest:{track}`
- When you remove a session → its track interest is removed only if no other sessions use that track
- Example: Add "ZK Proofs" (DeFi track) → `interest:DeFi` auto-added to cart

| Key | Value |
|---|---|
| Contract | `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e` |
| Chain ID | 1155 |
| Native token | $TRUST |
| GraphQL | `https://mainnet.intuition.sh/v1/graphql` |

---

## Storage & State Management

### Cart System

The cart is stored in **localStorage** as a `Set<string>` containing:
- Session IDs (e.g., `"session-123"`)
- Track interests (e.g., `"interest:DeFi"`)
- Votes and follows (future features)

**Implementation:** [web/src/hooks/useCart.ts](web/src/hooks/useCart.ts)

```typescript
// Auto-add interest when adding session
cart.add("session-123");
cart.add("interest:DeFi");  // ← Automatically added

// Auto-remove interest when removing session (if no other sessions use that track)
cart.delete("session-123");
cart.delete("interest:DeFi");  // ← Only removed if no other DeFi sessions in cart
```

### Profile Sync

After publishing on-chain, the app queries the blockchain via GraphQL to sync your profile:

**Implementation:** [web/src/services/profileSync.ts](web/src/services/profileSync.ts)

```typescript
import { syncProfileFromChain } from "./services/profileSync";

const profile = await syncProfileFromChain(walletAddress);
// Returns: { interests: Set<string>, sessions: Set<string>, votes: Set<string> }
```

**Used in:**
- [HomePage.tsx](web/src/pages/HomePage.tsx) - Display user interests
- [ProfilePage.tsx](web/src/pages/ProfilePage.tsx) - Show published data
- [VibeProfilePage.tsx](web/src/pages/VibeProfilePage.tsx) - Public profiles

### localStorage Keys

All storage keys centralized in [web/src/config/constants.ts](web/src/config/constants.ts):

```typescript
export const STORAGE_KEYS = {
  CART: "ethcc-cart",                       // Current cart (before publish)
  PUBLISHED_SESSIONS: "ethcc-published-sessions",  // Cache (after publish)
  WALLET_ADDRESS: "ethcc-wallet-address",
  ONBOARDED: "ethcc-onboarded",
  // ... see constants.ts for full list
} as const;
```

**Note:** `TOPICS` and `PENDING_TOPICS` were removed in March 2026 refactoring. Interests are now derived from cart or synced from chain.

---

## New Features (March 2026)

### Mobile-Optimized Publish Success UI

After publishing your cart, a beautiful bottom sheet appears with:

**Visual Summary:**
- Animated cards showing what was published (interests, sessions, votes, ratings, follows)
- Count-up animations for each category
- Color-coded icons matching the app theme

**Cost Transparency:**
- Collapsible breakdown showing exact costs paid
- Deposits (recoverable), MultiVault fees, Sofia fees
- Total displayed in TRUST with 4 decimal precision

**Vibe Matching:**
- "Find Your Tribe" button to discover users with shared interests
- Shows up to 6 matches with shared topics/sessions
- Loading spinner with friendly message
- Empty state encouraging early adopters

**Quick Actions:**
- View transaction on block explorer
- Open Intuition profile
- Navigate to votes or agenda
- Share functionality (PWA-optimized)

**Technical Highlights:**
- Mobile-first design (bottom sheet on phone, modal on desktop)
- Haptic feedback on all interactions
- Supports `prefers-reduced-motion` for accessibility
- Responsive animations optimized for 60fps

**Implementation:** [PublishSuccessSheet.tsx](web/src/components/cart/PublishSuccessSheet.tsx)

### Cart Navigation Improvements

**Back Button:**
- Sticky header with back arrow in CartPage
- Navigate to previous page with `navigate(-1)`
- "Go Back" button in empty cart state
- No more getting stuck in empty cart!

**Better UX Flow:**
```
User Profile → Click Follow → Cart opens → Empty? → Go Back → Profile restored
```

---

## License

MIT
