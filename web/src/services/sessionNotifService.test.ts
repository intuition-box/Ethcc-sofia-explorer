import { describe, it, expect, afterEach } from "vitest";
import { SessionNotificationService, createTestSession, startSessionNotifScheduler, getScheduledStatus } from "./sessionNotifService";

describe("SessionNotificationService", () => {
  describe("State Isolation - THE CRITICAL FIX", () => {
    it("should have isolated state between instances", () => {
      const service1 = new SessionNotificationService();
      const service2 = new SessionNotificationService();

      const testSession = createTestSession();

      service1.start([testSession], () => {});

      // CRITICAL: service2 should NOT be affected by service1's state
      expect(service2.getScheduledStatus()).toEqual([]);

      service1.stop();
      service2.stop();
    });
  });

  describe("clearFired()", () => {
    it("should clear fired notifications", () => {
      const service = new SessionNotificationService();
      const testSession = createTestSession();

      service.start([testSession], () => {});
      service.clearFired();

      expect(service.getScheduledStatus()).toEqual([]);

      service.stop();
    });
  });

  describe("stop()", () => {
    it("should clear the polling interval", () => {
      const service = new SessionNotificationService();
      const testSession = createTestSession();

      service.start([testSession], () => {});
      expect(service["pollInterval"]).not.toBeNull();

      service.stop();
      expect(service["pollInterval"]).toBeNull();
    });
  });

  describe("Backward Compatibility", () => {
    afterEach(() => {
      // Clean up singleton instance
      const { sessionNotifService } = require("./sessionNotifService");
      sessionNotifService.stop();
    });

    it("should export legacy API", () => {
      expect(typeof startSessionNotifScheduler).toBe("function");
      expect(typeof getScheduledStatus).toBe("function");
    });

    it("should work with legacy API", () => {
      const testSession = createTestSession();
      const cleanup = startSessionNotifScheduler([testSession], () => {});

      expect(typeof cleanup).toBe("function");
      expect(Array.isArray(getScheduledStatus())).toBe(true);

      cleanup();
    });
  });

  describe("createTestSession()", () => {
    it("should create valid test session", () => {
      const session = createTestSession();

      expect(session.id).toBe("__test_session__");
      expect(session.title).toContain("[TEST]");
      expect(session.type).toBe("Talk");
      expect(session.startTime).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
