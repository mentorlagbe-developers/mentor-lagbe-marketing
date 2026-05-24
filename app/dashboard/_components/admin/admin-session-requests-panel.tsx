"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  Loader2,
  PencilLine,
  RefreshCw,
  ShieldAlert,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import {
  approveAdminPayment,
  fetchPendingPaymentsBySessionId,
  rejectAdminPayment,
  resolvePendingPaymentForSession,
  type PendingPayment,
  type SessionPendingPayment,
} from "@/lib/admin-payments-api";
import { ApiError } from "@/lib/api";
import {
  bucketAdminSessionStatus,
  getAdminSession,
  getAdminSessionEligibleMentors,
  ADMIN_SESSIONS_LIST_MAX_LIMIT,
  listAdminSessions,
  patchAdminSession,
  toAdminSessionRow,
  type AdminSessionRow,
  type SessionStats,
} from "@/lib/admin-sessions-api";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { Pagination } from "@/app/components/ui/pagination";
import { ToastCenter, type ToastAction, type ToastMessage, type ToastVariant } from "@/app/components/ui/toast-center";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime12(raw: string) {
  if (!raw) return "—";
  const trimmed = raw.trim();
  if (trimmed.includes("T") || trimmed.endsWith("Z")) {
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) {
      const h = d.getHours();
      const m = d.getMinutes();
      const p = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${String(m).padStart(2, "0")} ${p}`;
    }
  }
  const [h0, m0] = raw.slice(0, 8).split(":");
  const h = Number(h0);
  const m = Number(m0 ?? 0);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return raw.slice(0, 5);
  const p = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${p}`;
}

function getAtPath(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function stringFromUnknown(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}

function sessionInstantFromRow(row: AdminSessionRow): Date | null {
  const raw = row.raw;
  for (const key of ["scheduledAt", "sessionStartAt", "startDateTime", "sessionDateTime", "scheduledStart"]) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) {
      const t = Date.parse(v.trim());
      if (!Number.isNaN(t)) return new Date(t);
    }
  }
  const sd = row.sessionDate?.trim() ?? "";
  const st = (row.startTime || "12:00:00").replace(/Z$/, "").trim();
  if (sd.includes("T")) {
    const t = Date.parse(sd);
    if (!Number.isNaN(t)) return new Date(t);
  }
  if (sd) {
    const timePart = st.length >= 8 ? st.slice(0, 8) : `${st}:00:00`.replace(/:+/g, ":").slice(0, 8);
    const t = Date.parse(`${sd.slice(0, 10)}T${timePart}`);
    if (!Number.isNaN(t)) return new Date(t);
  }
  return null;
}

function formatSessionScheduleDate(row: AdminSessionRow): string {
  const d = sessionInstantFromRow(row);
  if (!d || Number.isNaN(d.getTime())) {
    const fb = row.sessionDate?.trim();
    if (fb) {
      const t = Date.parse(fb.includes("T") || fb.endsWith("Z") ? fb : `${fb.slice(0, 10)}T12:00:00`);
      if (!Number.isNaN(t)) {
        return new Date(t).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
      return fb;
    }
    return "—";
  }
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function badgeTone(status: string) {
  const b = bucketAdminSessionStatus(status);
  if (b === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200";
  if (b === "canceled") return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200";
  if (b === "requested") return "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100";
  return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100";
}

const statTones = {
  sky: { blob: "bg-sky-500", icon: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200" },
  emerald: {
    blob: "bg-emerald-500",
    icon: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  },
  amber: {
    blob: "bg-amber-500",
    icon: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100",
  },
  rose: { blob: "bg-rose-500", icon: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100" },
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardList;
  tone: keyof typeof statTones;
}) {
  const t = statTones[tone];
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900",
        "border-slate-200/90 dark:border-slate-700/90"
      )}
    >
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.11]", t.blob)} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", t.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function flattenForDisplay(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (depth > 2) return "[…]";
    return value.map((v) => flattenForDisplay(v, depth + 1)).join(", ");
  }
  if (typeof value === "object") {
    if (depth > 2) return "{…}";
    return JSON.stringify(value, null, 0).slice(0, 400);
  }
  return String(value);
}

function isSensitiveFieldKey(key: string): boolean {
  if (/readableid$/i.test(key)) return false;
  const lower = key.toLowerCase();
  if (lower === "id" || lower === "uuid" || lower === "guid") return true;
  if (/_id$/i.test(key)) return true;
  if (/Id$/.test(key) && /[a-z]Id$/.test(key)) return true;
  if (lower.includes("token") || lower.includes("password") || lower.includes("secret")) return true;
  return false;
}

function sanitizeForDisplay(data: Record<string, unknown>, depth = 0): Record<string, unknown> {
  if (depth > 5) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k.startsWith("_") || isSensitiveFieldKey(k)) continue;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out[k] = sanitizeForDisplay(v as Record<string, unknown>, depth + 1);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item !== null && typeof item === "object" && !Array.isArray(item)
          ? sanitizeForDisplay(item as Record<string, unknown>, depth + 1)
          : item
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

function humanizeFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^per ?30 ?min/i, "Per 30 min");
}

function KeyValueGrid({ data, title }: { data: Record<string, unknown>; title?: string }) {
  const entries = Object.entries(data).filter(([k]) => !k.startsWith("_"));
  if (!entries.length) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      {title ? (
        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</h4>
      ) : null}
      <dl className={cn("grid gap-2 sm:grid-cols-2", title ? "mt-3" : "")}>
        {entries.map(([key, val]) => (
          <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {humanizeFieldLabel(key)}
            </dt>
            <dd className="mt-0.5 wrap-break-word text-sm font-medium text-slate-900 dark:text-slate-100">{flattenForDisplay(val)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function pickStringFromRecord(record: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickStringOrNumber(record: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

/** Human-facing mentor/student reference codes (not internal UUIDs). */
function pickParticipantReadableId(record: Record<string, unknown>, role: "mentor" | "student"): string {
  const topKeys =
    role === "mentor"
      ? [
          "mentorReadableId",
          "assignedMentorReadableId",
          "mentorSessionReadableId",
          "mentorBookingReadableId",
          "primaryMentorReadableId",
        ]
      : ["studentReadableId", "studentSessionReadableId", "studentBookingReadableId", "participantReadableId"];
  const nestedPaths =
    role === "mentor"
      ? [
          "mentor.readableId",
          "mentor.readable_id",
          "assignedMentor.readableId",
          "assignedMentor.readable_id",
          "primaryMentor.readableId",
          "mentor.user.readableId",
          "mentor.profile.readableId",
        ]
      : [
          "student.readableId",
          "student.readable_id",
          "participant.readableId",
          "participant.readable_id",
          "student.user.readableId",
          "student.profile.readableId",
        ];
  for (const k of topKeys) {
    const s = pickStringFromRecord(record, [k]);
    if (s) return s;
  }
  for (const path of nestedPaths) {
    const s = stringFromUnknown(getAtPath(record, path));
    if (s) return s;
  }
  const nestedObj =
    role === "mentor"
      ? (record.mentor ?? record.assignedMentor ?? record.primaryMentor)
      : (record.student ?? record.participant);
  if (nestedObj && typeof nestedObj === "object" && !Array.isArray(nestedObj)) {
    const o = nestedObj as Record<string, unknown>;
    const s = pickStringFromRecord(o, ["readableId", "readable_id", "publicId", "userReadableId", "displayCode"]);
    if (s) return s;
  }
  return "";
}

function resolvePublicMediaUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  return t;
}

function pickMentorProfileImageRaw(m: Record<string, unknown>): string {
  const keys = [
    "profilePictureUrl",
    "profileImageUrl",
    "avatarUrl",
    "avatar",
    "photoUrl",
    "pictureUrl",
    "image",
    "profilePhoto",
  ];
  return pickStringFromRecord(m, keys);
}

function MentorAvatar({ mentor }: { mentor: Record<string, unknown> }) {
  const raw = pickMentorProfileImageRaw(mentor);
  const src = resolvePublicMediaUrl(raw);
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-linear-to-br from-slate-100 to-slate-200 text-slate-400 dark:border-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-500">
        <UserRound className="h-12 w-12" strokeWidth={1.25} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-28 w-28 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-md dark:border-slate-600"
      onError={() => setBroken(true)}
    />
  );
}

function mentorDepartmentLabel(m: Record<string, unknown>): string {
  const nestedPaths = [
    "department.name",
    "department.title",
    "department.label",
    "expertiseDepartment.name",
    "expertiseDepartment.title",
    "expertise.departmentName",
    "expertise.department.name",
    "user.departmentName",
    "user.department.name",
    "user.department.title",
    "profile.departmentName",
    "profile.department.name",
    "mentor.departmentName",
    "mentor.department.name",
    "primaryDepartment.name",
    "primaryDepartment.title",
  ];
  for (const path of nestedPaths) {
    const s = stringFromUnknown(getAtPath(m, path));
    if (s) return s;
  }
  const direct =
    pickStringFromRecord(m, [
      "departmentName",
      "expertiseDepartmentName",
      "departmentTitle",
      "deptName",
      "mentorDepartmentName",
      "subjectDepartmentName",
    ]) || (typeof m.department === "string" ? m.department.trim() : "");
  if (direct) return direct;
  const dep = m.department;
  if (dep && typeof dep === "object" && !Array.isArray(dep)) {
    const name = (dep as Record<string, unknown>).name;
    if (typeof name === "string" && name.trim()) return name.trim();
    const title = (dep as Record<string, unknown>).title;
    if (typeof title === "string" && title.trim()) return title.trim();
  }
  const list = m.departments;
  if (Array.isArray(list)) {
    const parts = list
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "name" in item && typeof (item as { name: unknown }).name === "string") {
          return (item as { name: string }).name;
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join(", ").slice(0, 120);
  }
  return "";
}

function mentorWaNumber(m: Record<string, unknown>) {
  const w = m.waNumber ?? m.whatsapp ?? m.whatsAppNumber;
  return typeof w === "string" ? w.trim() : "";
}

function mentorFieldsForSecondaryGrid(m: Record<string, unknown>, bioShown: boolean): Record<string, unknown> {
  const s = sanitizeForDisplay(m);
  const shownInHeader = new Set([
    "fullName",
    "name",
    "displayName",
    "email",
    "primaryEmail",
    "phone",
    "phoneNumber",
    "mobile",
    "contactPhone",
    "waNumber",
    "whatsapp",
    "whatsAppNumber",
    "profilePictureUrl",
    "profileImageUrl",
    "avatarUrl",
    "avatar",
    "photoUrl",
    "pictureUrl",
    "image",
    "profilePhoto",
    "biography",
    "bio",
    "about",
    "qualification",
    "departmentName",
    "expertiseDepartmentName",
    "department",
    "departments",
    "per30MinRateBdt",
    "per30MinRate",
    "hourlyRateBdt",
    "rateBdt",
    "rate",
    "ratingAverage",
    "ratingAvg",
    "averageRating",
    "ratingCount",
    "reviewsCount",
    "totalSessionsDone",
    "sessionsCompleted",
    "completedSessions",
    "experienceYears",
    "yearsExperience",
    "experience",
  ]);
  if (bioShown) {
    shownInHeader.add("description");
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) {
    if (shownInHeader.has(k)) continue;
    out[k] = v;
  }
  return out;
}

function MentorDetailModalContent({ mentor, onClose }: { mentor: Record<string, unknown>; onClose: () => void }) {
  const name = mentorRowLabel(mentor, 0);
  const email = mentorRowEmail(mentor);
  const phone = mentorRowPhone(mentor);
  const wa = mentorWaNumber(mentor);
  const dept = mentorDepartmentLabel(mentor);
  const qualification = pickStringFromRecord(mentor, ["qualification", "degree", "education"]);
  const bio = pickStringFromRecord(mentor, ["biography", "bio", "about", "description"]);
  const rate = pickStringOrNumber(mentor, ["per30MinRateBdt", "per30MinRate", "hourlyRateBdt", "rateBdt", "rate"]);
  const ratingAvg = pickStringOrNumber(mentor, ["ratingAverage", "ratingAvg", "averageRating"]);
  const ratingCount = pickStringOrNumber(mentor, ["ratingCount", "reviewsCount"]);
  const sessionsDone = pickStringOrNumber(mentor, ["totalSessionsDone", "sessionsCompleted", "completedSessions"]);
  const experienceYears = pickStringOrNumber(mentor, ["experienceYears", "yearsExperience", "experience"]);
  const grid = mentorFieldsForSecondaryGrid(mentor, Boolean(bio));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6 pt-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <MentorAvatar mentor={mentor} />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Mentor</p>
            <h4 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{name}</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {dept ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100">
                {dept}
              </span>
            ) : null}
            {qualification ? (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-900 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100">
                {qualification}
              </span>
            ) : null}
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {email ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Email</dt>
                <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                  <a href={`mailto:${email}`} className="text-brand-primary hover:underline">
                    {email}
                  </a>
                </dd>
              </div>
            ) : null}
            {phone ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Phone</dt>
                <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{phone}</dd>
              </div>
            ) : null}
            {wa ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">WhatsApp</dt>
                <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{wa}</dd>
              </div>
            ) : null}
          </dl>
          {(rate || ratingAvg || sessionsDone || experienceYears) ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {rate ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Rate / 30m</p>
                  <p className="mt-1 text-sm font-bold text-emerald-950 dark:text-emerald-50">৳{rate}</p>
                </div>
              ) : null}
              {ratingAvg ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-center dark:border-amber-900/40 dark:bg-amber-950/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">Rating</p>
                  <p className="mt-1 text-sm font-bold text-amber-950 dark:text-amber-50">
                    {ratingAvg}
                    {ratingCount ? <span className="text-xs font-normal opacity-80"> ({ratingCount})</span> : null}
                  </p>
                </div>
              ) : null}
              {sessionsDone ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center dark:border-slate-600 dark:bg-slate-800/80">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sessions</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-50">{sessionsDone}</p>
                </div>
              ) : null}
              {experienceYears ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center dark:border-slate-600 dark:bg-slate-800/80">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Experience</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-50">{experienceYears} yrs</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {bio ? (
        <section className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
          <h5 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">About</h5>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{bio}</p>
        </section>
      ) : null}
      {Object.keys(grid).length ? (
        <KeyValueGrid data={grid} title="More details" />
      ) : null}
      <div className="flex justify-end border-t border-slate-100 pt-2 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function bucketSessionFieldKey(key: string): string {
  const k = key.toLowerCase();
  if (k === "createdat" || k === "updatedat" || k === "deletedat" || k.endsWith("timestamp")) return "meta";
  if (
    k.includes("sessiondate") ||
    k === "date" ||
    k.includes("scheduled") ||
    k.includes("starttime") ||
    k.includes("endtime") ||
    k.includes("duration") ||
    k.includes("timezone") ||
    k.includes("timeslot")
  ) {
    return "schedule";
  }
  if ((k.includes("price") || k.includes("amount") || k.includes("fee") || k.includes("bdt") || k.includes("currency")) && !k.endsWith("id")) {
    return "pricing";
  }
  if (
    k === "status" ||
    k.includes("state") ||
    k.includes("readable") ||
    k.includes("bookingcode") ||
    k.includes("reference")
  ) {
    return "booking";
  }
  if (
    (k.includes("topic") || k.includes("course") || k.includes("subject") || k.includes("problem") || k.includes("description") || k.includes("notes")) &&
    !k.endsWith("id")
  ) {
    return "topic";
  }
  if (
    (k.includes("student") || k.includes("mentor") || k.includes("participant") || k.includes("assignee") || k === "email" || k.includes("contact")) &&
    !/[a-z]id$/i.test(key)
  ) {
    return "people";
  }
  if (k.includes("pay") || k.includes("invoice") || k.includes("transaction") || k.includes("gateway") || k.includes("billing") || k.includes("refund")) {
    return "payment";
  }
  return "other";
}

/** Shown in the hero strip; omitted from grouped lists to avoid duplicate clutter. */
const SESSION_HERO_EXACT_KEYS = new Set([
  "status",
  "sessionDate",
  "date",
  "scheduledDate",
  "startTime",
  "sessionStartTime",
  "endTime",
  "sessionEndTime",
  "priceBdt",
  "price",
  "amountBdt",
  "totalBdt",
  "amount",
  "mentorReadableId",
  "studentReadableId",
  "assignedMentorReadableId",
  "mentorSessionReadableId",
  "studentSessionReadableId",
  "mentorBookingReadableId",
  "studentBookingReadableId",
  "primaryMentorReadableId",
  "participantReadableId",
]);

const SESSION_GROUP_META: Record<
  string,
  { title: string; description: string; order: number }
> = {
  schedule: { title: "Schedule & time", description: "When this session runs and for how long.", order: 0 },
  booking: { title: "Booking & status", description: "Reference and current state.", order: 1 },
  pricing: { title: "Pricing", description: "Fees and amounts on file.", order: 2 },
  topic: { title: "Topic & notes", description: "What the session is about.", order: 3 },
  people: { title: "People & contact", description: "Who is involved (no internal IDs).", order: 4 },
  payment: { title: "Payment snapshot", description: "Billing-related fields still on the session record.", order: 5 },
  meta: { title: "Timestamps & system", description: "Audit and technical metadata.", order: 6 },
  other: { title: "Additional fields", description: "Everything else returned by the API.", order: 7 },
};

function SessionDetailOverview({ detail }: { detail: Record<string, unknown> }) {
  const safe = sanitizeForDisplay(detail);
  const buckets: Record<string, [string, unknown][]> = {
    schedule: [],
    booking: [],
    pricing: [],
    topic: [],
    people: [],
    payment: [],
    meta: [],
    other: [],
  };

  for (const [key, val] of Object.entries(safe)) {
    if (key.startsWith("_")) continue;
    if (SESSION_HERO_EXACT_KEYS.has(key)) continue;
    const b = bucketSessionFieldKey(key);
    buckets[b].push([key, val]);
  }

  const groupIds = (Object.keys(buckets) as Array<keyof typeof buckets>)
    .filter((id) => id !== "pricing" && buckets[id].length > 0)
    .sort((a, b) => SESSION_GROUP_META[a].order - SESSION_GROUP_META[b].order);

  const status = String(detail.status ?? safe.status ?? "—");
  const scheduleRow = toAdminSessionRow(detail);
  const dateStr = formatSessionScheduleDate(scheduleRow);
  const start = scheduleRow.startTime;
  const end = scheduleRow.endTime;
  const price = pickStringFromRecord(safe, ["priceBdt", "price", "amountBdt", "totalBdt", "amount"]);
  const topicLine =
    pickStringFromRecord(safe, ["customTopicName", "topicName", "topic", "title", "subject"]) ||
    (typeof safe.problemDescription === "string" ? safe.problemDescription.slice(0, 140) : "");
  const mentorReadableRef = pickParticipantReadableId(detail, "mentor");
  const studentReadableRef = pickParticipantReadableId(detail, "student");

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Status</p>
          <p className="mt-2">
            <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", badgeTone(status))}>
              {formatStatus(status)}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">When</p>
          <p className="mt-2 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50">
            {dateStr || "—"}
            {start || end ? (
              <>
                <br />
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {start ? formatTime12(start) : "—"} – {end ? formatTime12(end) : "—"}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Price</p>
          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-50">{price ? `৳${price}` : "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950 sm:col-span-2 xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Topic</p>
          <p className="mt-2 line-clamp-4 text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">{topicLine || "—"}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Mentor readable ID</p>
          <p className="mt-2 font-mono text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">{mentorReadableRef || "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Student readable ID</p>
          <p className="mt-2 font-mono text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">{studentReadableRef || "—"}</p>
        </div>
      </div>

      <div className="space-y-4">
        {groupIds.map((id) => {
          const meta = SESSION_GROUP_META[id];
          const entries = buckets[id];
          return (
            <section
              key={id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <header className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">{meta.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{meta.description}</p>
              </header>
              <dl className="grid gap-2 p-4 sm:grid-cols-2">
                {entries.map(([key, val]) => (
                  <div
                    key={key}
                    className={cn(
                      "rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-700/80 dark:bg-slate-800/40",
                      key.toLowerCase().includes("description") || key.toLowerCase().includes("notes") || key.toLowerCase().includes("problem")
                        ? "sm:col-span-2"
                        : ""
                    )}
                  >
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {humanizeFieldLabel(key)}
                    </dt>
                    <dd className="mt-1 wrap-break-word text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                      {flattenForDisplay(val)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function PaymentReviewActions({
  payment,
  busy,
  rejectReason,
  onRejectReasonChange,
  onApprove,
  onReject,
  compact,
}: {
  payment: SessionPendingPayment;
  busy: boolean;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30", compact && "p-3")}>
      <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Payment review</p>
      <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-200/90">
        ৳{payment.amountBdt || "—"} · {payment.paymentMethod || "—"} · TrxID {payment.trxId || "—"}
      </p>
      {!compact ? (
        <label className="mt-3 block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Rejection reason (optional)</span>
          <input
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder="Shown to student if rejected"
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
      ) : null}
      <div className={cn("flex flex-wrap gap-2", compact ? "mt-3" : "mt-4")}>
        <Button type="button" size="sm" disabled={busy} onClick={onApprove}>
          <Check className="mr-1.5 h-4 w-4" />
          Approve payment
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={onReject}>
          <X className="mr-1.5 h-4 w-4" />
          Reject payment
        </Button>
      </div>
    </div>
  );
}

function extractPaymentBlock(detail: Record<string, unknown>): Record<string, unknown> | null {
  const pay = detail.payment ?? detail.paymentDetails ?? detail.paymentInfo ?? detail.billing;
  if (pay && typeof pay === "object" && !Array.isArray(pay)) return pay as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(detail)) {
    if (/pay|amount|bdt|tk|transaction|invoice|gateway|stripe|ssl/i.test(k) && v !== null && v !== undefined) {
      out[k] = v as unknown;
    }
  }
  return Object.keys(out).length ? out : null;
}

function mentorRowLabel(m: Record<string, unknown>, index: number) {
  return String(m.fullName ?? m.name ?? m.displayName ?? `Mentor ${index + 1}`).trim() || `Mentor ${index + 1}`;
}

function mentorRowEmail(m: Record<string, unknown>) {
  const paths = [
    "email",
    "primaryEmail",
    "userEmail",
    "contactEmail",
    "mail",
    "user.email",
    "user.primaryEmail",
    "profile.email",
    "mentor.email",
    "account.email",
    "student.email",
    "personalEmail",
  ];
  for (const path of paths) {
    const s = stringFromUnknown(getAtPath(m, path));
    if (s) return s;
  }
  return "";
}

function mentorRowPhone(m: Record<string, unknown>) {
  const p = m.phone ?? m.phoneNumber ?? m.mobile ?? m.contactPhone;
  if (typeof p === "string" && p.trim()) return p.trim();
  return mentorWaNumber(m);
}

type MainTab = "overview" | "sessions";
type SessionDetailTab = "overview" | "payment" | "mentors";

function tabTriggerClass(active: boolean) {
  return cn(
    "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
    active
      ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
      : "border border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
  );
}

const SESSION_TABLE_HEAD =
  "border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400";

const SESSION_TABLE_ROW =
  "bg-white transition hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-800/60";

function parseRowSortTime(row: AdminSessionRow): number {
  const raw = row.raw;
  const candidates = [
    row.createdAt,
    raw.createdAt,
    raw.updatedAt,
    raw.created,
    raw.created_at,
    raw.scheduledAt,
    raw.sessionStartAt,
    raw.startDateTime,
    raw.sessionDateTime,
    row.sessionDate,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      const t = Date.parse(c.trim());
      if (!Number.isNaN(t)) return t;
    }
  }
  const d = row.sessionDate?.trim() || "";
  if (!d) return 0;
  const st = (row.startTime || "12:00:00").replace(/Z$/, "").slice(0, 8);
  const t2 = Date.parse(d.includes("T") ? d : `${d.slice(0, 10)}T${st}`);
  return Number.isNaN(t2) ? 0 : t2;
}

function AdminSessionsTable({
  rows,
  emptyMessage,
  onView,
  onEdit,
  onApprovePayment,
  onRejectPayment,
  busyPaymentId,
  pendingBySessionId,
}: {
  rows: AdminSessionRow[];
  emptyMessage: string;
  onView: (row: AdminSessionRow) => void;
  onEdit: (row: AdminSessionRow) => void;
  onApprovePayment: (row: AdminSessionRow, payment: SessionPendingPayment) => void;
  onRejectPayment: (row: AdminSessionRow, payment: SessionPendingPayment) => void;
  busyPaymentId: string | null;
  pendingBySessionId: Map<string, PendingPayment>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className={SESSION_TABLE_HEAD}>
            <th className="px-4 py-3">Session</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => {
            const pendingPayment = resolvePendingPaymentForSession(row.raw, row.id, pendingBySessionId);
            const paymentBusy = Boolean(pendingPayment && busyPaymentId === pendingPayment.id);
            return (
            <tr key={row.id} className={SESSION_TABLE_ROW}>
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.readableId}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatSessionScheduleDate(row)}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {formatTime12(row.startTime)} – {formatTime12(row.endTime)}
              </td>
              <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">৳{row.priceBdt}</td>
              <td className="px-4 py-3">
                <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", badgeTone(row.status))}>
                  {formatStatus(row.status)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    title="View"
                    aria-label="View session"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:hover:bg-slate-800"
                    onClick={() => onView(row)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Edit"
                    aria-label="Edit session"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-600 dark:hover:bg-slate-800"
                    onClick={() => onEdit(row)}
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  {pendingPayment ? (
                    <>
                      <button
                        type="button"
                        title="Approve payment"
                        aria-label="Approve payment"
                        disabled={paymentBusy}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
                        onClick={() => onApprovePayment(row, pendingPayment)}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Reject payment"
                        aria-label="Reject payment"
                        disabled={paymentBusy}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
                        onClick={() => onRejectPayment(row, pendingPayment)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          );
          })}
          {!rows.length ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function AdminSessionRequestsPanel() {
  const [rows, setRows] = useState<AdminSessionRow[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalRequested: 0,
    totalCompleted: 0,
    totalPending: 0,
    totalCanceled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [mentors, setMentors] = useState<Record<string, unknown>[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<AdminSessionRow | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [sessionTab, setSessionTab] = useState<SessionDetailTab>("overview");
  const [mentorDetail, setMentorDetail] = useState<Record<string, unknown> | null>(null);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [paymentRejectReason, setPaymentRejectReason] = useState("");
  const [pendingBySessionId, setPendingBySessionId] = useState<Map<string, PendingPayment>>(new Map());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((toastId: number) => {
    setToasts((current) => current.filter((item) => item.id !== toastId));
  }, []);

  type PushToastOptions = {
    durationMs?: number | null;
    actions?: ToastAction[];
  };

  const pushToast = useCallback(
    (variant: ToastVariant, message: string, options?: PushToastOptions) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const hasActions = Boolean(options?.actions?.length);
      const explicit = options?.durationMs;
      const autoDismissMs =
        explicit === null ? null : explicit === undefined ? (hasActions ? null : 3000) : explicit;

      const actions: ToastAction[] | undefined = options?.actions?.map((a) => ({
        label: a.label,
        variant: a.variant,
        onClick: () => {
          try {
            a.onClick();
          } finally {
            dismissToast(id);
          }
        },
      }));

      setToasts((current) => [...current, { id, variant, message, actions }]);

      if (typeof autoDismissMs === "number" && autoDismissMs > 0) {
        window.setTimeout(() => dismissToast(id), autoDismissMs);
      }
    },
    [dismissToast]
  );

  const loadPendingPayments = useCallback(async () => {
    try {
      const map = await fetchPendingPaymentsBySessionId();
      setPendingBySessionId(map);
      return map;
    } catch {
      setPendingBySessionId(new Map());
      return new Map<string, PendingPayment>();
    }
  }, []);

  const loadList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [sessionsResult] = await Promise.all([
        listAdminSessions({ limit: ADMIN_SESSIONS_LIST_MAX_LIMIT }),
        loadPendingPayments(),
      ]);
      const { rows: next, statsComputed } = sessionsResult;
      setRows(next);
      setStats(statsComputed);
      setPage(1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load sessions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [loadPendingPayments]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadList();
    });
  }, [loadList]);

  const loadDetail = useCallback(async (sessionId: string) => {
    setDetailError(null);
    setDetailLoading(true);
    setDetail(null);
    setMentors([]);
    try {
      const [d, m] = await Promise.all([
        getAdminSession(sessionId),
        getAdminSessionEligibleMentors(sessionId),
        loadPendingPayments(),
      ]);
      setDetail(d);
      setMentors(m);
    } catch (e) {
      setDetailError(e instanceof ApiError ? e.message : "Failed to load session.");
    } finally {
      setDetailLoading(false);
    }
  }, [loadPendingPayments]);

  const openSessionDetail = useCallback(
    (sessionId: string) => {
      setSessionTab("overview");
      setDetailId(sessionId);
      void loadDetail(sessionId);
    },
    [loadDetail]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => rows.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE),
    [rows, clampedPage]
  );

  const latestSessionsPreview = useMemo(() => {
    return [...rows].sort((a, b) => parseRowSortTime(b) - parseRowSortTime(a)).slice(0, 3);
  }, [rows]);

  const editForm = useFormik({
    enableReinitialize: true,
    initialValues: {
      status: editRow?.status ?? "",
      sessionDate: editRow?.sessionDate ?? "",
      startTime: editRow?.startTime?.slice(0, 5) ?? "",
      endTime: editRow?.endTime?.slice(0, 5) ?? "",
      priceBdt: editRow?.priceBdt ?? "",
      problemDescription: editRow?.problemDescription ?? "",
    },
    onSubmit: async (values) => {
      if (!editRow) return;
      setActionMessage(null);
      try {
        await patchAdminSession(editRow.id, {
          status: values.status.trim() || undefined,
          sessionDate: values.sessionDate.trim() || undefined,
          startTime: values.startTime.trim() || undefined,
          endTime: values.endTime.trim() || undefined,
          priceBdt: values.priceBdt.trim() || undefined,
          problemDescription: values.problemDescription.trim() || undefined,
        });
        setActionMessage("Session updated.");
        setEditRow(null);
        await loadList();
      } catch (e) {
        setActionMessage(e instanceof ApiError ? e.message : "Update failed.");
      }
    },
  });

  const resolvePaymentId = useCallback(
    (paymentId: string, sessionId?: string) => {
      if (sessionId) {
        const fromMap = pendingBySessionId.get(sessionId);
        if (fromMap?.id) return fromMap.id;
      }
      return paymentId;
    },
    [pendingBySessionId],
  );

  const runApprovePayment = useCallback(
    async (paymentId: string, sessionId?: string) => {
      const resolvedId = resolvePaymentId(paymentId, sessionId);
      setBusyPaymentId(resolvedId);
      try {
        await approveAdminPayment(resolvedId);
        pushToast("success", "Payment approved. The student can join when the session is ready.");
        if (sessionId && detailId === sessionId) void loadDetail(sessionId);
        await loadList();
      } catch (e) {
        pushToast("danger", e instanceof ApiError ? e.message : "Payment approval failed.");
      } finally {
        setBusyPaymentId(null);
      }
    },
    [detailId, loadDetail, loadList, pushToast, resolvePaymentId]
  );

  const runRejectPayment = useCallback(
    async (paymentId: string, reason: string, sessionId?: string) => {
      const resolvedId = resolvePaymentId(paymentId, sessionId);
      setBusyPaymentId(resolvedId);
      try {
        await rejectAdminPayment(resolvedId, reason);
        pushToast("success", "Payment rejected. The student has been notified.");
        setPaymentRejectReason("");
        if (sessionId && detailId === sessionId) void loadDetail(sessionId);
        await loadList();
      } catch (e) {
        pushToast("danger", e instanceof ApiError ? e.message : "Payment rejection failed.");
      } finally {
        setBusyPaymentId(null);
      }
    },
    [detailId, loadDetail, loadList, pushToast, resolvePaymentId]
  );

  const handleTableApprovePayment = useCallback(
    (row: AdminSessionRow, payment: SessionPendingPayment) => {
      pushToast("warning", `Approve payment for ${row.readableId}? (৳${payment.amountBdt || "—"})`, {
        actions: [
          { label: "Cancel", variant: "secondary", onClick: () => {} },
          { label: "Approve payment", variant: "primary", onClick: () => void runApprovePayment(payment.id, row.id) },
        ],
      });
    },
    [pushToast, runApprovePayment]
  );

  const handleTableRejectPayment = useCallback(
    (row: AdminSessionRow, payment: SessionPendingPayment) => {
      const reason = window.prompt(
        `Reject payment for ${row.readableId}?\nReason (shown to student):`,
        paymentRejectReason || "Payment could not be verified."
      );
      if (reason === null) return;
      void runRejectPayment(payment.id, reason, row.id);
    },
    [paymentRejectReason, runRejectPayment]
  );

  const closeSessionView = useCallback(() => {
    setDetailId(null);
    setDetail(null);
    setMentors([]);
    setDetailError(null);
    setMentorDetail(null);
    setSessionTab("overview");
    setPaymentRejectReason("");
  }, []);

  const paymentBlock = detail ? extractPaymentBlock(detail) : null;
  const detailPendingPayment = useMemo(
    () => (detail && detailId ? resolvePendingPaymentForSession(detail, detailId, pendingBySessionId) : null),
    [detail, detailId, pendingBySessionId]
  );
  const detailPaymentBusy = Boolean(detailPendingPayment && busyPaymentId === detailPendingPayment.id);

  const sessionTitle =
    detail && !detailLoading
      ? String(detail.readableId ?? detail.sessionReadableId ?? detail.bookingCode ?? "Session").slice(0, 64)
      : "Session";

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Super admin</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">Session requests</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Monitor live session demand, approvals, and payouts.
          </p>
        </div>
        <Button type="button" variant="secondary" iconLeft={RefreshCw} onClick={() => void loadList()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {actionMessage ? (
        <p className="shrink-0 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-100">
          {actionMessage}
        </p>
      ) : null}

      <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-200 pb-1 dark:border-slate-700">
        <button type="button" className={tabTriggerClass(mainTab === "overview")} onClick={() => setMainTab("overview")}>
          Overview
        </button>
        <button type="button" className={tabTriggerClass(mainTab === "sessions")} onClick={() => setMainTab("sessions")}>
          All sessions
          <span className="ml-1.5 tabular-nums opacity-80">({rows.length})</span>
        </button>
      </div>

      {mainTab === "overview" ? (
        <div className="space-y-4">
          <div className="grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total requested" value={stats.totalRequested} icon={ClipboardList} tone="sky" />
            <StatCard label="Total completed" value={stats.totalCompleted} icon={CheckCircle2} tone="emerald" />
            <StatCard label="Total pending" value={stats.totalPending} icon={CalendarClock} tone="amber" />
            <StatCard label="Total canceled" value={stats.totalCanceled} icon={XCircle} tone="rose" />
          </div>
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Latest sessions</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Three most recent sessions by schedule time (newest first).
                </p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => setMainTab("sessions")}>
                View all
              </Button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 px-5 py-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : null}
            {error && !loading ? <p className="px-5 py-6 text-sm text-rose-600">{error}</p> : null}
            {!loading && !error ? (
              <div className="pb-2 sm:px-1">
                <AdminSessionsTable
                  rows={latestSessionsPreview}
                  emptyMessage="No sessions loaded yet."
                  onView={(row) => openSessionDetail(row.id)}
                  onEdit={(row) => {
                    setActionMessage(null);
                    setEditRow(row);
                  }}
                  onApprovePayment={handleTableApprovePayment}
                  onRejectPayment={handleTableRejectPayment}
                  busyPaymentId={busyPaymentId}
                  pendingBySessionId={pendingBySessionId}
                />
              </div>
            ) : null}
          </article>
        </div>
      ) : null}

      {mainTab === "sessions" ? (
        <article className="flex max-h-[min(75vh,720px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">All session requests</h3>
          <span className="text-xs font-medium text-slate-500">{rows.length} loaded</span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 px-5 py-10 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
          </div>
        ) : null}
        {error ? <p className="px-5 py-6 text-sm text-rose-600">{error}</p> : null}
        {!loading && !error ? (
          <>
            <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
              <AdminSessionsTable
                rows={paged}
                emptyMessage="No sessions found."
                onView={(row) => openSessionDetail(row.id)}
                onEdit={(row) => {
                  setActionMessage(null);
                  setEditRow(row);
                }}
                onApprovePayment={handleTableApprovePayment}
                onRejectPayment={handleTableRejectPayment}
                busyPaymentId={busyPaymentId}
                pendingBySessionId={pendingBySessionId}
              />
            </div>
            <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
              <Pagination
                page={clampedPage}
                totalPages={totalPages}
                totalItems={rows.length}
                pageSize={PAGE_SIZE}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        ) : null}
        </article>
      ) : null}

      <Modal open={Boolean(detailId)} onClose={closeSessionView} className="max-w-4xl rounded-2xl">
        <div className="max-h-[min(85vh,760px)] overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Session request</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-50">{sessionTitle}</h3>
            </div>
            {detail && !detailLoading ? (
              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", badgeTone(String(detail.status ?? "")))}>
                {formatStatus(String(detail.status ?? "unknown"))}
              </span>
            ) : null}
          </div>

          {detailLoading ? (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading session…
            </p>
          ) : null}

          {detailError ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {detailError}
            </div>
          ) : null}

          {detail && !detailLoading ? (
            <div className="mt-5 space-y-4">
              {detailPendingPayment ? (
                <PaymentReviewActions
                  payment={detailPendingPayment}
                  busy={detailPaymentBusy}
                  rejectReason={paymentRejectReason}
                  onRejectReasonChange={setPaymentRejectReason}
                  onApprove={() => void runApprovePayment(detailPendingPayment.id, detailId ?? undefined)}
                  onReject={() =>
                    void runRejectPayment(detailPendingPayment.id, paymentRejectReason, detailId ?? undefined)
                  }
                />
              ) : null}

              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1 dark:border-slate-700">
                <button type="button" className={tabTriggerClass(sessionTab === "overview")} onClick={() => setSessionTab("overview")}>
                  Overview
                </button>
                <button type="button" className={tabTriggerClass(sessionTab === "payment")} onClick={() => setSessionTab("payment")}>
                  Payment
                </button>
                <button type="button" className={tabTriggerClass(sessionTab === "mentors")} onClick={() => setSessionTab("mentors")}>
                  Eligible mentors
                  <span className="ml-1.5 tabular-nums opacity-80">({mentors.length})</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900">
                {sessionTab === "overview" ? <SessionDetailOverview detail={detail} /> : null}
                {sessionTab === "payment" ? (
                  <div className="space-y-4">
                    {paymentBlock ? (
                      <KeyValueGrid data={sanitizeForDisplay(paymentBlock)} title="Payment details" />
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                        No structured payment block on this session. Related amounts may still appear under Overview.
                      </p>
                    )}
                  </div>
                ) : null}
                {sessionTab === "mentors" ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Mentors matched to this session&apos;s expertise.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                            <th className="px-3 py-2.5">Name</th>
                            <th className="min-w-[140px] px-3 py-2.5">Department</th>
                            <th className="min-w-[180px] px-3 py-2.5">Email</th>
                            <th className="min-w-[130px] px-3 py-2.5">Phone</th>
                            <th className="px-3 py-2.5 text-center">View</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {mentors.map((m, idx) => (
                            <tr key={idx} className="bg-white dark:bg-slate-900">
                              <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100">{mentorRowLabel(m, idx)}</td>
                              <td className="max-w-[200px] truncate px-3 py-2.5 text-slate-700 dark:text-slate-200">
                                {mentorDepartmentLabel(m) || "—"}
                              </td>
                              <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-600 dark:text-slate-300">
                                {mentorRowEmail(m) || "—"}
                              </td>
                              <td className="max-w-[160px] truncate px-3 py-2.5 text-slate-600 dark:text-slate-300">
                                {mentorRowPhone(m) || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  title="View mentor details"
                                  aria-label={`View details for ${mentorRowLabel(m, idx)}`}
                                  className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:hover:bg-slate-800"
                                  onClick={() => setMentorDetail(m)}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {!mentors.length ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                                No eligible mentors returned for this session.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal open={Boolean(mentorDetail)} onClose={() => setMentorDetail(null)} className="max-w-2xl rounded-2xl">
        {mentorDetail ? <MentorDetailModalContent mentor={mentorDetail} onClose={() => setMentorDetail(null)} /> : null}
      </Modal>

      <Modal open={Boolean(editRow)} onClose={() => setEditRow(null)} className="max-w-lg rounded-2xl">
        <div className="w-full p-6">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit session</h4>
          {editRow ? (
            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">Reference: {editRow.readableId}</p>
          ) : null}
          <p className="mt-1 text-sm text-slate-500">Update fields your API accepts for this booking.</p>
          <form className="mt-4 grid gap-3" onSubmit={editForm.handleSubmit}>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Status</span>
              <input name="status" value={editForm.values.status} onChange={editForm.handleChange} className="h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Session date</span>
              <input type="date" name="sessionDate" value={editForm.values.sessionDate} onChange={editForm.handleChange} className="h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Start</span>
                <input type="time" name="startTime" value={editForm.values.startTime} onChange={editForm.handleChange} className="h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">End</span>
                <input type="time" name="endTime" value={editForm.values.endTime} onChange={editForm.handleChange} className="h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" />
              </label>
            </div>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Price (BDT)</span>
              <input name="priceBdt" value={editForm.values.priceBdt} onChange={editForm.handleChange} className="h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Problem / notes</span>
              <textarea name="problemDescription" rows={3} value={editForm.values.problemDescription} onChange={editForm.handleChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditRow(null)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </div>
      </Modal>
      <ToastCenter toasts={toasts} />
    </div>
  );
}
