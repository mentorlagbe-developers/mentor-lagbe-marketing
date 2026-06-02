"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import type { UserRole } from "@/lib/mock-auth";

export type NotificationStatus = "pending" | "sent" | "failed" | "read";

export type AppNotification = {
  id: string;
  userId: string;
  channel: string;
  title: string;
  body: string;
  referenceType: string | null;
  referenceId: string | null;
  status: NotificationStatus;
  isRead: boolean;
  readAt: string | null;
  sentAt: string;
  retryCount: number;
  createdAt: string;
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  sessionAcceptedAt: number;
  /** Bumps on session/payment socket events — refresh booking UIs */
  sessionRefreshAt: number;
  /** Call after local session mutations (e.g. mentor accept) to refresh dashboards */
  notifySessionsUpdated: () => void;
};

const STUDENT_SOCKET_EVENTS = [
  "session:accepted",
  "session:payment_approved",
  "session:payment_rejected",
  "session:payment_expired",
  "session:meet_link_updated",
  "session:expired",
] as const;

/** Real-time events that become in-app notifications (heartbeat:ack handled separately for mentors). */
const MENTOR_SOCKET_EVENTS = ["session:request"] as const;

const SHARED_SOCKET_EVENTS = [...MENTOR_SOCKET_EVENTS, ...STUDENT_SOCKET_EVENTS] as const;

const MENTOR_STATUS_CONFIRMED_TITLE = "Status Confirmed";
const MENTOR_CONNECTION_FAILED_TITLE = "Connection Failed";

const MENTOR_STATUS_SESSION_KEY = "ml_mentor_status_confirmed_shown";

type SocketEvent = (typeof SHARED_SOCKET_EVENTS)[number];

function deriveWsBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "http://localhost:3000";
  return apiUrl.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "") || "http://localhost:3000";
}

const WS_BASE = deriveWsBase();

const EVENT_META: Record<string, { title: string; body: string }> = {
  "session:request": {
    title: "New Session Request",
    body: "A student has requested a 1-to-1 session. Tap to review and accept.",
  },
  "session:accepted": {
    title: "Session Accepted",
    body: "A mentor accepted your session. Complete payment to confirm your spot.",
  },
  "session:payment_approved": {
    title: "Payment Approved",
    body: "Your payment was approved. Join unlocks at session time.",
  },
  "session:payment_rejected": {
    title: "Payment Rejected",
    body: "Your payment could not be verified. Please resubmit payment details.",
  },
  "session:payment_expired": {
    title: "Payment Window Expired",
    body: "The payment deadline passed. This session may have been cancelled.",
  },
  "session:meet_link_updated": {
    title: "Meet Link Updated",
    body: "Your mentor updated the meeting link. Use Join when your session starts.",
  },
  "session:expired": {
    title: "Session Expired",
    body: "No mentor accepted your request in time. Please book again.",
  },
  "heartbeat:ack": {
    title: MENTOR_STATUS_CONFIRMED_TITLE,
    body: "Server confirmed your active mentor status.",
  },
  "connection:failed": {
    title: MENTOR_CONNECTION_FAILED_TITLE,
    body: "Live updates are offline. Notifications may be delayed until you reconnect.",
  },
};

function isMentorSystemNoise(n: AppNotification): boolean {
  const t = (n.title ?? "").toLowerCase();
  const b = (n.body ?? "").toLowerCase();
  return (
    t.includes("status confirmed") ||
    t.includes("heartbeat") ||
    b.includes("active mentor status") ||
    t.includes("connection failed") ||
    (t.includes("live updates") && (t.includes("off") || t.includes("offline")))
  );
}

function filterNotificationsForRole(list: AppNotification[], role: UserRole): AppNotification[] {
  if (role !== "teacher") return list;
  return list.filter((n) => !isMentorSystemNoise(n));
}

function hasShownMentorStatusThisLogin(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(MENTOR_STATUS_SESSION_KEY) === "1";
}

function markMentorStatusShownThisLogin(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(MENTOR_STATUS_SESSION_KEY, "1");
}

/** Clear on logout so the next login can show status confirmed once again. */
export function clearMentorNotificationSessionFlags(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(MENTOR_STATUS_SESSION_KEY);
}

function socketPayloadToNotification(
  event: string,
  data: Record<string, unknown>
): AppNotification {
  const now = new Date().toISOString();
  const meta = EVENT_META[event] ?? { title: "Notification", body: "You have a new update." };
  return {
    id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: "",
    channel: "in_app",
    title: typeof data.title === "string" ? data.title : meta.title,
    body:
      typeof data.body === "string"
        ? data.body
        : typeof data.message === "string"
          ? data.message
          : meta.body,
    referenceType:
      typeof data.referenceType === "string"
        ? data.referenceType
        : event.startsWith("session")
          ? "session"
          : null,
    referenceId:
      typeof data.referenceId === "string"
        ? data.referenceId
        : typeof data.sessionId === "string"
          ? data.sessionId
          : null,
    status: "sent",
    isRead: false,
    readAt: null,
    sentAt: now,
    retryCount: 0,
    createdAt: now,
  };
}

function makeSystemNotification(event: string): AppNotification {
  return socketPayloadToNotification(event, {});
}

function parseNotificationsResponse(raw: unknown): { list: AppNotification[]; unreadCount: number } {
  if (Array.isArray(raw)) {
    return { list: raw as AppNotification[], unreadCount: raw.filter((n) => !n.isRead).length };
  }
  if (raw && typeof raw === "object") {
    const wrapped = raw as Record<string, unknown>;
    const inner = wrapped.notifications ?? wrapped.items ?? wrapped.data;
    const unread =
      typeof wrapped.unreadCount === "number"
        ? wrapped.unreadCount
        : Array.isArray(inner)
          ? (inner as AppNotification[]).filter((n) => !n.isRead).length
          : 0;
    if (Array.isArray(inner)) return { list: inner as AppNotification[], unreadCount: unread };
  }
  return { list: [], unreadCount: 0 };
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({
  children,
  role = "student",
}: {
  children: React.ReactNode;
  role?: UserRole;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [apiUnreadCount, setApiUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionAcceptedAt, setSessionAcceptedAt] = useState(0);
  const [sessionRefreshAt, setSessionRefreshAt] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const wasConnectedRef = useRef(false);
  const connectionFailureActiveRef = useRef(false);

  const unreadCount = Math.max(apiUnreadCount, notifications.filter((n) => !n.isRead).length);

  const prependNotification = useCallback((notif: AppNotification, replaceTitle?: string) => {
    setNotifications((prev) => {
      const base = replaceTitle ? prev.filter((n) => n.title !== replaceTitle) : prev;
      return [notif, ...base];
    });
    setApiUnreadCount((c) => c + 1);
  }, []);

  const showMentorStatusConfirmedOnce = useCallback(() => {
    if (role !== "teacher" || hasShownMentorStatusThisLogin()) return;
    markMentorStatusShownThisLogin();
    prependNotification(makeSystemNotification("heartbeat:ack"), MENTOR_STATUS_CONFIRMED_TITLE);
  }, [role, prependNotification]);

  const showMentorConnectionFailed = useCallback(() => {
    if (role !== "teacher" || connectionFailureActiveRef.current) return;
    connectionFailureActiveRef.current = true;
    prependNotification(
      makeSystemNotification("connection:failed"),
      MENTOR_CONNECTION_FAILED_TITLE,
    );
  }, [role, prependNotification]);

  const clearMentorConnectionFailed = useCallback(() => {
    if (role !== "teacher") return;
    connectionFailureActiveRef.current = false;
    setNotifications((prev) =>
      prev.filter((n) => n.title !== MENTOR_CONNECTION_FAILED_TITLE),
    );
  }, [role]);

  const bumpSessionRefresh = useCallback(() => {
    setSessionRefreshAt(Date.now());
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await apiFetch<unknown>("/notifications/me?page=1&limit=20", { auth: true });
      const { list, unreadCount: count } = parseNotificationsResponse(raw);
      const filtered = filterNotificationsForRole(list, role);
      setNotifications(filtered);
      setApiUnreadCount(filtered.filter((n) => !n.isRead).length);
    } catch {
      // keep dashboard usable if notifications API is down
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isRead: true, readAt: new Date().toISOString(), status: "read" as const }
          : n
      )
    );
    setApiUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiFetch(`/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
        auth: true,
      });
    } catch {
      void refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
        status: "read" as const,
      }))
    );
    setApiUnreadCount(0);
    try {
      await apiFetch("/notifications/read-all", { method: "POST", auth: true });
    } catch {
      void refresh();
    }
  }, [refresh]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const eventsForRole: string[] =
      role === "teacher"
        ? [...MENTOR_SOCKET_EVENTS, ...STUDENT_SOCKET_EVENTS]
        : [...STUDENT_SOCKET_EVENTS];

    const socket = io(`${WS_BASE}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      clearMentorConnectionFailed();
      if (role === "teacher") {
        showMentorStatusConfirmedOnce();
      }
      wasConnectedRef.current = true;
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      if (role === "teacher" && wasConnectedRef.current) {
        showMentorConnectionFailed();
      }
    });

    socket.on("connect_error", (err: Error) => {
      console.warn("[notifications] socket error:", err.message);
      setIsConnected(false);
      if (role === "teacher") {
        showMentorConnectionFailed();
      }
    });

    socket.on("heartbeat:ack", () => {
      // Mentor heartbeat runs every 60s — do not spam the notification list.
      if (role === "teacher") {
        setIsConnected(true);
        clearMentorConnectionFailed();
      }
    });

    for (const event of eventsForRole) {
      socket.on(event, (data: Record<string, unknown>) => {
        const newNotif = socketPayloadToNotification(event, data);
        setNotifications((prev) => [newNotif, ...prev]);
        setApiUnreadCount((c) => c + 1);

        if (event === "session:accepted") {
          setSessionAcceptedAt(Date.now());
        }
        if (event.startsWith("session:")) {
          bumpSessionRefresh();
        }
      });
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
      wasConnectedRef.current = false;
      connectionFailureActiveRef.current = false;
    };
  }, [
    role,
    bumpSessionRefresh,
    showMentorStatusConfirmedOnce,
    showMentorConnectionFailed,
    clearMentorConnectionFailed,
  ]);

  useEffect(() => {
    if (role !== "teacher" || !isConnected) return;
    const socket = socketRef.current;
    if (!socket) return;

    const emitHeartbeat = () => {
      socket.emit("heartbeat");
    };
    emitHeartbeat();
    const id = window.setInterval(emitHeartbeat, 60_000);
    return () => window.clearInterval(id);
  }, [role, isConnected]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startTransition(() => {
        void refresh();
      });
    });
    return () => cancelAnimationFrame(id);
  }, [refresh]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        markRead,
        markAllRead,
        refresh,
        sessionAcceptedAt,
        sessionRefreshAt,
        notifySessionsUpdated: bumpSessionRefresh,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside <NotificationsProvider>");
  }
  return ctx;
}
