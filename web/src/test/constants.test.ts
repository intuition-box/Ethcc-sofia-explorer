import { describe, it, expect } from "vitest";
import { STORAGE_KEYS, CHAIN_CONFIG } from "../config/constants";

describe("STORAGE_KEYS", () => {
  it("should have 16 keys", () => {
    expect(Object.keys(STORAGE_KEYS).length).toBe(16);
  });

  it("should all start with ethcc-", () => {
    for (const value of Object.values(STORAGE_KEYS)) {
      expect(value).toMatch(/^ethcc-/);
    }
  });

  it("should have unique values", () => {
    const values = Object.values(STORAGE_KEYS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("should include all expected keys", () => {
    expect(STORAGE_KEYS.CART).toBe("ethcc-cart");
    expect(STORAGE_KEYS.WALLET_ADDRESS).toBe("ethcc-wallet-address");
    expect(STORAGE_KEYS.PUBLISHED_VOTES).toBe("ethcc-published-votes");
    expect(STORAGE_KEYS.EMBEDDED_WALLET).toBe("ethcc-embedded-wallet");
    expect(STORAGE_KEYS.ONBOARDED).toBe("ethcc-onboarded");
  });
});

describe("CHAIN_CONFIG", () => {
  it("should have chain ID 1155", () => {
    expect(CHAIN_CONFIG.CHAIN_ID).toBe(1155);
    expect(CHAIN_CONFIG.CHAIN_ID_HEX).toBe("0x483");
  });

  it("should have valid contract addresses", () => {
    expect(CHAIN_CONFIG.MULTIVAULT).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(CHAIN_CONFIG.SOFIA_PROXY).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should have TRUST as native currency", () => {
    expect(CHAIN_CONFIG.NATIVE_CURRENCY.symbol).toBe("TRUST");
    expect(CHAIN_CONFIG.NATIVE_CURRENCY.decimals).toBe(18);
  });
});
