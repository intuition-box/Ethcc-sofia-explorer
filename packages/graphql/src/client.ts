/**
 * Lightweight GraphQL client — fetch-based, no dependencies.
 * Works in browser and Node.
 */

export interface GraphQLClientOptions {
  endpoint: string;
  headers?: Record<string, string>;
}

export class GraphQLClient {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(opts: GraphQLClientOptions) {
    this.endpoint = opts.endpoint;
    this.headers = {
      "Content-Type": "application/json",
      ...opts.headers,
    };
  }

  async request<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();

    if (json.errors?.length) {
      throw new Error(`GraphQL error: ${json.errors[0].message}`);
    }

    return json.data as T;
  }
}
