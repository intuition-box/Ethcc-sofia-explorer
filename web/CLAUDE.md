# EthCC[9] Cannes — UI Design System & Conventions

> Reference for Claude CLI / AI agents integrating or modifying this prototype.
> Source: `ethcc-app-prototype.tsx`

---

## Brand Identity: Sofia Kit (Dark Mode Only)

This app is **dark mode exclusively**. There is no light mode. All backgrounds are near-black, text is warm off-white, and accents use an iridescent peach palette.

---

## Color Palette (`const C`)

### Backgrounds
| Token | Value | Usage |
|---|---|---|
| `C.background` | `#0a0a0a` | Page/screen background |
| `C.surface` | `#161618` | Card backgrounds (legacy, prefer glassSurface) |
| `C.surfaceGray` | `#1c1c20` | Inactive buttons, input fields, secondary surfaces |
| `C.dark` | `#0a0a0a` | Alias for background |

### Text
| Token | Value | Usage |
|---|---|---|
| `C.textPrimary` | `#F2DED6` | Headings, primary content |
| `C.textSecondary` | `#a09088` | Subtitles, descriptions |
| `C.textTertiary` | `#6a5f5a` | Hints, inactive labels |
| `C.white` | `#FBF7F5` | Text on colored/dark backgrounds |

### Accent Colors
| Token | Value | Usage |
|---|---|---|
| `C.flat` | `#ffc6b0` | **PRIMARY ACCENT** — All active/selected states (nav, buttons, tabs, day selectors, badges). Flat peach from iridescence palette |
| `C.flatLight` | `rgba(255,198,176,0.15)` | Light tint of flat for subtle highlights |
| `C.primary` | `#cea2fd` | **DECORATIVE ONLY** — Avatars, gradients, QR codes, icons. NEVER for buttons or selections |
| `C.primaryLight` | `rgba(206,162,253,0.15)` | Light tint of primary for decorative backgrounds |
| `C.accent` | `#A6AF6B` | Secondary gradient color (used in avatar gradients with primary) |

### Semantic Colors
| Token | Value | Usage |
|---|---|---|
| `C.success` | `#22c55e` | Positive PnL, online status, verified, match % |
| `C.successLight` | `rgba(34,197,94,0.15)` | Success background tint |
| `C.error` | `#ef4444` | Negative PnL, remove actions |
| `C.errorLight` | `rgba(239,68,68,0.15)` | Error background tint |
| `C.trust` | `#00D4AA` | $TRUST token branding, chain info |
| `C.gold` | `#FCD34D` | XP rewards, podium |
| `C.warning` | `#f59e0b` | Warnings |

### Gradients
| Token | Value | Usage |
|---|---|---|
| `C.iridescence` | `linear-gradient(135deg, #D790C7 0%, #d37cbf 20%, #ffc6b0 50%, #ffa7b1 80%, #cea2fd 100%)` | **ONLY for `btnPill` (large CTA buttons)**. Do NOT use on small elements |
| `C.gradIr` | Same as iridescence | Alias |

### Borders
| Token | Value |
|---|---|
| `C.border` | `rgba(255,255,255,0.08)` |
| `C.borderLight` | `rgba(255,255,255,0.1)` |

---

## CRITICAL RULES — Flat vs Gradient

```
GRADIENT (C.iridescence / btnPill):
  ✅ Large CTA buttons (56px height, full-width, btnPill style)
  ❌ NEVER on small buttons, tabs, day selectors, badges, nav items

FLAT (C.flat / #ffc6b0):
  ✅ Active nav tab, selected day, active filter, vote tab, amount preset
  ✅ Badges (stats on profile), small action buttons, invite button
  ✅ Header backgrounds (Home, Vote pages)
  ✅ Text color for active labels in nav

C.primary (#cea2fd):
  ✅ Avatar gradients: linear-gradient(135deg, C.primary, C.accent)
  ✅ QR code pixels
  ✅ Decorative icons (MapPin, Link, etc.)
  ✅ "See all" / "View all" link text
  ❌ NEVER for active/selected UI states — use C.flat instead
```

---

## Border Radius (`const R`)

| Token | Value | Usage |
|---|---|---|
| `R.sm` | `4` | Micro elements |
| `R.md` | `8` | Small cards, inputs |
| `R.lg` | `12` | Cards, panels |
| `R.xl` | `20` | Large cards, QR containers |
| `R.btn` | `28` | Buttons, pills, tags |

---

## Typography

```typescript
const FONT = "'Gotu','Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
```

- **Headings**: fontSize 20-44, fontWeight 700-900, color `C.textPrimary`
- **Body**: fontSize 13-15, fontWeight 400-500, color `C.textSecondary`
- **Labels**: fontSize 10-12, fontWeight 500-600, color `C.textTertiary`
- **Monospace**: fontFamily `"monospace"` for addresses (0x...) and TX hashes
- All text uses `fontFamily: FONT` unless monospace

---

## Glassmorphism System

All cards and surfaces use glassmorphism. Do NOT use flat `background: C.surface` on new elements.

### Helpers (spread into style objects)

```typescript
// Base glass — for action bars, overlays
const glass: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)"
};

// Card glass — for standard cards
const glassCard: CSSProperties = {
  ...glass,
  borderRadius: R.lg,       // 12px
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
};

// Navigation bar
const glassNav: CSSProperties = {
  background: "rgba(22,22,24,0.75)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderTop: "1px solid rgba(255,255,255,0.08)"
};

// Surface cards — session cards, vibe cards, platform cards
const glassSurface: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: R.lg,       // 12px
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
};
```

### Usage pattern
```tsx
// ✅ Correct: spread glass helper then override
<div style={{ padding: 14, ...glassSurface, marginBottom: 10 }}>

// ❌ Wrong: flat background
<div style={{ padding: 14, borderRadius: R.lg, background: C.surface }}>
```

---

## Button Styles

### `btnPill` — Primary CTA
```typescript
const btnPill: CSSProperties = {
  width: "100%", height: 56, borderRadius: R.btn,
  background: C.iridescence,  // gradient only on these large buttons
  color: "#0a0a0a",           // black text on gradient
  fontSize: 16, fontWeight: 600,
  border: "none", cursor: "pointer", fontFamily: FONT,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
};
```
Usage: `<button style={btnPill}>`, or spread + override: `<button style={{...btnPill, background: C.success}}>`

### Small active buttons/tabs
```tsx
// Active state
background: C.flat, color: "#0a0a0a"

// Inactive state
background: C.surfaceGray, color: C.textSecondary
```

---

## Component Architecture

### Screen Components (full-page)
| Component | Route/State | Description |
|---|---|---|
| `Onboarding` | `screen === "onboarding"` | 8-step flow: Splash → Slides → Interests → Sessions → QR → VibeMatches |
| `HomePage` | `tab === "home"` | Balance header, Send/Invite actions, Nearby Vibes, Today's Sessions |
| `AgendaPage` | `tab === "agenda"` | Day filters, type filters, search, session cards with cart toggle |
| `CartPage` | `tab === "cart"` | Review selections, QR, TX summary, publish on-chain |
| `VotePage` | `tab === "vote"` | PnL header, Trending/My Votes/Discover tabs |
| `ProfilePage` | `tab === "profile"` | Stats badges, interests, vibe matches, connected platforms |
| `SessionDetail` | `session !== null` | Session info, trend, add to cart |
| `VibeProfile` | `vibeUser !== null` | User match profile, shared interests, connect |
| `InvitePage` | `showInvite` | Geolocation map, QR code, nearby user list |
| `SendPage` | `showSend` | QR code display / camera scan for $TRUST transfer |
| `BuyTrustPage` | `showBuy` | Amount picker, wallet connect (MetaMask), purchase |
| `LeaderboardPage` | `showLeaderboard` | PnL podium + ranked list |

### Shared Components
| Component | Props | Description |
|---|---|---|
| `SplashBg` | `children` | Diamond mesh + dot grid background for splash screen |
| `Logo` | `size` | EthCC logo (two circles) |
| `PhoneFrame` | `children` | 390×844 phone mockup container |
| `StatusBar` | `light?: boolean` | iOS status bar (9:41, signal, battery) |
| `Dots` | `n, a` | Pagination dots (active = `C.flat`) |
| `Spark` | `data, color, h` | Mini sparkline bar chart |
| `CBends` | `items` | Horizontal color distribution bar |
| `Nav5` | `active, onNav, cc` | Bottom nav (5 tabs, glass backdrop, center cart button) |
| `Header` | `title, onLeaderboard, dark` | Search bar + trophy + bell. `dark` prop for iridescent header |

### Icons (`Ic.*`)
All icons accept `{ s?: number, c?: string, f?: boolean }`:
`Home`, `Discover`, `Cart`, `Vote`, `User`, `Bell`, `Search`, `Trophy`, `Back`, `Right`, `Check`, `Send`, `Receive`, `Bank`, `Heart`, `ArrowUp`, `ArrowDown`, `People`, `Plus`, `Wallet`, `Settings`, `Clock`, `Pin`, `Share`, `Trash`, `ThumbUp`, `MapPin`, `Link`, `X`

---

## TypeScript Interfaces

```typescript
interface Track { id: string; name: string; color: string; icon: string; }
interface Session { id: number; title: string; speaker: string; trackId: string; type: "talk"|"workshop"|"panel"; time: string; date: string; stage: string; interested: number; trend: string; up: boolean; tags: string[]; desc: string; }
interface Web3Topic { id: string; name: string; cat: string; votes: number; pnl: string; up: boolean; mktCap: number; trend: number[]; }
interface Vibe { name: string; addr: string; shared: string[]; pct: number; online: boolean; dist: string; px?: number; py?: number; }
interface Platform { id: string; name: string; icon: string; color: string; desc: string; score: string; }
interface LeaderboardUser { name: string; addr: string; pnl: string; up: boolean; votes: number; mktCap: string; rank: number; isMe?: boolean; }
interface IconProps { s?: number; c?: string; f?: boolean; }
```

---

## On-Chain / Intuition Protocol Context

- **Chain**: 1155 (Intuition L3)
- **Token**: $TRUST (native gas token)
- **Contract**: `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e` (MultiVault)
- **Triples**: `[User] --interested by--> [Topic]`, `[User] --attending--> [Session]`
- **Publishing**: Interests and session selections are published as on-chain triples during onboarding (step 6: QR → TX)

---

## Navigation State Machine

```
App state:
  screen: "onboarding" | "app"
  tab: "home" | "agenda" | "cart" | "vote" | "profile"

Overlays (priority order, first match wins):
  vibeUser → VibeProfile
  showSend → SendPage
  showBuy → BuyTrustPage
  showLeaderboard → LeaderboardPage
  showInvite → InvitePage
  session → SessionDetail

Nav5 is visible only when: screen==="app" && no overlay active
```

---

## Common Patterns

### Card with glassmorphism
```tsx
<div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, ...glassSurface, marginBottom: 8, cursor: "pointer" }}>
```

### Avatar circle
```tsx
<div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
  {name.slice(0, 2)}
</div>
```

### Active/inactive toggle
```tsx
// Active
background: C.flat, color: "#0a0a0a"
// Inactive
background: C.surfaceGray, color: C.textSecondary
```

### PnL display
```tsx
<span style={{ color: item.up ? C.success : C.error, fontWeight: 700 }}>
  {item.pnl}
</span>
```

### Back button
```tsx
<button onClick={onBack} style={{ width: 42, height: 42, borderRadius: 14, background: C.surfaceGray, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
  <Ic.Back c={C.textPrimary} />
</button>
```
