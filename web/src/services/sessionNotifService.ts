/**
 * Session notification scheduler.
 *
 * All session times are in Europe/Paris (Cannes timezone).
 * Notifications:
 *   - H-1: "Your session starts in 1h" → 1 hour before startTime
 *   - End: "Rate this session" → at endTime
 *   - Side events (no endTime): end-of-day notification at 19:00 Cannes time
 *
 * Polling-based: checks every 60s which notifications should fire,
 * instead of relying on long setTimeout which browsers can throttle.
 */

import type { Session } from "../types";

// ─── Timezone ────────────────────────────────────────────────

const CANNES_TZ = "Europe/Paris";

/** Get current time in Cannes as a Date (with correct offset applied). */
function nowInCannes(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: CANNES_TZ }));
}

/**
 * Parse a session date + time (HH:MM) into a timestamp (ms since epoch)
 * in the Cannes timezone. Returns null if inputs are invalid.
 */
function parseCannesTime(date: string, time: string): number | null {
  if (!date || !time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  // Build a date string that will be interpreted in Cannes TZ
  const pad = (n: number) => String(n).padStart(2, "0");
  const isoish = `${date}T${pad(hours)}:${pad(minutes)}:00`;

  // Use Intl to find the offset for Cannes at this date
  const utcGuess = new Date(isoish + "Z");
  const cannesStr = utcGuess.toLocaleString("en-US", { timeZone: CANNES_TZ });
  const cannesDate = new Date(cannesStr);
  const offsetMs = cannesDate.getTime() - utcGuess.getTime();

  // The actual UTC time for this Cannes local time
  return utcGuess.getTime() - offsetMs;
}

/** End-of-day in Cannes (19:00) for a given date string "YYYY-MM-DD" */
function endOfDayCannes(date: string): number | null {
  return parseCannesTime(date, "19:00");
}

// ─── Test session ────────────────────────────────────────────

export function createTestSession(): Session {
  const now = nowInCannes();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const endMin = now.getMinutes() + 3;
  const startMin = endMin - 20;

  return {
    id: "__test_session__",
    title: "[TEST] Notification Test Session",
    date: today,
    startTime: `${pad(now.getHours())}:${pad(Math.max(0, startMin))}`,
    endTime: `${pad(now.getHours())}:${pad(Math.min(59, endMin))}`,
    stage: "Test Stage",
    stageId: "test-stage",
    track: "Core Protocol",
    type: "Talk" as const,
    description: "Test session ending 3 minutes from now.",
    speakers: [{ name: "Test Speaker", organization: "Sofia", slug: "test-speaker" }],
  };
}

// ─── Notification types ──────────────────────────────────────

type NotifType = "h1" | "end" | "eod";

interface NotifKey {
  sessionId: string;
  type: NotifType;
}

function keyStr(k: NotifKey): string {
  return `${k.type}:${k.sessionId}`;
}

// Set of already-fired notification keys
const fired = new Set<string>();

export interface SessionNotifEvent {
  session: Session;
  type: NotifType;
  message: string;
}

// ─── Compute pending notifications ──────────────────────────

function computePendingNotifs(
  sessions: Session[],
  nowMs: number
): { key: NotifKey; session: Session; triggerMs: number }[] {
  const pending: { key: NotifKey; session: Session; triggerMs: number }[] = [];
  const WINDOW = 90_000; // 90s tolerance window

  for (const session of sessions) {
    // H-1: 1 hour before startTime
    const startMs = parseCannesTime(session.date, session.startTime);
    if (startMs !== null) {
      const h1Ms = startMs - 60 * 60 * 1000;
      const h1Key: NotifKey = { sessionId: session.id, type: "h1" };
      if (!fired.has(keyStr(h1Key)) && nowMs >= h1Ms && nowMs < h1Ms + WINDOW) {
        pending.push({ key: h1Key, session, triggerMs: h1Ms });
      }
    }

    if (session.endTime) {
      // End notification at endTime
      const endMs = parseCannesTime(session.date, session.endTime);
      if (endMs !== null) {
        const endKey: NotifKey = { sessionId: session.id, type: "end" };
        if (!fired.has(keyStr(endKey)) && nowMs >= endMs && nowMs < endMs + WINDOW) {
          pending.push({ key: endKey, session, triggerMs: endMs });
        }
      }
    } else {
      // Side event: end-of-day notification at 19:00
      const eodMs = endOfDayCannes(session.date);
      if (eodMs !== null) {
        const eodKey: NotifKey = { sessionId: session.id, type: "eod" };
        if (!fired.has(keyStr(eodKey)) && nowMs >= eodMs && nowMs < eodMs + WINDOW) {
          pending.push({ key: eodKey, session, triggerMs: eodMs });
        }
      }
    }
  }

  return pending;
}

function buildMessage(session: Session, type: NotifType): string {
  switch (type) {
    case "h1":
      return `Starts in 1h: "${session.title}" at ${session.startTime} · ${session.stage}`;
    case "end":
      return `How was "${session.title}"? Tap to rate`;
    case "eod":
      return `How was "${session.title}"? Rate this side event`;
  }
}

// ─── Public API ──────────────────────────────────────────────

let pollInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the notification scheduler. Polls every 60s.
 * Only notifies for sessions in the provided list (user's cart/published).
 *
 * @param sessions - Sessions to monitor (filter to user's cart before calling)
 * @param onNotify - Callback when a notification should fire
 * @returns cleanup function
 */
export function startSessionNotifScheduler(
  sessions: Session[],
  onNotify: (event: SessionNotifEvent) => void
): () => void {
  const check = () => {
    const nowMs = Date.now();
    const pending = computePendingNotifs(sessions, nowMs);
    for (const p of pending) {
      fired.add(keyStr(p.key));
      onNotify({
        session: p.session,
        type: p.key.type,
        message: buildMessage(p.session, p.key.type),
      });
    }
  };

  check();
  pollInterval = setInterval(check, 60_000); // every 60s

  return () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}

/**
 * Get the status of fired notifications (for debugging).
 */
export function getScheduledStatus(): string[] {
  return [...fired];
}
