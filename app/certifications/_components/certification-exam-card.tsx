"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Award, BookOpen, Star, Tag, Users } from "lucide-react";
import type { CertificationExamCard } from "@/lib/certifications-api";
import { getAccessToken } from "@/lib/auth-store";

function formatBdt(value: string | number) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function levelLabel(level: CertificationExamCard["level"]) {
  return level.replace(/_/g, " ");
}

type CertificationExamCardViewProps = {
  exam: CertificationExamCard;
};

export function CertificationExamCardView({ exam }: CertificationExamCardViewProps) {
  const router = useRouter();
  const hasDiscount = Boolean(exam.salePriceBdt && Number(exam.discountPercent) > 0);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-700">
      <div className="relative aspect-video overflow-hidden">
        {exam.thumbnailUrl ? (
          <Image
            src={exam.thumbnailUrl}
            alt={exam.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-sky-100 via-slate-100 to-indigo-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/55 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-900/85 dark:text-slate-200">
            {exam.vendor.name}
          </span>
          <span className="rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-white">
            {exam.examCode}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {levelLabel(exam.level)}
          </span>
          {exam.isFeatured ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Featured
            </span>
          ) : null}
        </div>
        {exam.badgeLabel ? (
          <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            {exam.badgeLabel}
          </span>
        ) : null}
      </div>

      <h3 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100">{exam.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
        {exam.shortDescription || "Official certification exam with guided preparation support."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span>{exam.studentCount}+ students</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
          <span>{exam.lessonCount} lessons</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          <span>
            {exam.ratingAverage.toFixed(1)} ({exam.ratingCount})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Award className="h-3.5 w-3.5 text-emerald-500" />
          <span>{exam.certificateAvailable ? "Certificate" : "Exam only"}</span>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatBdt(exam.salePriceBdt ?? exam.effectivePriceBdt)}
              </p>
              <p className="text-sm text-slate-400 line-through">{formatBdt(exam.originalPriceBdt)}</p>
            </div>
          ) : (
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatBdt(exam.effectivePriceBdt || exam.originalPriceBdt)}
            </p>
          )}
          {hasDiscount ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Tag className="h-3 w-3" />
              Save {exam.discountPercent}%
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            const token = getAccessToken();
            if (!token) {
              router.push("/?auth=login");
              return;
            }
            router.push(`/certifications/${exam.slug}`);
          }}
          className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:ring-offset-slate-900"
        >
          View details
        </button>
      </div>
      </div>
    </article>
  );
}
