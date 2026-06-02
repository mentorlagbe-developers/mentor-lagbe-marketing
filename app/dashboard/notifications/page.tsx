"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
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
// Icon resolver (same logic as dropdown)
// ─────────────────────────────────────────────────────────────

type IconMeta = { Icon: React.ElementType; dot: string; label: string };

function resolveIcon(n: AppNotification): IconMeta {
  const title = (n.title ?? "").toLowerCase();
  const ref = (n.referenceType ?? "").toLowerCase();

  if (title.includes("request") && ref === "session")
    return { Icon: CalendarCheck2, dot: "bg-brand-primary", label: "Session Request" };
  if (title.includes("accepted") || title.includes("confirmed"))
    return { Icon: CheckCircle2, dot: "bg-emerald-500", label: "Accepted" };
  if (title.includes("declined") || title.includes("rejected"))
    return { Icon: CalendarX2, dot: "bg-rose-500", label: "Declined" };
  if (title.includes("expired") || title.includes("timeout"))
    return { Icon: AlertTriangle, dot: "bg-amber-500", label: "Expired" };
  if (title.includes("cancel"))
    return { Icon: X, dot: "bg-rose-400", label: "Canceled" };
  if (title.includes("payment") || title.includes("earning") || title.includes("payout"))
    return { Icon: CreditCard, dot: "bg-emerald-600", label: "Payment" };
  if (title.includes("rating") || title.includes("review"))
    return { Icon: Star, dot: "bg-amber-400", label: "Rating" };
  if (title.includes("message") || title.includes("chat"))
    return { Icon: MessageSquare, dot: "bg-violet-500", label: "Message" };
  if (title.includes("connection failed") || title.includes("offline"))
    return { Icon: WifiOff, dot: "bg-rose-500", label: "Connection" };
  if (title.includes("heartbeat") || title.includes("status confirmed") || title.includes("connected"))
    return { Icon: Wifi, dot: "bg-sky-500", label: "System" };
  if (title.includes("profile") || title.includes("verified") || title.includes("approved"))
    return { Icon: UserCheck, dot: "bg-teal-500", label: "Profile" };
  if (title.includes("security") || title.includes("password") || title.includes("login"))
    return { Icon: Shield, dot: "bg-slate-600", label: "Security" };
  if (title.includes("welcome") || title.includes("joined"))
    return { Icon: Heart, dot: "bg-pink-500", label: "Welcome" };
  if (title.includes("session") && title.includes("complete"))
    return { Icon: CheckCheck, dot: "bg-emerald-500", label: "Completed" };
  if (ref === "session")
    return { Icon: BellRing, dot: "bg-brand-primary", label: "Session" };
  return { Icon: Info, dot: "bg-slate-500", label: "General" };
}

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

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────
// Detail modal
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
  const router = useRouter();
  const { Icon, dot } = resolveIcon(notification);

  function handleNavigate() {
    if (!notification.isRead) onMarkRead(notification.id);
    onClose();
    if (notification.referenceType === "session") router.push("/dashboard/bookings");
  }

  return (
    <Modal open onClose={onClose} className="max-w-md">
      <div className="p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${dot}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">{notification.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(notification.createdAt)}
            </p>
          </div>
          {!notification.isRead && <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-brand-primary" />}
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          {cleanBody(notification.body)}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Status</p>
            <p className="mt-0.5 text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
              {notification.isRead ? "Read" : "Unread"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Received</p>
            <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatDate(notification.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {!notification.isRead && (
            <button
              type="button"
              onClick={() => { onMarkRead(notification.id); onClose(); }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Mark as read
            </button>
          )}
          {notification.referenceType === "session" && (
            <button
              type="button"
              onClick={handleNavigate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              View Session <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter tabs
// ─────────────────────────────────────────────────────────────

const FILTERS = ["All", "Unread", "Session", "Payment", "System"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(n: AppNotification, filter: Filter): boolean {
  if (filter === "All") return true;
  if (filter === "Unread") return !n.isRead;
  if (filter === "Session") return n.referenceType === "session";
  if (filter === "Payment") return n.title.toLowerCase().includes("payment") || n.title.toLowerCase().includes("earning");
  if (filter === "System") return n.referenceType === null || n.referenceType === "system";
  return true;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markRead, markAllRead, refresh } = useNotifications();
  const [filter, setFilter] = useState<Filter>("All");
  const [active, setActive] = useState<AppNotification | null>(null);

  const filtered = notifications.filter((n) => matchesFilter(n, filter));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread · ` : ""}
            {notifications.length} total
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-sky-600 transition hover:bg-sky-50 dark:border-slate-700 dark:text-sky-400 dark:hover:bg-slate-800"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? "bg-brand-primary text-white shadow-sm"
                : "border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {f}
            {f === "Unread" && unreadCount > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${filter === "Unread" ? "bg-white/25 text-white" : "bg-brand-primary text-white"}`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {isLoading && filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Nothing here</p>
            <p className="text-xs text-slate-400">
              {filter === "All" ? "You have no notifications yet." : `No "${filter}" notifications.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filtered.map((n) => {
              const { Icon, dot, label } = resolveIcon(n);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      n.isRead ? "" : "bg-sky-50/60 dark:bg-sky-950/20"
                    }`}
                    onClick={() => {
                      if (!n.isRead) void markRead(n.id);
                      setActive(n);
                    }}
                  >
                    {/* Icon */}
                    <div className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-700 dark:ring-slate-600">
                      <Bell className="h-4.5 w-4.5 text-slate-300 dark:text-slate-500" />
                      <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white ${dot}`}>
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${n.isRead ? "font-medium text-slate-600 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-slate-100"}`}>
                          {n.title}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                          {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand-primary" />}
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{cleanBody(n.body)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${dot}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detail modal */}
      {active && (
        <NotificationDetailModal
          notification={active}
          onClose={() => setActive(null)}
          onMarkRead={(id) => void markRead(id)}
        />
      )}
    </div>
  );
}
