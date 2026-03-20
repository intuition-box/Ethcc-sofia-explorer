import { describe, it, expect } from "vitest";
import { resolveTopicAtomIds, getTopicAtomId } from "../services/voteService";

describe("voteService", () => {
  describe("getTopicAtomId", () => {
    it("should return atom ID for known topic", () => {
      const id = getTopicAtomId("defi-aave");
      expect(id).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it("should return null for unknown topic", () => {
      expect(getTopicAtomId("nonexistent-topic")).toBeNull();
    });
  });

  describe("resolveTopicAtomIds", () => {
    it("should resolve known topics", () => {
      const { resolved, missing } = resolveTopicAtomIds(["defi-aave", "defi-amm"]);
      expect(resolved.length).toBe(2);
      expect(missing.length).toBe(0);
      expect(resolved[0].topicId).toBe("defi-aave");
      expect(resolved[0].atomId).toMatch(/^0x/);
    });

    it("should separate missing topics", () => {
      const { resolved, missing } = resolveTopicAtomIds(["defi-aave", "nonexistent"]);
      expect(resolved.length).toBe(1);
      expect(missing).toEqual(["nonexistent"]);
    });

    it("should handle empty array", () => {
      const { resolved, missing } = resolveTopicAtomIds([]);
      expect(resolved.length).toBe(0);
      expect(missing.length).toBe(0);
    });
  });
});
