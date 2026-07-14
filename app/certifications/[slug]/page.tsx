"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Award, BookOpen, CalendarClock, CheckCircle2, Globe2, ListChecks, ShieldCheck, Star } from "lucide-react";
import { ApiError } from "@/lib/api";
import { bookCertificationExam, CertificationExamDetail, getCertificationExam } from "@/lib/certifications-api";
import type { AuthUser } from "@/lib/mock-auth";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import { LandingHeader } from "@/app/sections/landing/landing-header";
import Footer from "@/app/components/ui/Footer";

function formatBdt(value: string | number) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function safeRating(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function CertificationDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);
  const slug = String(params.slug ?? "");

  const [exam, setExam] = useState<CertificationExamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCertificationExam(slug);
        if (!cancelled) setExam(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Could not load certification details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleBook() {
    if (!exam) return;
    if (!user) {
      router.push("/?auth=login");
      return;
    }
    if (user.role !== "student") {
      setBookingMessage("Only student accounts can book certification exams.");
      return;
    }
    setBookingMessage(null);
    try {
      const booking = await bookCertificationExam(exam.id);
      const params = new URLSearchParams();
      if (booking.id) params.set("bookingId", booking.id);
      if (booking.readableId) params.set("readableId", booking.readableId);
      if (booking.examId) params.set("examId", booking.examId);
      params.set("fromBooking", "1");
      router.push(`/dashboard/certifications?${params.toString()}`);
    } catch (e) {
      setBookingMessage(e instanceof ApiError ? e.message : "Could not create booking.");
    }
  }

  if (loading) return <main className="mx-auto max-w-5xl p-6 text-sm text-slate-500">Loading...</main>;
  if (error || !exam) {
    return (
      <main className="mx-auto max-w-5xl space-y-3 p-6">
        <p className="text-sm text-rose-600">{error ?? "Certification exam not found."}</p>
        <Link href="/certifications" className="text-sm text-sky-600 underline">
          Back to certifications
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 dark:bg-slate-950">
      <LandingHeader
        user={user}
        onAuthClick={() => router.push("/?auth=login")}
        onDashboardClick={() => router.push("/dashboard")}
        onContactClick={() => router.push("/#contact")}
      />
      <div className="border-b border-slate-200 bg-linear-to-br from-sky-50 via-white to-indigo-50/50 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-352 px-3 py-7 sm:px-4 lg:px-6">
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/certifications" className="hover:text-sky-600 dark:hover:text-sky-400">
              Certifications
            </Link>
            <span>/</span>
            <span>{exam.examCode}</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                  {exam.vendor.name}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {exam.level.replace(/_/g, " ")}
                </span>
                {exam.isFeatured ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    Featured
                  </span>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                {exam.title}
              </h1>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                {exam.overview || exam.shortDescription}
              </p>
            </div>

            <div className="grid min-w-[220px] grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{exam.studentCount}+</p>
                <p className="text-[11px] text-slate-500">Students</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{exam.lessonCount}</p>
                <p className="text-[11px] text-slate-500">Lessons</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{safeRating(exam.ratingAverage).toFixed(1)}</p>
                <p className="text-[11px] text-slate-500">Rating</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{exam.ratingCount}</p>
                <p className="text-[11px] text-slate-500">Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-352 gap-6 px-3 py-7 sm:px-4 lg:grid-cols-[1.7fr_1fr] lg:px-6">
        <section className="space-y-5">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Certificate</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {exam.certificateAvailable ? "Official certificate included" : "Certificate details on request"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <BookOpen className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-400" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Training</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {exam.includesTraining ? "Training support included" : "Voucher-focused preparation"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Globe2 className="mt-0.5 h-4 w-4 text-violet-600 dark:text-violet-400" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Language</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{exam.languages || "English"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarClock className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Format</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {exam.examFormat || "Vendor-standard exam format"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Overview</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {exam.overview || exam.shortDescription || "Detailed exam overview will be published soon."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Prerequisites</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {exam.prerequisites || "No strict prerequisite. Basic subject knowledge is recommended."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Study materials</h2>
            </div>
            {exam.materials?.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {exam.materials.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.description || "Structured material for exam readiness."}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] capitalize text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {item.materialType.replace(/_/g, " ")}
                      </span>
                      {item.isPreview ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Preview
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Locked until booked</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Materials will be published soon.</p>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Exam code</p>
          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{exam.examCode}</p>

          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pricing</p>
            <div className="mt-2 flex items-end gap-2">
              {exam.salePriceBdt ? (
                <>
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {formatBdt(exam.salePriceBdt)}
                  </span>
                  <span className="pb-1 text-sm text-slate-400 line-through">{formatBdt(exam.originalPriceBdt)}</span>
                </>
              ) : (
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {formatBdt(exam.originalPriceBdt)}
                </span>
              )}
            </div>
            {exam.salePriceBdt ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Star className="h-3 w-3" />
                Discount {exam.discountPercent}% applied
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void handleBook()}
            className="mt-5 w-full rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Book certification exam
          </button>

          {bookingMessage ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              {bookingMessage}
            </p>
          ) : null}

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300">What happens next?</p>
            <ul className="mt-2 space-y-1.5">
              <li>1. Booking is created instantly</li>
              <li>2. Complete payment from dashboard</li>
              <li>3. Access materials and exam instructions</li>
            </ul>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/certifications" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Back to list
            </Link>
            {exam.category?.name ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                <Award className="h-3 w-3" />
                {exam.category.name}
              </span>
            ) : null}
          </div>
        </aside>
      </div>
      <Footer />
    </main>
  );
}
