# EthCC App - Next Steps

## BUGS (a corriger)

1. **HomePage `/vibes` route cassee** - "See all" navigue vers `/vibes` qui n'existe pas. Changer vers `/invite` ou supprimer.
2. **ProfilePage bouton Settings** - Pas de `onClick`, bouton mort.
3. **SendPage scan desactive** - Bouton scan QR disabled sans moyen de l'activer.
4. **BuyTrustPage** - Aucune vraie connexion wallet ni transaction (mock 2s timeout).
5. **CartPage cout** - Estimation simplifiee (0.1 TRUST/triple), devrait fetcher le vrai cout on-chain via `estimateFees()`.

## TODO (features manquantes)

1. **VotePage → on-chain voting** - Le bouton Support sauvegarde en localStorage mais ne cree PAS de triple on-chain. Brancher `submitVotes()` de `voteService.ts` quand l'utilisateur valide dans le cart.
2. **VotePage → portfolio** - `portfolioService.ts` (fetchUserPositions, fetchPortfolio, redeemPosition) existe mais n'est utilise nulle part. Integrer dans l'onglet "My Votes".
3. **ProfilePage → matches reels** - Le stat "Matches" affiche toujours "-". Utiliser `useVibeMatches` ou `fetchLikeMinded` pour calculer le vrai nombre.
4. **ProfilePage → plateformes** - Les toggles GitHub/Discord sont UI-only. Pas d'OAuth implemente.
5. **SendPage → QR scan + transfert** - Implementer l'acces camera + scan QR + envoi reel de $TRUST.
6. **BuyTrustPage → on-ramp** - Implementer un vrai achat de $TRUST (bridge, DEX, ou fiat on-ramp).
7. **CartPage → cout reel** - Appeler `estimateFees()` avant publication pour afficher le vrai cout.
8. **LeaderboardPage → donnees reelles** - Actuellement mock. Pourrait utiliser `fetchLikeMinded()` ou les positions de vault pour un vrai classement.

## INTEGRATION Intuition

| Composant | Status | Details |
|---|---|---|
| Onboarding wallet flow | DONE | connect → approve → ensureUserAtom → createProfileTriples |
| useVibeMatches | DONE | GraphQL query, utilise dans step 7 success |
| trendingService | DONE | Fetche les trending topics depuis GraphQL (avec fallback mock) |
| voteService.submitVotes | PRET | Code existe, pas branche dans l'UI |
| portfolioService | PRET | fetchUserPositions + fetchPortfolio + redeemPosition, pas branche |
| useInterestCounts | PRET | Compte les personnes interessees par topic, pas utilise dans les pages actuelles |

## UI / POLISH

1. **SpeakerPage** - Utilise des classes CSS (`.speaker-page`, etc.) au lieu du design system inline. Verifier que les styles sont charges correctement.
2. **ProfilePage stats** - Fond blanc sur les stats, verifier la coherence avec le design system.
3. **Liquid glass** - Amelioration CSS faite (blur + saturate + inset shadows). Tester sur mobile (Safari iOS).
4. **Onboarding images** - 350KB-1.3MB, pourraient etre optimisees en WebP pour un chargement plus rapide.

## DONNEES

### Reelles (pretes)
- 83 sessions, 278 speakers, 17 tracks (bdd/)
- 173 atoms, 239 triples on-chain (intuition_graph.json)
- 100 web3 topics, 20 categories (web3_topics.json)
- 32+ topic atom IDs on-chain (web3_topics_graph.json)

### Mock (a remplacer)
- VIBES array (7 users fictifs) → remplacer par `fetchLikeMinded()` ou vrai systeme de geolocalisation
- LEADERBOARD (10 users fictifs) → remplacer par donnees de positions on-chain
- PLATFORMS (GitHub, Discord) → implementer OAuth
- HomePage balance "0.048 $TRUST" → deja branche sur le vrai wallet si connecte
- BuyTrustPage prix "$0.42" → API prix reel

## ARCHITECTURE

### Proxy CORS
- Dev: Vite proxy `/api/graphql` → `https://mainnet.intuition.sh/v1/graphql`
- Prod: URL directe (CORS accepte depuis GitHub Pages)

### Atom "I" pattern
- Les votes utilisent l'atom partage "I" (`0x7ab197b...`) comme sujet
- Les utilisateurs sont identifies par leurs positions dans les vaults, pas par des atoms individuels
- Le profil (interests/attending) utilise bien un atom par wallet

### Cart partage
- `useSyncExternalStore` pour synchroniser le badge Nav5 en temps reel
- localStorage: `ethcc-cart` (sessions), `ethcc-topics` (interests), `ethcc-votes` (votes)
