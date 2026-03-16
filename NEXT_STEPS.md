# EthCC App - Next Steps

## BUGS (a corriger)

1. ~~**HomePage `/vibes` route cassee**~~ DONE - Redirige vers `/invite`
2. ~~**ProfilePage bouton Settings**~~ DONE - Navigue vers `/cart`
3. ~~**SendPage scan desactive**~~ DONE - Bouton actif quand montant > 0, label dynamique
4. ~~**BuyTrustPage**~~ DONE - Vraie connexion MetaMask + guidance bridge Intuition
5. ~~**CartPage cout**~~ DONE - Fetch `getTripleCost()` on-chain via read-only provider, fallback sur estimation

## TODO (features manquantes)

1. ~~**VotePage → Support = prendre position**~~ DONE - Clic Support connecte MetaMask + stake on-chain via `submitVotes()`. Fallback localStorage si tx echoue.
2. ~~**VotePage → portfolio cliquable**~~ DONE - Cards My Votes cliquables → navigent vers `/topic/:id` (nouvelle page TopicDetailPage avec description, trend, données on-chain).
3. ~~**ProfilePage → matches reels**~~ DONE
4. **ProfilePage → plateformes** - Les toggles GitHub/Discord sont UI-only. Pas d'OAuth implemente.
5. **SendPage → QR scan + transfert** - Implementer l'acces camera + scan QR + envoi reel de $TRUST.
6. **BuyTrustPage → on-ramp** - Implementer un vrai achat de $TRUST (bridge, DEX, ou fiat on-ramp).
7. **CartPage → cout reel** - Appeler `estimateFees()` avant publication pour afficher le vrai cout.
8. **LeaderboardPage → donnees reelles** - Actuellement mock. Pourrait utiliser `fetchLikeMinded()` ou les positions de vault pour un vrai classement.
9. ~~**Discover → votes contextuels**~~ DONE - Affiche "[Topic] is [Category]" avec boutons Support/Oppose.
10. ~~**Onboarding → margin top steps**~~ DONE - margin-top 16px ajoutee.
11. ~~**Agenda + Vote → titres lisibles sur header**~~ DONE - Cards avec fond opaque (rgba 85%) + backdrop-filter pour lisibilite sur le header colore.
12. ~~**Sessions → descriptions enrichies**~~ DONE - Session "VOPS / Partial Stateless nodes" enrichie (seule session avec description < 50 chars).
13. **Sessions → bouton Add to Cart** - Ajouter un bouton "Add to Cart" visible sur les cards de session.
14. ~~**Vibes → Connect = Follow on Sofia**~~ DONE - Bouton "Follow on Sofia" ouvre sofia.intuition.box/profile/{addr}.

## INTEGRATION Intuition

| Composant | Status | Details |
|---|---|---|
| Onboarding wallet flow | DONE | connect → approve → ensureUserAtom → createProfileTriples |
| useVibeMatches | DONE | GraphQL query, utilise dans step 7 success |
| trendingService | DONE | Fetche les trending topics depuis GraphQL (avec fallback mock) |
| voteService.submitVotes | DONE | Branche dans VotePage — clic Support declenche stake on-chain |
| portfolioService | PRET | fetchUserPositions + fetchPortfolio + redeemPosition, pas branche |
| useInterestCounts | PRET | Compte les personnes interessees par topic, pas utilise dans les pages actuelles (disponible pour VotePage/CartPage) |

## UI / POLISH

1. ~~**SpeakerPage**~~ DONE - Reecrite avec le design system inline (glassSurface, C.*, R.*). Plus de dependance aux classes CSS.
2. ~~**Onboarding images**~~ DONE - Converties en WebP. Economies: slide-interests 795K→112K, slide-vibes 1.4M→108K, ethcc_og 1.9M→180K.

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
