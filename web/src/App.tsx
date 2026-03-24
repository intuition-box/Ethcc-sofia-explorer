import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PhoneFrame } from "./components/ui/PhoneFrame";
import { Nav5 } from "./components/ui/Nav5";
import { useCart } from "./hooks/useCart";
import { StorageService } from "./services/StorageService";
import { sessions } from "./data";
import { startSessionNotifScheduler, createTestSession, type SessionNotifEvent } from "./services/sessionNotifService";
import { STORAGE_KEYS } from "./config/constants";
import { requestNotificationPermission, showNativeNotification, notifyReplayAvailable } from "./services/notificationService";
import { startReplayPolling } from "./services/replayService";
import { subscribeToPush } from "./services/pushService";
import { C, FONT, glassSurface } from "./config/theme";
import "./styles/globals.css";

const TAB_PATHS = ["/home", "/agenda", "/cart", "/vote", "/profile"];

// ─── Toast style ─────────────────────────────────────────────
const toastStyle: CSSProperties = {
  position: "absolute",
  top: 56,
  left: 16,
  right: 16,
  ...glassSurface,
  background: "rgba(22,22,24,0.95)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  padding: 14,
  zIndex: 9999,
  animation: "slideDown 0.3s ease",
  cursor: "pointer",
};

export default function App() {
  const location = useLocation();
  const { cart } = useCart();
  const showNav = TAB_PATHS.includes(location.pathname);

  // Check if onboarding is completed
  const topics = StorageService.loadTopics();
  const hasOnboarded = topics.size > 0 || localStorage.getItem("ethcc-onboarded") === "1";

  if (!hasOnboarded && location.pathname !== "/") {
    // We let the router handle this via the index route
  }

  const navigate = useNavigate();

  // ── Notification toast ──────────────────────────────────
  const [toast, setToast] = useState<{ title: string; body: string; sessionId?: string } | null>(null);

  const dismissToast = useCallback(() => {
    if (toast?.sessionId) {
      navigate(`/rate/${toast.sessionId}`);
    }
    setToast(null);
  }, [toast, navigate]);

  // Auto-dismiss toast after 15s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 15000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Request notification permission + push subscription ──
  useEffect(() => {
    requestNotificationPermission().then(() => {
      subscribeToPush().catch(() => {});
    });
  }, []);

  // ── Session notification scheduler ────────────────────
  useEffect(() => {
    // Only notify for sessions the user cares about (cart + published)
    const cartIds = [...cart];
    const publishedIds: string[] = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); } catch { return []; } })();
    const userSessionIds = new Set([...cartIds, ...publishedIds]);

    const testSession = createTestSession();
    const userSessions = [
      testSession,
      ...sessions.filter((s) => userSessionIds.has(s.id)),
    ];

    const cleanup = startSessionNotifScheduler(userSessions, (event: SessionNotifEvent) => {
      // In-app toast
      const isRatable = event.type === "end" || event.type === "eod";
      setToast({
        title: event.message,
        body: event.type === "h1" ? "Don't miss it!" : "Tap to rate this session",
        sessionId: isRatable ? event.session.id : undefined,
      });

      // Native notification (works when tab is not focused)
      showNativeNotification(event.message, {
        body: event.type === "h1" ? "Don't miss it!" : "Tap to rate",
        tag: `${event.type}-${event.session.id}`,
        url: isRatable ? `/rate/${event.session.id}` : `/session/${event.session.id}`,
      });
    });

    return cleanup;
  }, [cart]);

  // ── Replay polling ─────────────────────────────────────
  useEffect(() => {
    // Session title lookup for notifications
    const sessionMap = new Map(sessions.map((s) => [s.id, s.title]));

    const cleanup = startReplayPolling((newReplays) => {
      for (const replay of newReplays) {
        const title = sessionMap.get(replay.sessionId) ?? "Session";

        // In-app toast (shows the last one)
        setToast({
          title: `Replay available: ${title}`,
          body: "The recording is now on YouTube",
        });

        // Native notification
        notifyReplayAvailable(title, replay.url);
      }
    });

    return cleanup;
  }, []);

  return (
    <PhoneFrame>
      <Outlet />
      {showNav && <Nav5 cartCount={cart.size} />}

      {/* Notification toast */}
      {toast && (
        <div style={toastStyle} onClick={dismissToast}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>
            {toast.title}
          </div>
          {toast.body && (
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4, fontFamily: FONT }}>
              {toast.body}
            </div>
          )}
        </div>
      )}

      {/* Toast animation */}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </PhoneFrame>
  );
}
