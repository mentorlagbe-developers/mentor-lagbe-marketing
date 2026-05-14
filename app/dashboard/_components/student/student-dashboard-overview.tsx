"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { BookOpenCheck, BriefcaseBusiness, Cpu } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { StudentHeroSlider, type StudentHeroSlide } from "@/app/dashboard/_components/student/student-hero-slider";
import { StudentCourseTable } from "@/app/dashboard/_components/student/student-course-table";
import { StudentLearningProgress } from "@/app/dashboard/_components/student/student-learning-progress";
import { StudentQuickStats, type StudentStatItem } from "@/app/dashboard/_components/student/student-quick-stats";
import { StudentUpcomingSessions } from "@/app/dashboard/_components/student/student-upcoming-sessions";
import {
  formatNextSessionDateLine,
  formatNextSessionTimeRange,
  pickNextUpcomingBooking,
} from "@/app/dashboard/_components/student/student-session-utils";
import { useNotifications } from "@/lib/notifications-context";

type BookingRecord = {
  id: string;
  readableId: string;
  status: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  courseId?: string | null;
  customTopicName?: string | null;
  topicId?: string | null;
  topicName?: string | null;
  mentorId?: string | null;
  createdAt?: string;
};

function isUuidLike(value: string) {
  const normalized = value.trim();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized) ||
    /^[0-9a-f]{32}$/i.test(normalized)
  );
}

function getReadableText(value?: string | null) {
  if (!value) return "";
  const normalized = value.trim();
  if (!normalized || isUuidLike(normalized)) return "";
  return normalized;
}

function getReadableSessionId(item: Record<string, unknown>) {
  const candidates = [
    item.readableId,
    item.sessionReadableId,
    item.bookingReadableId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() && !isUuidLike(candidate.trim())) {
      return candidate.trim();
    }
  }
  return "N/A";
}

function getDirectTopicName(item: Record<string, unknown>) {
  const directCandidates = [
    item.topicName,
    item.topicTitle,
    item.subjectName,
  ];
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  if (item.topic && typeof item.topic === "object") {
    const topicRecord = item.topic as Record<string, unknown>;
    const nestedCandidates = [topicRecord.name, topicRecord.title, topicRecord.label];
    for (const candidate of nestedCandidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }
  return "";
}

const slides: StudentHeroSlide[] = [
  {
    id: "cse-core-concepts",
    title: "CSE Core Concepts Sprint",
    subtitle: "Master Data Structures, OOP, and DBMS with semester-focused live classes.",
    ctaLabel: "Start Module",
    ctaIcon: Cpu,
    ctaValue: "৳ 999",
    badge: "70% Off",
    gradientFrom: "#0f172a",
    gradientTo: "#1d4ed8",
  },
  {
    id: "bba-case-lab",
    title: "BBA Case Study Lab",
    subtitle: "Build business strategy, marketing, and finance decision skills with real cases.",
    ctaLabel: "Join Lab",
    ctaIcon: BriefcaseBusiness,
    ctaValue: "৳ 799",
    badge: "Live Batch",
    gradientFrom: "#1e3a8a",
    gradientTo: "#0284c7",
  },
  {
    id: "university-exam-bootcamp",
    title: "University Exam Revision Bootcamp",
    subtitle: "CSE + BBA exam prep with quick notes, problem solving, and viva guidance.",
    ctaLabel: "Enroll Today",
    ctaIcon: BookOpenCheck,
    ctaValue: "৳ 649",
    badge: "New",
    gradientFrom: "#0f766e",
    gradientTo: "#1d8cff",
  },
];

export function StudentDashboardOverview() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [topicNames, setTopicNames] = useState<Record<string, string>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { sessionAcceptedAt } = useNotifications();
  const isFirstMount = useRef(true);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  async function hydrateTopicNames(items: BookingRecord[]) {
    const courseIds = Array.from(new Set(items.map((item) => item.courseId).filter(Boolean))) as string[];
    if (!courseIds.length) {
      return;
    }
    const responses = await Promise.allSettled(
      courseIds.map((courseId) =>
        apiFetch<Array<Record<string, unknown>>>(
          `/topics?courseId=${encodeURIComponent(courseId)}`,
          { auth: true }
        )
      )
    );
    const nextTopicNames: Record<string, string> = {};
    for (const result of responses) {
      if (result.status !== "fulfilled") continue;
      for (const topic of result.value) {
        const topicId = typeof topic.id === "string" ? topic.id : "";
        const topicName =
          typeof topic.name === "string"
            ? topic.name
            : typeof topic.title === "string"
              ? topic.title
              : typeof topic.label === "string"
                ? topic.label
                : "";
        if (topicId && topicName) {
          nextTopicNames[topicId] = topicName;
        }
      }
    }
    if (Object.keys(nextTopicNames).length) {
      setTopicNames((prev) => ({ ...prev, ...nextTopicNames }));
    }
  }

  async function loadBookings() {
    setIsLoadingData(true);
    try {
      const data = await apiFetch<unknown>("/live-sessions/bookings/me", { auth: true });
      let records: Record<string, unknown>[] = [];
      if (Array.isArray(data)) {
        records = data.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
      } else if (data && typeof data === "object") {
        const source = data as Record<string, unknown>;
        const maybeItems = source.items ?? source.records ?? source.bookings ?? source.data;
        if (Array.isArray(maybeItems)) {
          records = maybeItems.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
        } else {
          records = [source];
        }
      }
      const normalized = records.map((item) => ({
        id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
        readableId: getReadableSessionId(item),
        status: typeof item.status === "string" ? item.status : "unknown",
        sessionDate: typeof item.sessionDate === "string" ? item.sessionDate : "",
        startTime: typeof item.startTime === "string" ? item.startTime : "",
        endTime: typeof item.endTime === "string" ? item.endTime : "",
        durationMinutes: typeof item.durationMinutes === "number" ? item.durationMinutes : 0,
        courseId: typeof item.courseId === "string" ? item.courseId : "",
        customTopicName: typeof item.customTopicName === "string" ? item.customTopicName : "",
        topicId: typeof item.topicId === "string" ? item.topicId : "",
        topicName: getDirectTopicName(item),
        mentorId: typeof item.mentorId === "string" ? item.mentorId : "",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
      }));
      setBookings(normalized);
      await hydrateTopicNames(normalized);
    } catch {
      setBookings([]);
      setTopicNames({});
    } finally {
      setIsLoadingData(false);
    }
  }

  // Initial load
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startTransition(() => {
        void loadBookings();
      });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only bookings fetch
  }, []);

  // Auto-refresh when a mentor accepts this student's session (real-time via Socket.io)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (sessionAcceptedAt === 0) return;
    startTransition(() => {
      void loadBookings();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionAcceptedAt]);

  const quickStats = useMemo<StudentStatItem[]>(() => {
    const totalMinutes = bookings.reduce((sum, item) => sum + item.durationMinutes, 0);
    const joinedCount = bookings.filter((item) => item.status.includes("completed")).length;
    const avgDuration = bookings.length ? Math.round(totalMinutes / bookings.length) : 0;

    const nextSession = isLoadingData ? null : pickNextUpcomingBooking(bookings, nowMs);

    const nextSessionValue = isLoadingData
      ? "Loading…"
      : nextSession
        ? formatNextSessionDateLine(nextSession.sessionDate)
        : "no session found";

    const nextSessionSubtitle =
      !isLoadingData && nextSession
        ? formatNextSessionTimeRange(nextSession.startTime, nextSession.endTime)
        : undefined;

    const nextSessionTrend = isLoadingData
      ? "Checking your schedule…"
      : nextSession
        ? getReadableText(nextSession.customTopicName) ||
          getReadableText(nextSession.topicName) ||
          (nextSession.topicId ? topicNames[nextSession.topicId] : "") ||
          "Upcoming session"
        : "Book a session to get started";

    return [
      { label: "Total Study Time", value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, trend: "From your booked sessions" },
      { label: "Joined Sessions", value: String(joinedCount), trend: `${bookings.length - joinedCount} pending updates` },
      { label: "Avg Session Duration", value: `${avgDuration} min`, trend: "Auto-calculated from history" },
      { label: "Next Session", value: nextSessionValue, subtitle: nextSessionSubtitle, trend: nextSessionTrend },
    ];
  }, [bookings, isLoadingData, nowMs, topicNames]);


  return (
    <section className="space-y-5">
      <StudentHeroSlider slides={slides} />
      <StudentQuickStats items={quickStats} />
      <div className="grid gap-4 xl:grid-cols-2">
        <StudentUpcomingSessions />
        <StudentLearningProgress />
      </div>
      <StudentCourseTable />
    </section>
  );
}
