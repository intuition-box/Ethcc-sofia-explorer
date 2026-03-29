/**
 * Raw query strings for use with the GraphQLClient.
 * Each corresponds to a .graphql file and has matching types in generated/index.ts.
 */

export const GET_ACCOUNT_POSITIONS = /* GraphQL */ `
query GetAccountPositions($address: String!, $limit: Int!) {
  positions(
    where: { account_id: { _ilike: $address }, shares: { _gt: "0" } }
    limit: $limit
    order_by: { shares: desc }
  ) {
    shares
    vault {
      term_id
      current_share_price
      term {
        atom { term_id label type }
        triple {
          subject { term_id label }
          predicate { term_id label }
          object { term_id label }
        }
      }
    }
  }
}`;

export const GET_USER_VOTED_POSITIONS = /* GraphQL */ `
query GetUserVotedPositions($address: String!, $termIds: [String!]!) {
  positions(
    where: {
      account_id: { _ilike: $address }
      term_id: { _in: $termIds }
      shares: { _gt: "0" }
    }
  ) {
    term_id
  }
}`;

export const GET_POSITIONS_COUNT = /* GraphQL */ `
query GetPositionsCount($termId: String!) {
  positions_aggregate(
    where: { term_id: { _eq: $termId }, shares: { _gt: "0" } }
  ) {
    aggregate { count }
  }
}`;

export const GET_SESSION_ATTENDEES = /* GraphQL */ `
query GetSessionAttendees($predicateId: String!, $sessionAtomId: String!) {
  triples(
    where: {
      predicate: { term_id: { _eq: $predicateId } }
      object: { term_id: { _eq: $sessionAtomId } }
    }
    order_by: { created_at: asc }
  ) {
    term_id
    created_at
    subject { term_id label }
    term {
      vaults {
        position_count
        total_shares
        total_assets
      }
    }
  }
}`;

// ─── Trending Queries ─────────────────────────────────────

export const GET_TRENDING_TOPICS = /* GraphQL */ `
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
}`;

export const GET_TOPIC_VOTERS = /* GraphQL */ `
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
}`;

// Note: Event queries removed - schema doesn't support vaults.events field
// trendingService.ts will keep inline queries for events if needed

export const GET_USER_TOPICS = /* GraphQL */ `
query GetUserTopics($predicateId: String!, $userAddress: String!) {
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
}`;

export const GET_USERS_VOTING_ON_TOPICS = /* GraphQL */ `
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
}`;

// ─── Interest Queries ─────────────────────────────────────

export const GET_POSITIONS_BY_ATOMS = /* GraphQL */ `
query GetPositionsByAtoms($atomIds: [String!]!) {
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
}`;

// ─── Vibe Match Queries ───────────────────────────────────

export const GET_VIBE_MATCH_POSITIONS = /* GraphQL */ `
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
}`;

export const GET_VIBE_MATCH_SESSIONS = /* GraphQL */ `
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
}`;

export const GET_USER_ATTENDED_SESSIONS = /* GraphQL */ `
query GetUserAttendedSessions($predicateId: String!, $userAddress: String!) {
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
    created_at
  }
}`;
