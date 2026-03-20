import { describe, it, expect } from "vitest";
import { sessions, tracks, speakers, ratingsGraph, dates, trackNames } from "../data";

describe("Data layer", () => {
  describe("sessions", () => {
    it("should have 395 sessions (317 EthCC + 78 side events)", () => {
      expect(sessions.length).toBe(395);
    });

    it("should have required fields on each session", () => {
      for (const s of sessions) {
        expect(s.id).toBeTruthy();
        expect(s.title).toBeTruthy();
        expect(s.date).toBeTruthy();
        expect(s.track).toBeTruthy();
        expect(s.type).toBeTruthy();
      }
    });

    it("should have startTime on EthCC sessions", () => {
      const ethccSessions = sessions.filter((s) => s.type !== "Side Event");
      for (const s of ethccSessions) {
        expect(s.startTime).toBeTruthy();
      }
    });

    it("should have valid session types", () => {
      const validTypes = new Set(["Talk", "Workshop", "Demo", "Side Event"]);
      for (const s of sessions) {
        expect(validTypes.has(s.type)).toBe(true);
      }
    });

    it("should span 4 conference days", () => {
      expect(dates).toContain("2026-03-30");
      expect(dates).toContain("2026-03-31");
      expect(dates).toContain("2026-04-01");
      expect(dates).toContain("2026-04-02");
    });
  });

  describe("tracks", () => {
    it("should have 23 tracks (19 EthCC + 4 side event)", () => {
      expect(tracks.length).toBe(23);
    });

    it("should have trackNames sorted", () => {
      const sorted = [...trackNames].sort();
      expect(trackNames).toEqual(sorted);
    });

    it("should include side event tracks", () => {
      expect(trackNames).toContain("Sport & Wellness");
      expect(trackNames).toContain("Networking & Social");
      expect(trackNames).toContain("Investor & Fundraising");
      expect(trackNames).toContain("Builders & Hackathons");
    });

    it("should include new EthCC tracks", () => {
      expect(trackNames).toContain("TERSE");
      expect(trackNames).toContain("Regulation & Compliance");
    });

    it("every track should have at least 1 session", () => {
      for (const track of trackNames) {
        const count = sessions.filter((s) => s.track === track).length;
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  describe("speakers", () => {
    it("should have 347 speakers", () => {
      expect(speakers.length).toBe(347);
    });

    it("should have slug and name", () => {
      for (const sp of speakers) {
        expect(sp.slug).toBeTruthy();
        expect(sp.name).toBeTruthy();
      }
    });
  });

  describe("dates", () => {
    it("should have multiple dates", () => {
      expect(dates.length).toBeGreaterThan(0);
    });

    it("should be sorted", () => {
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
    });
  });

  describe("ratingsGraph", () => {
    it("should have 5 rating atoms", () => {
      const keys = Object.keys(ratingsGraph.ratingAtoms);
      expect(keys).toEqual(["1", "2", "3", "4", "5"]);
    });

    it("should have valid atom IDs (bytes32)", () => {
      for (const atomId of Object.values(ratingsGraph.ratingAtoms)) {
        expect(atomId).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it("should have hasTagPredicate", () => {
      expect(ratingsGraph.hasTagPredicate).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it("should have 83 sessions in sessionRatingTriples", () => {
      const sessionCount = Object.keys(ratingsGraph.sessionRatingTriples).length;
      expect(sessionCount).toBe(83);
    });

    it("should have 5 ratings per session", () => {
      for (const [, ratings] of Object.entries(ratingsGraph.sessionRatingTriples)) {
        const ratingKeys = Object.keys(ratings);
        expect(ratingKeys).toEqual(["1", "2", "3", "4", "5"]);
        for (const r of Object.values(ratings)) {
          expect(r.subjectId).toMatch(/^0x[a-fA-F0-9]{64}$/);
          expect(r.predicateId).toBe(ratingsGraph.hasTagPredicate);
          expect(r.objectId).toMatch(/^0x[a-fA-F0-9]{64}$/);
        }
      }
    });
  });
});
