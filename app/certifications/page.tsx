"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Filter, GraduationCap, Search, Sparkles } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  CertificationCategory,
  CertificationExamCard,
  CertificationVendor,
  listCertificationCategories,
  listCertificationExams,
  listCertificationVendors,
} from "@/lib/certifications-api";
import type { AuthUser } from "@/lib/mock-auth";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import { CertificationExamCardView } from "@/app/certifications/_components/certification-exam-card";
import { LandingHeader } from "@/app/sections/landing/landing-header";
import Footer from "@/app/components/ui/Footer";

type PriceFilter = "all" | "under_5k" | "between_5k_10k" | "above_10k";
type SortFilter = "newly_published" | "featured_first" | "price_low_to_high" | "price_high_to_low";

export default function CertificationsCatalogPage() {
  const router = useRouter();
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);
  const [items, setItems] = useState<CertificationExamCard[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("all"); // vendor slug
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState<PriceFilter>("all");
  const [sortBy, setSortBy] = useState<SortFilter>("newly_published");
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [certificateOnly, setCertificateOnly] = useState(false);
  const [trainingOnly, setTrainingOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [vendors, setVendors] = useState<CertificationVendor[]>([]);
  const [categories, setCategories] = useState<CertificationCategory[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [examData, vendorData, categoryData] = await Promise.all([
          listCertificationExams(
            {
              page: String(page),
              limit: String(limit),
              ...(selectedVendor !== "all" ? { vendorSlug: selectedVendor } : {}),
              ...(selectedCategory !== "all" ? { categoryId: selectedCategory } : {}),
              ...(selectedLevel !== "all" ? { level: selectedLevel } : {}),
              ...(search.trim() ? { search: search.trim() } : {}),
              ...(selectedPrice === "under_5k" ? { maxPrice: "4999" } : {}),
              ...(selectedPrice === "between_5k_10k" ? { minPrice: "5000", maxPrice: "10000" } : {}),
              ...(selectedPrice === "above_10k" ? { minPrice: "10001" } : {}),
              ...(onSaleOnly ? { onSaleOnly: "true" } : {}),
              ...(certificateOnly ? { certificateAvailable: "true" } : {}),
              ...(trainingOnly ? { includesTraining: "true" } : {}),
              ...(featuredOnly ? { isFeatured: "true" } : {}),
              sort: sortBy,
            }
          ),
          listCertificationVendors(),
          listCertificationCategories(),
        ]);
        if (!cancelled) {
          setItems(examData.items);
          setTotal(examData.total ?? examData.items.length);
          setLevels(examData.filters?.levels ?? []);
          setVendors(Array.isArray(vendorData) ? vendorData.filter((v) => v.isActive !== false) : []);
          setCategories(Array.isArray(categoryData) ? categoryData.filter((c) => c.isActive !== false) : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Could not load certification exams.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    page,
    limit,
    selectedVendor,
    selectedCategory,
    selectedLevel,
    selectedPrice,
    sortBy,
    onSaleOnly,
    certificateOnly,
    trainingOnly,
    featuredOnly,
    search,
  ]);

  const heroStats = useMemo(
    () => [
      { label: "Certification exams", value: String(total || items.length) },
      { label: "Vendors", value: String(vendors.length) },
      { label: "Categories", value: String(categories.length) },
    ],
    [total, items.length, vendors.length, categories.length]
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="min-h-screen bg-slate-50/60 dark:bg-slate-950">
      <LandingHeader
        user={user}
        onAuthClick={() => router.push("/?auth=login")}
        onDashboardClick={() => router.push("/dashboard")}
        onContactClick={() => router.push("/#contact")}
      />
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="border-b border-slate-200 bg-linear-to-br from-sky-50 via-white to-indigo-50/50 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
      >
        <div className="mx-auto max-w-352 px-3 py-7 sm:px-4 lg:px-6">
          <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
              className="max-w-2xl space-y-4"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:border-sky-800 dark:bg-slate-900/60 dark:text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                Certification Marketplace
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Global professional certifications, now affordable for every serious learner
              </h1>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                Mentor Lagbe helps you prepare and certify with trusted vendor exams at student-friendly pricing. Get exam vouchers, guided training, and practical materials in one place.
              </p>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                <p className="font-semibold">Save up to 60% on professional certification exams.</p>
                <p className="mt-0.5 text-xs opacity-90">
                  We negotiate discounted offers so students can build career-ready credentials without high exam costs.
                </p>
              </div>

              <div className="grid w-full max-w-lg grid-cols-3 gap-2">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 18, scale: 0.98 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="relative mx-auto w-full max-w-xl"
            >
              <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-sky-200/55 blur-2xl dark:bg-sky-900/35" />
              <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-indigo-200/45 blur-2xl dark:bg-indigo-900/35" />
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src="/images/certification-img.jpg"
                    alt="Mentor guiding a student toward certification success"
                    width={980}
                    height={640}
                    className="h-[280px] w-full object-cover sm:h-[320px]"
                    priority
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/70 via-slate-900/25 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-100">Career-focused outcomes</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Learn faster, pay less, and certify with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <section className="mx-auto max-w-352 px-3 py-6 sm:px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-4 flex items-center justify-between gap-3"
        >
          <div className="relative w-full max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by exam code, title, vendor, or category..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
            <GraduationCap className="h-4 w-4 text-slate-400" />
            <span>{total} total results</span>
          </div>
        </motion.div>

        {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">{error}</p> : null}

        <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-fit rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm ring-1 ring-slate-100 lg:sticky lg:top-20 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filter certifications</h2>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vendor
                <select
                  value={selectedVendor}
                  onChange={(e) => {
                    setSelectedVendor(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="all">All vendors</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.slug}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Level
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal capitalize dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="all">All levels</option>
                  {levels.map((level) => (
                    <option key={level} value={level} className="capitalize">
                      {level.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sort by
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortFilter);
                    setPage(1);
                  }}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="newly_published">Newest</option>
                  <option value="featured_first">Featured first</option>
                  <option value="price_low_to_high">Price low to high</option>
                  <option value="price_high_to_low">Price high to low</option>
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price range
                <select
                  value={selectedPrice}
                  onChange={(e) => {
                    setSelectedPrice(e.target.value as PriceFilter);
                    setPage(1);
                  }}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="all">All prices</option>
                  <option value="under_5k">Under ৳5,000</option>
                  <option value="between_5k_10k">৳5,000 - ৳10,000</option>
                  <option value="above_10k">Above ৳10,000</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => {
                    setFeaturedOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Featured exams only
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={onSaleOnly}
                  onChange={(e) => {
                    setOnSaleOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                On sale only
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={certificateOnly}
                  onChange={(e) => {
                    setCertificateOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Certificate available
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={trainingOnly}
                  onChange={(e) => {
                    setTrainingOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Includes training
              </label>

              <button
                type="button"
                onClick={() => {
                  setSelectedVendor("all");
                  setSelectedCategory("all");
                  setSelectedLevel("all");
                  setSelectedPrice("all");
                  setSortBy("newly_published");
                  setOnSaleOnly(false);
                  setCertificateOnly(false);
                  setTrainingOnly(false);
                  setFeaturedOnly(false);
                  setSearch("");
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Reset filters
              </button>
            </div>
          </motion.aside>

          <section>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  />
                ))}
              </div>
            ) : items.length ? (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.06 } },
                }}
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
                {items.map((exam) => (
                  <motion.div
                    key={exam.id}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  >
                    <CertificationExamCardView exam={exam} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No certification found</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try changing filters or search with a different keyword.
                </p>
              </div>
            )}

            {!loading && items.length ? (
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
