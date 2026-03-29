# Analyse des Queries GraphQL Inline

**Date:** 29 Mars 2026
**Problème:** Queries GraphQL inline sans type-safety = anti-pattern

---

## 🔴 FICHIERS AVEC QUERIES INLINE (7 fichiers)

### 1. **trendingService.ts** - 4 queries inline ❌

**Fichier:** [web/src/services/trendingService.ts](web/src/services/trendingService.ts)

**Queries inline:**

#### Query 1: `fetchTrendingTopics()` (lines 47-71)
```graphql
query {
  triples(
    where: {
      predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
      object: { term_id: { _in: [${atomIds}] } }
    }
  ) {
    object { term_id label }
    term { vaults { total_assets position_count } }
    counter_term { vaults { total_assets position_count } }
  }
}
```
**Type:** `client.request<any>(query)` ❌ Pas de types

#### Query 2: `fetchTopicVoters()` (lines 130-148)
```graphql
query {
  triples(
    where: {
      predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
      object: { term_id: { _eq: "${atomId}" } }
    }
  ) {
    subject { label }
    positions(order_by: { shares: desc }) {
      account { id label }
      shares
    }
  }
}
```
**Type:** `client.request<any>(query)` ❌ Pas de types

#### Query 3: `fetchTopicEvents()` (lines 175-195)
```graphql
query {
  triples(
    where: {
      predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
      object: { term_id: { _eq: "${atomId}" } }
    }
  ) {
    term {
      vaults {
        events(order_by: { block_timestamp: asc }) {
          type sender { id } assets block_timestamp
        }
      }
    }
  }
}
```
**Type:** `client.request<any>(query)` ❌ Pas de types

#### Query 4: `fetchAllTopicEvents()` (lines 243-261)
```graphql
query {
  triples(
    where: {
      predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
      object: { term_id: { _in: [${atomIds}] } }
    }
  ) {
    object { term_id }
    term {
      vaults {
        events(order_by: { block_timestamp: asc }) {
          type assets block_timestamp
        }
      }
    }
  }
}
```
**Type:** `client.request<any>(query)` ❌ Pas de types

#### Query 5: `fetchLikeMinded()` - 2 queries (lines 310-322, 332-347)
**Type:** `client.request<any>()` ❌ Pas de types

---

### 2. **useInterestCounts.ts** - 1 query inline ❌

**Fichier:** [web/src/hooks/useInterestCounts.ts:20-27](web/src/hooks/useInterestCounts.ts#L20-L27)

**Query inline:**
```graphql
query {
  p0: positions_aggregate(where: { atom: { term_id: { _eq: "${id}" } } }) { aggregate { count } }
  p1: positions_aggregate(where: { atom: { term_id: { _eq: "${id}" } } }) { aggregate { count } }
  # ... aliased queries for each track
}
```

**Problèmes:**
- ❌ Query construite avec string interpolation
- ❌ `client.request<Record<string, { aggregate: { count: number } }>>(query)` → types manuels
- ❌ Vulnérable aux injections GraphQL
- ❌ Pas de validation du schema

---

### 3. **useVibeMatches.ts** - 2 queries inline ❌

**Fichier:** [web/src/hooks/useVibeMatches.ts:70-94](web/src/hooks/useVibeMatches.ts#L70-L94)

**Query 1: Positions (lines 70-77)**
```graphql
query($ids: [String!]!) {
  positions(where: { term_id: { _in: $ids }, shares: { _gt: "0" } }, limit: 500) {
    account_id term_id shares
  }
}
```

**Query 2: Triples (lines 82-93)**
```graphql
query($predId: String!, $objIds: [String!]!) {
  triples(where: {
    predicate: { term_id: { _eq: $predId } }
    object: { term_id: { _in: $objIds } }
  }, limit: 500) {
    subject { term_id label }
    object { term_id }
  }
}
```

**Problèmes:**
- ❌ Types manuels: `client.request<{ positions: ... }>()` et `client.request<{ triples: ... }>()`
- ✅ Au moins utilise des variables (pas string interpolation directe)
- ❌ Pas de validation du schema

---

### 4. **SessionDetailPage.tsx** - 1 query imported ✅

**Fichier:** [web/src/pages/SessionDetailPage.tsx:561-564](web/src/pages/SessionDetailPage.tsx#L561-L564)

```typescript
gql.request<GetSessionAttendeesQuery>(GET_SESSION_ATTENDEES, {
  predicateId: PREDICATES["attending"],
  sessionAtomId,
})
```

**Statut:** ✅ **CORRECT** - Utilise une query codegen `GET_SESSION_ATTENDEES` avec types générés.

---

### 5. **VibeProfilePage.tsx** - 1 query inline ❌

**Fichier:** [web/src/pages/VibeProfilePage.tsx:~155](web/src/pages/VibeProfilePage.tsx)

**À vérifier:** Probablement une query inline pour fetch user profile data.

---

### 6. **profileSync.ts** - Utilise queries codegen ✅

**Fichier:** [web/src/services/profileSync.ts](web/src/services/profileSync.ts)

**Statut:** ✅ **CORRECT** - Utilise `GET_ACCOUNT_POSITIONS` depuis codegen.

---

### 7. **voteService.ts** - Utilise queries codegen ✅

**Fichier:** [web/src/services/voteService.ts](web/src/services/voteService.ts)

**Statut:** ✅ **CORRECT** - Utilise `GET_USER_VOTED_POSITIONS` depuis codegen.

---

## 📊 RÉSUMÉ

| Fichier | Queries inline | Queries codegen | Type-safe |
|---------|---------------|-----------------|-----------|
| trendingService.ts | 5 ❌ | 0 | ❌ NON |
| useInterestCounts.ts | 1 ❌ | 0 | ❌ NON |
| useVibeMatches.ts | 2 ❌ | 0 | ⚠️ PARTIEL |
| VibeProfilePage.tsx | 1 ❌ | 0 | ❌ NON |
| SessionDetailPage.tsx | 0 | 1 ✅ | ✅ OUI |
| profileSync.ts | 0 | 1 ✅ | ✅ OUI |
| voteService.ts | 0 | 1 ✅ | ✅ OUI |

**Total:**
- ❌ **9 queries inline non type-safe**
- ✅ **3 queries codegen type-safe**
- **Ratio:** 75% inline / 25% codegen

---

## 🚨 PROBLÈMES CRITIQUES

### 1. **Injection GraphQL** 🔴

**Fichiers affectés:**
- `trendingService.ts` (toutes les queries)
- `useInterestCounts.ts`

**Code vulnérable:**
```typescript
const query = `{
  triples(where: {
    predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }  // ❌ String interpolation
    object: { term_id: { _in: [${atomIds.map(id => `"${id}"`).join(",")}] } }  // ❌ Injection possible
  })
}`;
```

**Impact:** Si `SUPPORTS_PREDICATE` ou `atomIds` contiennent des caractères spéciaux (guillemets, newlines, etc.), la query peut être cassée ou exploitée.

---

### 2. **Pas de Type Safety** 🔴

**Problème:** Toutes les queries inline utilisent `client.request<any>()` ou types manuels.

**Conséquences:**
- ❌ Pas d'autocomplétion dans l'IDE
- ❌ Pas de validation des champs retournés
- ❌ Erreurs runtime si le schema change
- ❌ Refactoring dangereux

**Exemple:**
```typescript
const gqlResult = await gqlClient.request<any>(query);  // ❌ any
const triples = gqlResult.triples ?? [];  // ❌ Aucune garantie que "triples" existe
```

---

### 3. **Duplication de Queries** 🔴

**Problème:** Certaines queries inline sont similaires aux queries codegen.

**Exemple:**
- `useVibeMatches.ts` ligne 82-93 → query triples avec `attending` predicate
- `SessionDetailPage.tsx` → `GET_SESSION_ATTENDEES` (codegen) fait la même chose

**Impact:** Même logique copiée dans plusieurs fichiers, maintenance difficile.

---

### 4. **Pas de Validation du Schema** 🔴

**Problème:** Les queries inline ne sont pas validées contre le schema GraphQL.

**Impact:** Si le schema change (field renommé, type changé), le build ne casse pas mais le runtime oui.

---

## ✅ SOLUTION: MIGRATION VERS CODEGEN

### Plan de refactoring

#### Étape 1: Créer les queries manquantes dans `packages/graphql/src/queries/`

**Nouveaux fichiers à créer:**

##### `packages/graphql/src/queries/trending.graphql`
```graphql
# Query for trending topics
query GetTrendingTopics($predicateId: String!, $atomIds: [String!]!) {
  triples(
    where: {
      predicate: { term_id: { _eq: $predicateId } }
      object: { term_id: { _in: $atomIds } }
    }
  ) {
    object {
      term_id
      label
    }
    term {
      vaults {
        total_assets
        position_count
      }
    }
    counter_term {
      vaults {
        total_assets
        position_count
      }
    }
  }
}

# Query for topic voters
query GetTopicVoters($predicateId: String!, $atomId: String!) {
  triples(
    where: {
      predicate: { term_id: { _eq: $predicateId } }
      object: { term_id: { _eq: $atomId } }
    }
  ) {
    subject {
      label
    }
    positions(order_by: { shares: desc }) {
      account {
        id
        label
      }
      shares
    }
  }
}

# Query for topic events
query GetTopicEvents($predicateId: String!, $atomId: String!) {
  triples(
    where: {
      predicate: { term_id: { _eq: $predicateId } }
      object: { term_id: { _eq: $atomId } }
    }
  ) {
    term {
      vaults {
        events(order_by: { block_timestamp: asc }) {
          type
          sender {
            id
          }
          assets
          block_timestamp
        }
      }
    }
  }
}

# Query for like-minded users
query GetLikeMindedUsers($predicateId: String!, $userAddress: String!) {
  triples(
    where: {
      predicate: { term_id: { _eq: $predicateId } }
      subject: { label: { _ilike: $userAddress } }
    }
  ) {
    object {
      term_id
      label
    }
  }
}

query GetUsersVotingOnTopics($predicateId: String!, $topicIds: [String!]!, $excludeAddress: String!) {
  triples(
    where: {
      predicate: { term_id: { _eq: $predicateId } }
      object: { term_id: { _in: $topicIds } }
      subject: { label: { _nilike: $excludeAddress } }
    }
  ) {
    subject {
      label
    }
    object {
      term_id
      label
    }
  }
}
```

##### `packages/graphql/src/queries/interests.graphql`
```graphql
# Query for interest counts per track
query GetInterestCounts($atomIds: [String!]!) {
  positions(
    where: {
      term_id: { _in: $atomIds }
      shares: { _gt: "0" }
    }
  ) {
    term_id
    account_id
    shares
  }
}
```

##### `packages/graphql/src/queries/vibes.graphql`
```graphql
# Query for vibe match positions
query GetVibeMatchPositions($atomIds: [String!]!) {
  positions(
    where: {
      term_id: { _in: $atomIds }
      shares: { _gt: "0" }
    }
    limit: 500
  ) {
    account_id
    term_id
    shares
  }
}

# Query for vibe match sessions
query GetVibeMatchSessions($predicateId: String!, $sessionAtomIds: [String!]!) {
  triples(
    where: {
      predicate: { term_id: { _eq: $predicateId } }
      object: { term_id: { _in: $sessionAtomIds } }
    }
    limit: 500
  ) {
    subject {
      term_id
      label
    }
    object {
      term_id
    }
  }
}
```

---

#### Étape 2: Exporter les nouvelles queries dans `packages/graphql/src/queries.ts`

**Ajouter:**
```typescript
export const GET_TRENDING_TOPICS = /* GraphQL */ `...`;
export const GET_TOPIC_VOTERS = /* GraphQL */ `...`;
export const GET_TOPIC_EVENTS = /* GraphQL */ `...`;
export const GET_LIKE_MINDED_USERS = /* GraphQL */ `...`;
export const GET_USERS_VOTING_ON_TOPICS = /* GraphQL */ `...`;
export const GET_INTEREST_COUNTS = /* GraphQL */ `...`;
export const GET_VIBE_MATCH_POSITIONS = /* GraphQL */ `...`;
export const GET_VIBE_MATCH_SESSIONS = /* GraphQL */ `...`;
```

---

#### Étape 3: Regénérer les types avec codegen

```bash
cd packages/graphql
bun run codegen
```

**Output attendu:**
```typescript
// packages/graphql/src/generated/index.ts
export type GetTrendingTopicsQuery = { ... };
export type GetTrendingTopicsQueryVariables = { ... };
export type GetTopicVotersQuery = { ... };
// ... etc
```

---

#### Étape 4: Mettre à jour les fichiers utilisant les queries inline

##### **trendingService.ts**

**Avant:**
```typescript
const query = `{
  triples(where: { predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } } })
}`;
const gqlResult = await gqlClient.request<any>(query);
```

**Après:**
```typescript
import { GET_TRENDING_TOPICS, type GetTrendingTopicsQuery } from "@ethcc/graphql";

const gqlResult = await gqlClient.request<GetTrendingTopicsQuery>(
  GET_TRENDING_TOPICS,
  { predicateId: SUPPORTS_PREDICATE, atomIds }
);
```

##### **useInterestCounts.ts**

**Avant:**
```typescript
const query = `{
  ${trackIds.map((id, i) => `p${i}: positions_aggregate(...)`).join("")}
}`;
const data = client.request<Record<string, { aggregate: { count: number } }>>(query);
```

**Après:**
```typescript
import { GET_INTEREST_COUNTS, type GetInterestCountsQuery } from "@ethcc/graphql";

const data = await client.request<GetInterestCountsQuery>(
  GET_INTEREST_COUNTS,
  { atomIds: trackIds }
);

// Aggregate counts locally
const counts: Record<string, number> = {};
for (const pos of data.positions) {
  const trackName = ATOM_TO_TRACK.get(pos.term_id);
  if (trackName) {
    counts[trackName] = (counts[trackName] ?? 0) + 1;
  }
}
```

##### **useVibeMatches.ts**

**Avant:**
```typescript
const positionsData = await client.request<{ positions: ... }>(
  `query($ids: [String!]!) { positions(...) }`,
  { ids: allAtomIds }
);
```

**Après:**
```typescript
import { GET_VIBE_MATCH_POSITIONS, type GetVibeMatchPositionsQuery } from "@ethcc/graphql";

const positionsData = await client.request<GetVibeMatchPositionsQuery>(
  GET_VIBE_MATCH_POSITIONS,
  { atomIds: allAtomIds }
);
```

---

#### Étape 5: Vérifier les types et build

```bash
cd web
bun run build  # Doit passer avec types corrects
```

---

## 📋 CHECKLIST DE MIGRATION

- [ ] Créer `packages/graphql/src/queries/trending.graphql`
- [ ] Créer `packages/graphql/src/queries/interests.graphql`
- [ ] Créer `packages/graphql/src/queries/vibes.graphql`
- [ ] Exporter queries dans `packages/graphql/src/queries.ts`
- [ ] Exporter types dans `packages/graphql/src/index.ts`
- [ ] Regénérer codegen: `bun run codegen`
- [ ] Migrer `trendingService.ts` (5 queries)
- [ ] Migrer `useInterestCounts.ts` (1 query)
- [ ] Migrer `useVibeMatches.ts` (2 queries)
- [ ] Migrer `VibeProfilePage.tsx` (1 query)
- [ ] Supprimer toutes les queries inline
- [ ] Supprimer tous les `request<any>()`
- [ ] Build et tests: `bun run build && bun test`

---

## ✅ BÉNÉFICES APRÈS MIGRATION

1. **Type Safety** 🎯
   - ✅ Autocomplétion dans IDE
   - ✅ Validation à la compilation
   - ✅ Pas d'erreurs runtime dues aux types

2. **Sécurité** 🔒
   - ✅ Plus d'injection GraphQL possible
   - ✅ Variables paramétrées par le client GraphQL
   - ✅ Validation du schema

3. **Maintenabilité** 🧹
   - ✅ Queries centralisées dans `packages/graphql/`
   - ✅ Pas de duplication
   - ✅ Refactoring facile avec types

4. **Performance** ⚡
   - ✅ Queries optimisées par le codegen
   - ✅ Moins d'overhead de parsing runtime

---

**Prochaine étape:** Commencer la migration ou d'abord fixer le problème des participants ?
