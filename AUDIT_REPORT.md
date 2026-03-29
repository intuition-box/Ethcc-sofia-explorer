# Audit Complet du Repository - EthCC Sofia Explorer

**Date:** 29 Mars 2026
**Audit demandé par:** User
**Problème initial:** "Quand je clique sur une session je ne vois pas à l'intérieur qui a participé"

---

## 🔴 ERREURS CRITIQUES

### 1. **SessionDetailPage: Données de participants ignorées** ⚠️ BLOQUE FEATURE

**Fichier:** [web/src/pages/SessionDetailPage.tsx:551-572](web/src/pages/SessionDetailPage.tsx#L551-L572)

**Problème:**
- La query GraphQL `GET_SESSION_ATTENDEES` **retourne les données complètes des participants** (subject.term_id + subject.label)
- Le code n'utilise QUE `triples.length` pour afficher le COUNT
- Les données `subject { term_id, label }` sont **ignorées complètement**

**Code actuel:**
```typescript
gql.request<GetSessionAttendeesQuery>(GET_SESSION_ATTENDEES, {
  predicateId: PREDICATES["attending"],
  sessionAtomId,
}).then((data) => {
  const triples = data.triples ?? [];
  setAttendeeCount(triples.length);  // ❌ Utilise UNIQUEMENT length
  // Build cumulative chart: each triple created_at adds 1 attendee
  const chart: number[] = [];
  triples.forEach((_, i) => chart.push(i + 1));  // ❌ Ignore subject data
  setAttendeeChart(chart);
}).catch(() => {}).finally(() => setAttendeeLoading(false));
```

**Données disponibles mais non utilisées:**
```typescript
// Ce qui est retourné par GraphQL:
triples[0].subject.term_id   // "0xAddress123..."
triples[0].subject.label      // "vitalik.eth" ou "0xAddress..."
triples[0].created_at         // Timestamp
triples[0].term.vaults        // Vault data (shares, assets)
```

**Impact utilisateur:**
- ✅ L'utilisateur voit "42 attending"
- ❌ L'utilisateur NE VOIT PAS qui sont ces 42 personnes
- ❌ Aucune liste cliquable de participants
- ❌ Aucun lien vers les profils des participants

**Sévérité:** 🔴 **CRITIQUE** - Feature complètement cassée

---

### 2. **useFollow: Dépendances incorrectes** ⚠️ BUGS ÉTAT

**Fichier:** [web/src/hooks/useFollow.ts:51](web/src/hooks/useFollow.ts#L51)

**Problème 1 - useEffect:**
```typescript
useEffect(() => {
  const addr = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
  if (!addr) return;
  fetchFollowing(addr)...
}, []);  // ❌ Devrait dépendre de wallet address
```

**Impact:** Si l'utilisateur reconnecte avec un autre wallet, les follows ne se rechargent pas.

**Problème 2 - useCallback:**
```typescript
const follow = useCallback((targetLabel: string) => {
  if (isFollowingUser(targetLabel)) return;  // ❌ isFollowingUser appelé mais pas stable
  ...
}, [pendingFollows, isFollowingUser, addToCart]);
```

**Impact:** État inconsistant du bouton "Follow", peut causer des re-renders excessifs.

**Sévérité:** 🔴 **CRITIQUE** - Affecte feature utilisateur

---

### 3. **useInterestCounts & useVibeMatches: GraphQL Injection** ⚠️ SÉCURITÉ

**Fichiers:**
- [web/src/hooks/useInterestCounts.ts:20-27](web/src/hooks/useInterestCounts.ts#L20-L27)
- [web/src/hooks/useVibeMatches.ts:71,82](web/src/hooks/useVibeMatches.ts#L71)

**Problème:**
```typescript
const query = `{
  ${trackIds.map((id, i) => `
    p${i}: positions_aggregate(where: {
      atom: { term_id: { _eq: "${id}" } }  // ❌ String interpolation - unsafe!
```

**Impact:** Vulnérable aux injections GraphQL si `TRACK_ATOM_IDS` contient des caractères spéciaux.

**Sévérité:** 🔴 **CRITIQUE** - Faille de sécurité

---

### 4. **useOnboardingWallet: Circular Dependencies** ⚠️ MEMORY LEAK

**Fichier:** [web/src/hooks/useOnboardingWallet.ts:65-70](web/src/hooks/useOnboardingWallet.ts#L65-L70)

**Problème:**
```typescript
useEffect(() => {
  if (!embeddedWallet) return;
  refreshEmbeddedBalance();
  const interval = setInterval(refreshEmbeddedBalance, 10000);
  return () => clearInterval(interval);
}, [embeddedWallet, refreshEmbeddedBalance]);
// ❌ refreshEmbeddedBalance dépend de embeddedWallet → circular
```

**Impact:** Le polling se relance inutilement, peut afficher des balances incorrectes.

**Sévérité:** 🔴 **CRITIQUE** - Affecte l'onboarding

---

### 5. **useSendTransaction: Ref instable** ⚠️ PERFORMANCE

**Fichier:** [web/src/hooks/useSendTransaction.ts:72](web/src/hooks/useSendTransaction.ts#L72)

**Problème:**
```typescript
const send = useCallback(async (recipient: string, amount: string) => {
  ...
}, [embeddedCtx.wallet]);  // ❌ embeddedCtx.wallet peut changer à chaque render
```

**Impact:** Callback recréé à chaque render si Context n'est pas memoized.

**Sévérité:** 🔴 **CRITIQUE** - Peut causer lags

---

### 6. **useVibeMatches: eslint-disable sans raison** ⚠️ CODE SMELL

**Fichier:** [web/src/hooks/useVibeMatches.ts:180-187](web/src/hooks/useVibeMatches.ts#L180-L187)

**Problème:**
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  [...topics].sort().join(","),  // ❌ Workaround manuel au lieu de vraies deps
  sessionIds.sort().join(","),
  (votedTopicIds ?? []).sort().join(","),
  walletAddress,
  refreshKey,
]);
```

**Impact:** Peut causer des memory leaks et stale data.

**Sévérité:** 🔴 **CRITIQUE** - Désactive les warnings React importants

---

## 🟡 ERREURS MOYENNES

### 7. **useWalletConnection: buildingRef pas reset en cas d'erreur**

**Fichier:** [web/src/hooks/useWalletConnection.ts:48](web/src/hooks/useWalletConnection.ts#L48)

**Problème:** Si erreur dans async, `buildingRef.current` n'est pas forcément reset.

**Fix nécessaire:** Ajouter `buildingRef.current = false` dans le catch block.

**Sévérité:** 🟡 MOYEN

---

### 8. **useVoteLogic: Sync unidirectionnelle**

**Fichier:** [web/src/hooks/useVoteLogic.ts:46-54](web/src/hooks/useVoteLogic.ts#L46-L54)

**Problème:** L'effet sync ne gère QUE les suppressions, pas les ajouts au cart.

**Sévérité:** 🟡 MOYEN

---

### 9. **useOnboardingPublish: Dynamic import dans callback**

**Fichier:** [web/src/hooks/useOnboardingPublish.ts:47-48](web/src/hooks/useOnboardingPublish.ts#L47-L48)

**Problème:**
```typescript
const { TRACK_ATOM_IDS: trackMap, depositOnAtoms } = await import("../services/intuition");
```

**Impact:** Import overhead à chaque publish, peut échouer.

**Sévérité:** 🟡 MOYEN

---

### 10. **useCart: Listeners accumulés**

**Fichier:** [web/src/hooks/useCart.ts:22](web/src/hooks/useCart.ts#L22)

**Problème:**
```typescript
let cartState = StorageService.loadCart();
const listeners = new Set<() => void>();  // ❌ Pas de cleanup
```

**Impact:** Memory leak si composants mount/unmount beaucoup.

**Sévérité:** 🟡 MOYEN

---

## 🟢 ERREURS MINEURES

### 11. **useSessionFilter: Pas de memoization**
**Fichier:** [web/src/hooks/useSessionFilter.ts:34-38](web/src/hooks/useSessionFilter.ts#L34-L38)
**Impact:** Performance dégradée.
**Sévérité:** 🟢 FAIBLE

### 12. **useEnsProfile: Pas de timeout**
**Fichier:** [web/src/hooks/useEnsProfile.ts:21-30](web/src/hooks/useEnsProfile.ts#L21-L30)
**Impact:** UI lente si ENS service hang.
**Sévérité:** 🟢 FAIBLE

### 13. **usePullToRefresh: Nested scroll non géré**
**Fichier:** [web/src/hooks/usePullToRefresh.ts:14-28](web/src/hooks/usePullToRefresh.ts#L14-L28)
**Impact:** Feature peut ne pas marcher avec nested scrollables.
**Sévérité:** 🟢 FAIBLE

### 14. **useCartPublish: Pas de rollback**
**Fichier:** [web/src/hooks/useCartPublish.ts:40-104](web/src/hooks/useCartPublish.ts#L40-L104)
**Impact:** Si step 3 fail, steps 1-2 sont déjà published.
**Sévérité:** 🟢 FAIBLE

### 15. **usePwaInstall: Pas de re-prompt**
**Fichier:** [web/src/hooks/usePwaInstall.ts:38-48](web/src/hooks/usePwaInstall.ts#L38-L48)
**Impact:** Impossible de re-show prompt sans reload.
**Sévérité:** 🟢 FAIBLE

---

## 📊 QUERIES GRAPHQL NON UTILISÉES

### Queries générées mais inutilisées (70% d'inutilisation)

| Query | Statut | Raison |
|-------|--------|--------|
| **GetAtom** | ❌ UNUSED | Jamais importée |
| **SearchAtoms** | ❌ UNUSED | Jamais importée |
| **GetPositionsAggregate** | ❌ UNUSED | Exportée comme `GET_POSITIONS_COUNT` mais jamais utilisée |
| **GetAllSessionAttendees** | ❌ UNUSED | Version batch, seule GetSessionAttendees utilisée |
| **GetTriplesByPredicate** | ❌ UNUSED | Jamais importée |
| **GetTripleVoters** | ❌ UNUSED | Jamais importée |
| **GetTrendingTriples** | ❌ UNUSED | Jamais importée |

**Queries utilisées (30%):**
- ✅ **GetAccountPositions** → profileSync.ts
- ✅ **GetUserVotedPositions** → voteService.ts
- ✅ **GetSessionAttendees** → SessionDetailPage.tsx

---

## 🚫 FEATURES MANQUANTES (TODO commentés)

### 1. **On-Chain Ratings Display**

**Fichier:** [web/src/pages/SessionDetailPage.tsx:773-774](web/src/pages/SessionDetailPage.tsx#L773-L774)

**Code:**
```typescript
{/* TODO: Show other people's ratings from on-chain data */}
{/* When on-chain ratings are available, display rating distribution here */}
```

**Ce qui manque:**
- Query GraphQL pour fetch ratings
- Histogramme de distribution
- Average rating
- Rating count

**Impact:** Feature prévue mais jamais implémentée.

---

### 2. **Participant List Component**

**Manque:**
- Composant UI pour afficher liste de participants
- Liens vers profils individuels
- Filtrage/search de participants
- Affichage des avatars/nicknames

**Impact:** Données fetched mais jamais rendues.

---

### 3. **useSessionAttendees Hook**

**Manque:** Hook abstrait pour fetch attendees (actuellement inline dans SessionDetailPage).

**Devrait être comme:** `useVibeMatches` qui est bien abstrait.

---

## 📁 ARCHITECTURE: PATTERNS INCONSISTANTS

### Pattern 1: GraphQL direct dans composants

**Mauvais exemple (SessionDetailPage.tsx:560):**
```typescript
const gql = new GraphQLClient({ endpoint: GQL_URL });
gql.request<GetSessionAttendeesQuery>(GET_SESSION_ATTENDEES, {
  predicateId: PREDICATES["attending"],
  sessionAtomId,
}).then(...)
```

**Bon exemple (useVibeMatches.ts):**
```typescript
export function useVibeMatches(topics, sessionIds) {
  // Hook abstrait avec GraphQLClient interne
  // Gère polling, erreurs, cache
  return { matches, loading, error }
}
```

**Recommandation:** Créer `useSessionAttendees()` hook.

---

### Pattern 2: Predicate IDs hardcodés

**Fichiers affectés:**
- SessionDetailPage.tsx:562
- VibeProfilePage.tsx:155
- useVibeMatches.ts:92

**Problème:** `PREDICATES["attending"]` répété partout.

**Recommandation:** Centraliser dans service ou custom hook.

---

### Pattern 3: Queries inline non type-safe

**Fichiers:**
- trendingService.ts (3 queries inline)
- useInterestCounts.ts (query aliasée construite manuellement)
- useVibeMatches.ts (2 queries inline)
- VibeProfilePage.tsx (1 query inline)

**Problème:** Pas de TypeScript types, `client.request<any>()`.

**Recommandation:** Migrer vers codegen queries.

---

## 🏗️ BUILD STATUS

✅ **Build réussit sans erreurs TypeScript** (vérifié le 29 mars 2026)

**Warnings Vite:**
- Dynamic imports mixés avec static imports (3 warnings)
- Chunks > 500KB (conseil d'optimisation)

**Pas d'erreurs bloquantes dans build.**

---

## 📋 RÉSUMÉ PRIORISÉ

### 🔴 À FIXER IMMÉDIATEMENT (BLOQUE USERS)

1. **SessionDetailPage: Afficher la liste des participants** (Erreur #1)
   - Créer composant `ParticipantList`
   - Utiliser `triples[].subject.label` et `term_id`
   - Liens vers VibeProfilePage

2. **useFollow: Fixer dépendances** (Erreur #2)
   - Corriger useEffect deps
   - Corriger useCallback deps

3. **GraphQL injection: Sanitiser queries** (Erreur #3)
   - useInterestCounts
   - useVibeMatches

4. **useOnboardingWallet: Fixer circular deps** (Erreur #4)

5. **useSendTransaction: Stabiliser wallet ref** (Erreur #5)

6. **useVibeMatches: Enlever eslint-disable** (Erreur #6)

---

### 🟡 À FIXER CETTE SEMAINE (BUGS MOYENS)

7. useWalletConnection error handling
8. useVoteLogic sync bidirectionnelle
9. useOnboardingPublish dynamic import
10. useCart listeners cleanup

---

### 🟢 BACKLOG (AMÉLIORATION QUALITÉ)

11-15. Memoization, timeouts, nested scroll, rollback, re-prompt

---

### 🧹 NETTOYAGE CODE

- **Supprimer queries GraphQL inutilisées** (7 queries, 70% unused)
- **Migrer queries inline vers codegen** (7 queries à migrer)
- **Créer hook useSessionAttendees** (abstraction manquante)
- **Implémenter TODO on-chain ratings** (feature prévue)

---

## 🎯 RÉPONSE À LA QUESTION INITIALE

**Question:** "Quand je clique sur une session je ne vois pas à l'intérieur qui a participé"

**Réponse:** Les données sont **fetchées depuis GraphQL** mais **jamais affichées dans l'UI**.

**Fichier:** [SessionDetailPage.tsx:551-572](web/src/pages/SessionDetailPage.tsx#L551-L572)

**Ce qui est actuellement affiché:**
- ✅ Nombre de participants (count)
- ✅ Graphique d'intérêt cumulatif (chart)

**Ce qui manque dans l'UI:**
- ❌ Liste des participants
- ❌ Noms/pseudos des participants
- ❌ Liens vers leurs profils
- ❌ Avatars/identicons

**Données disponibles dans `data.triples` mais ignorées:**
```typescript
triples[0].subject.term_id   // Wallet address
triples[0].subject.label      // Nickname ou address
triples[0].created_at         // Timestamp
```

---

## 📊 STATISTIQUES FINALES

- **Hooks audités:** 15
- **Erreurs critiques:** 6
- **Erreurs moyennes:** 4
- **Erreurs mineures:** 5
- **Queries inutilisées:** 7 (70%)
- **Features cassées:** 1 (participant display)
- **TODOs non implémentés:** 1 (on-chain ratings)
- **Build status:** ✅ PASSE

---

**Généré par:** Claude Code Audit
**Date:** 29 Mars 2026
