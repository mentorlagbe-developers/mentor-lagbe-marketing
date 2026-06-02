"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { CertificationBooking, listMyCertificationBookings } from "@/lib/certifications-api";

export function CertificationsSection() {
  const [items, setItems] = useState<CertificationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listMyCertificationBookings();
        if (!cancelled) setItems(data.items);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Could not load certification bookings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Certifications</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your certification exam bookings, payment status, and voucher fulfillment.
        </p>
        <Link href="/certifications" className="mt-3 inline-flex text-sm font-medium text-sky-600 hover:underline">
          Browse all certification exams
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-700">
          My certification bookings
        </div>
        {loading ? <p className="p-4 text-sm text-slate-500">Loading...</p> : null}
        {error ? <p className="p-4 text-sm text-rose-600">{error}</p> : null}
        {!loading && !error ? (
          items.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                    <th className="px-4 py-2">Booking</th>
                    <th className="px-4 py-2">Exam</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-2">{item.readableId}</td>
                      <td className="px-4 py-2">
                        <p className="font-medium">{item.examTitle}</p>
                        <p className="text-xs text-slate-500">{item.examCode}</p>
                      </td>
                      <td className="px-4 py-2">৳{item.amountBdt}</td>
                      <td className="px-4 py-2 capitalize">{item.status.replace(/_/g, " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 text-sm text-slate-500">You have not booked any certification exam yet.</p>
          )
        ) : null}
      </div>
    </section>
  );
}
