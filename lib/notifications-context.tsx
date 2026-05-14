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

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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
  /** Increments every time a `session:accepted` socket event arrives.
   *  Student components can watch this in a useEffect to auto-refresh data. */
  sessionAcceptedAt: number;
};

// ─────────────────────────────────────────────────────────────
// Socket.io helpers
// ─────────────────────────────────────────────────────────────

const SOCKET_EVENTS = [
  "session:request",
  "session:accepted",
  "session:expired",
  "heartbeat:ack",
] as const;

type SocketEvent = (typeof SOCKET_EVENTS)[number];

function deriveWsBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "http://localhost:3000";
  // Strip /api/v* suffix to get the server root
  return apiUrl.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "") || "http://localhost:3000";
}

const WS_BASE = deriveWsBase();

const EVENT_META: Record<SocketEvent, { title: string; body: string }> = {
  "session:request": {
    title: "New Session Request",
    body: "A student has requested a 1-to-1 session. Tap to review and accept.",
  },
  "session:accepted": {
    title: "Session Accepted",
    body: "A mentor accepted your session request. Get ready for your session!",
  },
  "session:expired": {
    title: "Session Expired",
    body: "No mentor accepted your request within 30 minutes. Please try again.",
  },
  "heartbeat:ack": {
    title: "Status Confirmed",
    body: "Server confirmed your active mentor status.",
  },
};

function socketPayloadToNotification(
  event: SocketEvent,
  data: Record<string, unknown>
): AppNotification {
  const now = new Date().toISOString();
  const meta = EVENT_META[event];
  return {
    id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: "",
    channel: "in_app",
    title:
      typeof data.title === "string" ? data.title : meta.title,
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

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionAcceptedAt, setSessionAcceptedAt] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── REST: fetch all notifications ──────────────────────────
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await apiFetch<unknown>("/notifications/me", { auth: true });
      let list: AppNotification[] = [];
      if (Array.isArray(raw)) {
        list = raw as AppNotification[];
      } else if (raw && typeof raw === "object") {
        const wrapped = raw as Record<string, unknown>;
        const inner = wrapped.data ?? wrapped.notifications ?? wrapped.items;
        if (Array.isArray(inner)) list = inner as AppNotification[];
      }
      setNotifications(list);
    } catch {
      // Silently fail — don't break the dashboard if notifications are unavailable
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── REST: mark single notification as read ─────────────────
  const markRead = useCallback(async (id: string) => {
    // Optimistic
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isRead: true, readAt: new Date().toISOString(), status: "read" as const }
          : n
      )
    );
    try {
      await apiFetch(`/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
        auth: true,
      });
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: false, readAt: null, status: "sent" as const } : n
        )
      );
    }
  }, []);

  // ── REST: mark all notifications as read ───────────────────
  const markAllRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
        status: "read" as const,
      }))
    );
    try {
      await apiFetch("/notifications/read-all", { method: "POST", auth: true });
    } catch {
      // Re-fetch to restore server state
      void refresh();
    }
  }, [refresh]);

  // ── Socket.io: real-time connection ───────────────────────
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socket = io(`${WS_BASE}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", (err: Error) => {
      console.warn("[notifications] socket error:", err.message);
      setIsConnected(false);
    });

    for (const event of SOCKET_EVENTS) {
      socket.on(event, (data: Record<string, unknown>) => {
        const newNotif = socketPayloadToNotification(event, data);
        setNotifications((prev) => [newNotif, ...prev]);

        // Let student components know a mentor just accepted their session
        if (event === "session:accepted") {
          setSessionAcceptedAt(Date.now());
        }
      });
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // mount-only — token is read from memory on connect

  // ── Initial fetch ─────────────────────────────────────────
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startTransition(() => { void refresh(); });
    });
    return () => cancelAnimationFrame(id);
  }, [refresh]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, isConnected, isLoading, markRead, markAllRead, refresh, sessionAcceptedAt }}
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
