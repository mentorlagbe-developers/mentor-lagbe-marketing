"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellRing,
  CalendarCheck2,
  CalendarX2,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Heart,
  Info,
  MessageSquare,
  RefreshCw,
  Settings,
  Shield,
  Star,
  UserCheck,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { useNotifications, type AppNotification } from "@/lib/notifications-context";

// ─────────────────────────────────────────────────────────────
// Icon resolver — rich set of contextual icons
// ─────────────────────────────────────────────────────────────

type IconMeta = { Icon: React.ElementType; dot: string; ring: string };

function resolveIcon(n: AppNotification): IconMeta {
  const title = (n.title ?? "").toLowerCase();
  const ref = (n.referenceType ?? "").toLowerCase();

  if (title.includes("request") && ref === "session")
    return { Icon: CalendarCheck2, dot: "bg-brand-primary", ring: "ring-brand-primary/20" };
  if (title.includes("accepted") || title.includes("confirmed"))
    return { Icon: CheckCircle2, dot: "bg-emerald-500", ring: "ring-emerald-500/20" };
  if (title.includes("declined") || title.includes("rejected"))
    return { Icon: CalendarX2, dot: "bg-rose-500", ring: "ring-rose-500/20" };
  if (title.includes("expired") || title.includes("timeout"))
    return { Icon: AlertTriangle, dot: "bg-amber-500", ring: "ring-amber-500/20" };
  if (title.includes("cancel"))
    return { Icon: X, dot: "bg-rose-400", ring: "ring-rose-400/20" };
  if (title.includes("payment") || title.includes("earning") || title.includes("payout"))
    return { Icon: CreditCard, dot: "bg-emerald-600", ring: "ring-emerald-600/20" };
  if (title.includes("rating") || title.includes("review"))
    return { Icon: Star, dot: "bg-amber-400", ring: "ring-amber-400/20" };
  if (title.includes("message") || title.includes("chat"))
    return { Icon: MessageSquare, dot: "bg-violet-500", ring: "ring-violet-500/20" };
  if (title.includes("connection failed") || title.includes("offline"))
    return { Icon: WifiOff, dot: "bg-rose-500", ring: "ring-rose-500/20" };
  if (title.includes("heartbeat") || title.includes("status confirmed") || title.includes("connected"))
    return { Icon: Wifi, dot: "bg-sky-500", ring: "ring-sky-500/20" };
  if (title.includes("profile") || title.includes("verified") || title.includes("approved"))
    return { Icon: UserCheck, dot: "bg-teal-500", ring: "ring-teal-500/20" };
  if (title.includes("security") || title.includes("password") || title.includes("login"))
    return { Icon: Shield, dot: "bg-slate-600", ring: "ring-slate-600/20" };
  if (title.includes("welcome") || title.includes("joined"))
    return { Icon: Heart, dot: "bg-pink-500", ring: "ring-pink-500/20" };
  if (title.includes("session") && title.includes("complete"))
    return { Icon: CheckCheck, dot: "bg-emerald-500", ring: "ring-emerald-500/20" };
  if (ref === "session")
    return { Icon: BellRing, dot: "bg-brand-primary", ring: "ring-brand-primary/20" };
  return { Icon: Info, dot: "bg-slate-500", ring: "ring-slate-500/20" };
}

// ─────────────────────────────────────────────────────────────
// Time helper
// ─────────────────────────────────────────────────────────────

// Strip raw UUID patterns from body text so they are never shown to users
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
function cleanBody(text: string): string {
  return text.replace(UUID_RE, "").replace(/\s{2,}/g, " ").replace(/—\s*\./g, "—").replace(/\s+\./g, ".").trim();
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function safeNotifId(n: AppNotification): string {
  // Never show raw UUIDs — use readableId if present, otherwise a short derived label
  const rid = (n as unknown as Record<string, unknown>).readableId;
  if (typeof rid === "string" && rid.trim()) return rid;
  return `N-${n.id.slice(-6).toUpperCase()}`;
}

// ─────────────────────────────────────────────────────────────
// Single notification detail modal
// ─────────────────────────────────────────────────────────────

function NotificationDetailModal({
  notification,
  onClose,
  onMarkRead,
}: {
  notification: AppNotification;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}) {
  const { Icon, dot } = resolveIcon(notification);
  const router = useRouter();

  function handleNavigate() {
    if (!notification.isRead) onMarkRead(notification.id);
    onClose(); // always close before navigating
    if (notification.referenceType === "session" && notification.referenceId) {
      router.push(`/dashboard/bookings?focus=${encodeURIComponent(notification.referenceId)}`);
    } else if (notification.referenceType === "session") {
      router.push("/dashboard/bookings");
    }
  }

  const modal = (
    <Modal open onClose={onClose} className="max-w-md">
      <div className="p-6">
        {/* Icon + title */}
        <div className="mb-4 flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${dot}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {notification.title}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {timeAgo(notification.createdAt)}
            </p>
          </div>
          {!notification.isRead && (
            <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-brand-primary" />
          )}
        </div>

        {/* Body */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          {cleanBody(notification.body)}
        </div>

        {/* Meta */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Status</p>
            <p className="mt-0.5 text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
              {notification.isRead ? "Read" : "Unread"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Type</p>
            <p className="mt-0.5 text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
              {notification.referenceType ?? "General"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          {!notification.isRead && (
            <button
              type="button"
              onClick={() => { onMarkRead(notification.id); onClose(); }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Mark as read
            </button>
          )}
          {notification.referenceType === "session" && (
            <button
              type="button"
              onClick={handleNavigate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              View Session <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );

  // Portal to document.body so the modal escapes the header's stacking context
  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

// ─────────────────────────────────────────────────────────────
// Notification row
// ─────────────────────────────────────────────────────────────

function NotificationRow({
  item,
  onRead,
  onClick,
}: {
  item: AppNotification;
  onRead: (id: string) => void;
  onClick: (n: AppNotification) => void;
}) {
  const { Icon, dot } = resolveIcon(item);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onClick(item)}
      onKeyDown={(e) => e.key === "Enter" && onClick(item)}
      className={`relative cursor-pointer overflow-hidden rounded-xl px-3 py-2.5 transition hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
        item.isRead ? "bg-slate-50 dark:bg-slate-800/40" : "bg-sky-50/80 dark:bg-sky-950/30"
      }`}
    >
      {!item.isRead && (
        <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r bg-brand-primary" />
      )}

      <div className="flex gap-2.5">
        {/* Icon bubble */}
        <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-700">
          <Bell className="h-3.5 w-3.5 text-slate-300 dark:text-slate-500" />
          <span className={`absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full text-white ${dot}`}>
            <Icon className="h-2.5 w-2.5" />
          </span>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className={`text-[13px] leading-[1.35] ${item.isRead ? "font-medium text-slate-700 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-slate-100"}`}>
            {item.title}
          </p>
          <p className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{cleanBody(item.body)}</p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-[11px] text-slate-400">{timeAgo(item.createdAt)}</span>
            {!item.isRead && <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-brand-primary" />}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Dropdown
// ─────────────────────────────────────────────────────────────

export function NotificationDropdown() {
  const { notifications, unreadCount, isConnected, isLoading, markRead, markAllRead, refresh } =
    useNotifications();
  const router = useRouter();
  const [activeNotif, setActiveNotif] = useState<AppNotification | null>(null);

  const recent = notifications.slice(0, 10);
  const hasAny = recent.length > 0;

  return (
    <>
      <div className="absolute right-0 top-[calc(100%+10px)] z-40 flex w-[min(94vw,420px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-26px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-2.5 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount} NEW
              </span>
            )}
            <span title={isConnected ? "Live updates on" : "Live updates off"}>
              {isConnected
                ? <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                : <WifiOff className="h-3.5 w-3.5 text-slate-400" />}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-slate-800"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isLoading}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Notification settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[380px] overflow-y-auto overscroll-contain">
          {isLoading && !hasAny ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <p className="text-sm text-slate-500">Loading notifications…</p>
            </div>
          ) : !hasAny ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10">
              <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">You&apos;re all caught up!</p>
              <p className="text-xs text-slate-400">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5 p-2.5">
              {recent.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onRead={(id) => void markRead(id)}
                  onClick={(n) => {
                    if (!n.isRead) void markRead(n.id);
                    setActiveNotif(n);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer — See all */}
        {hasAny && (
          <button
            type="button"
            onClick={() => router.push("/dashboard/notifications")}
            className="flex w-full items-center justify-center gap-2 border-t border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-slate-800"
          >
            See All Notifications <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Detail modal */}
      {activeNotif && (
        <NotificationDetailModal
          notification={activeNotif}
          onClose={() => setActiveNotif(null)}
          onMarkRead={(id) => void markRead(id)}
        />
      )}
    </>
  );
}
