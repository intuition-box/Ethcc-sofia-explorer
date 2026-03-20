import { describe, it, expect } from "vitest";
import { C, R, FONT, getTrackStyle, TRACK_COLORS, TYPE_COLORS } from "../config/theme";

describe("Theme", () => {
  describe("colors", () => {
    it("should have all required color tokens", () => {
      expect(C.background).toBeTruthy();
      expect(C.textPrimary).toBeTruthy();
      expect(C.flat).toBeTruthy();
      expect(C.success).toBeTruthy();
      expect(C.error).toBeTruthy();
    });

    it("should have hex color format", () => {
      expect(C.background).toMatch(/^#[a-fA-F0-9]{6}$/);
      expect(C.textPrimary).toMatch(/^#[a-fA-F0-9]{6}$/);
      expect(C.flat).toMatch(/^#[a-fA-F0-9]{6}$/);
    });
  });

  describe("radius", () => {
    it("should have increasing radius values", () => {
      expect(R.sm).toBeLessThan(R.md);
      expect(R.md).toBeLessThan(R.lg);
      expect(R.lg).toBeLessThan(R.xl);
    });
  });

  describe("FONT", () => {
    it("should be a valid font-family string", () => {
      expect(FONT).toBeTruthy();
      expect(FONT).toContain("sans-serif");
    });
  });

  describe("getTrackStyle", () => {
    it("should return style for known track", () => {
      const style = getTrackStyle("DeFi");
      expect(style.color).toBeTruthy();
      expect(style.icon).toBeTruthy();
    });

    it("should return fallback for unknown track", () => {
      const style = getTrackStyle("Unknown Track XYZ");
      expect(style.color).toBeTruthy();
      expect(style.icon).toBe("📌");
    });

    it("should have styles for all 23 tracks", () => {
      const allTracks = Object.keys(TRACK_COLORS);
      expect(allTracks.length).toBe(23);
      for (const track of allTracks) {
        const style = getTrackStyle(track);
        expect(style.icon).not.toBe("📌");
      }
    });
  });

  describe("TYPE_COLORS", () => {
    it("should have colors for Talk, Workshop, Demo", () => {
      expect(TYPE_COLORS.Talk).toBeTruthy();
      expect(TYPE_COLORS.Workshop).toBeTruthy();
      expect(TYPE_COLORS.Demo).toBeTruthy();
    });
  });
});
