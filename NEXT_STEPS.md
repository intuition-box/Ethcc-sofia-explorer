# EthCC App - Next Steps

> Mis a jour le 20 mars 2026.

---

## SEEDING ON-CHAIN — TERMINE

| Donnee | On-chain | Status |
|---|---|---|
| Atoms | 513+ (497 + 16 speakers) | Done |
| presented at -> EthCC[9] | 395 | Done |
| has tag | 502+ | Done |
| speaking at | 384 (352 + 32) | Done |
| Side events | 78 atoms + has tag | Done |

---

## TERMINE

### Donnees

| # | Feature | Status |
|---|---------|--------|
| ~~1~~ | ~~MAJ sessions.json + speakers.json~~ | Done — sessions.json = 395 (317 EthCC + 78 side events), speakers.json = 347 (341 + 6 manquants ajoutés) |
| ~~3~~ | ~~Push notifications (app fermée)~~ | Done — VAPID/Web Push: `push-sw.js` + `pushService.ts` + `scripts/send-push.mjs`. SW importé via Workbox `importScripts`. Subscription auto au lancement. |
| ~~12~~ | ~~SessionDetailPage bell notification~~ | Done — bouton bell toggle replay notif + bulle confirmation 3s |

### Bugs UI / UX

| # | Bug | Page | Status |
|---|-----|------|--------|
| ~~5~~ | ~~Opacite bg events onboarding~~ | `OnboardingPage.tsx` | Done |
| ~~6~~ | ~~Notif reception trust token onboarding~~ | `OnboardingPage.tsx` | Done |
| ~~7~~ | ~~Supprimer "My Wallet" dans Invite~~ | `InvitePage.tsx` | Done |
| ~~8~~ | ~~HomePage bouton state "In cart"~~ | `HomePage.tsx` | Done |
| ~~9~~ | ~~Add Interest ajoute sessions au panier~~ | `AgendaPage.tsx` | Done |
| ~~10~~ | ~~Profile ne recupere pas l'ENS~~ | `ProfilePage.tsx` | Done |
| ~~11~~ | ~~Bg opaque "Find your people"~~ | `VibesListPage.tsx` | Done |

---

## RESTE A FAIRE

### Donnees

| # | Feature | Effort | Details |
|---|---------|--------|---------|
| 2 | **Replays** — notif quand dispo | Moyen | Bloque par les liens YouTube. Polling `replays.json` pret cote code. |

### Tests & QA

| # | Tache | Effort | Details |
|---|-------|--------|---------|
| 13 | **Tests E2E** | Long | Playwright/Cypress pour les flows complets |
| 14 | **Tester PWA install post-tx** | Court | Verifier sur mobile Chrome + Safari |
| 15 | **Re-scraper le site EthCC** | Court | Verifier regulierement que les 395 sessions sont a jour |

### Questions ouvertes

| # | Question | Contexte |
|---|----------|----------|
| Q3 | **Embedded wallet + backup** — Si l'utilisateur ferme l'app avant de backup sa cle ? | `OnboardingPage.tsx` |

---

## DONNEES

### On-chain (Intuition Protocol)
- **513+ atoms** : 395 sessions, 347 speakers, 23 tracks, predicates, event
- **1280+ triples** : 395 presented at, 502+ has tag, 384 speaking at
- **100 topic atoms** pour les votes (web3_topics_graph.json)
- **5 rating atoms** + 415 rating triples (session_ratings_graph.json)
- **78 side events** avec categories (side_events.json)

### Fichiers locaux
- `sessions.json` : **395 sessions** (317 EthCC + 78 side events) - OK
- `speakers.json` : **347 speakers** - OK
- `intuition_graph.json` : **2983 atoms**, 313 session mappings, 19 tracks - OK

### Mock (a remplacer)
- VIBES array (7 users fictifs) -> fallback, donnees reelles via `useVibeMatches` (branche)
- LEADERBOARD (10 users fictifs) -> fallback, donnees reelles via Blockscout API (branche)

---

## ARCHITECTURE

### Services

| Service | Status |
|---|---|
| `intuition.ts` | Done — MultiVault + Sofia Proxy |
| `embeddedWallet.ts` | Done — Password a chaque fois |
| `sessionNotifService.ts` | Done — Toast local + faux event test |
| `notificationService.ts` | Done — Notification API locale |
| `pushService.ts` | Done — VAPID/Web Push subscription |
| `leaderboardService.ts` | Done — Blockscout API |
| `ensService.ts` | Done — ENS text records |
| `voteService.ts` | Done — + fetchUserVotedTopics (GraphQL) |
| `portfolioService.ts` | Done — GraphQL positions |
| `trendingService.ts` | Done — GraphQL trending + events |
| `replayService.ts` | Done — Polling replays.json (en attente YouTube) |

### On-chain

| Composant | Adresse | Usage |
|---|---|---|
| MultiVault | `0x6E35cF57...` | Reads + approve + redeem |
| Sofia Fee Proxy | `0x26F81d72...` | Writes (createAtoms, createTriples, deposit, depositBatch) |

### Push Notifications

| Fichier | Role |
|---|---|
| `public/push-sw.js` | SW push event handler (importe via Workbox importScripts) |
| `src/services/pushService.ts` | Subscription management (subscribe, unsubscribe, store) |
| `scripts/send-push.mjs` | CLI pour envoyer des push (`node send-push.mjs <sub> "title" "body"`) |

VAPID Public Key: `BPGIM7JwUADTHBw3uY_3uE6Mg3O9p3hcvgKDr-cKSRhHnSvS18QNMu7RloqoIqzPmofRwl0mc4EXv3I4F4lyitw`

### Seeding tools
- `Triples/seed.html` — original (83 sessions, MultiVault direct)
- `Triples/seed_new.html` — 310 sessions + side events via Sofia Proxy
- `Triples/seed_final32.html` — 32 derniers speaking at
- `seed_new_data.mjs` — CLI alternative (Node.js)
