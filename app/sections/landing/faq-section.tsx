"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/locale/locale-provider";
import type { MessageKey } from "@/lib/locale/messages";

type FaqItem = { q: MessageKey; a: MessageKey };

const baseFaqKeys: FaqItem[] = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
];

const comingSoonFaq: FaqItem = { q: "faq.comingSoonQ", a: "faq.comingSoonA" };

export function FaqSection({ comingSoon = false }: { comingSoon?: boolean }) {
  const t = useT();
  const faqItems = useMemo(
    () => (comingSoon ? [comingSoonFaq, ...baseFaqKeys] : baseFaqKeys),
    [comingSoon]
  );
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="px-4 py-12 transition-colors dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-semibold text-sky-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">
            <CircleHelp className="h-3.5 w-3.5 text-blue-500" />
            {t("faq.badge")}
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {t("faq.heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300 sm:text-base">
            {t("faq.sub")}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const question = t(item.q);
            return (
              <article
                key={item.q}
                className={cn(
                  "overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-800",
                  "hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_16px_40px_-24px_rgba(14,116,144,0.45)]",
                  isOpen && "border-sky-200 shadow-[0_20px_45px_-30px_rgba(14,116,144,0.45)]"
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-6 py-5 text-left sm:px-8"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 dark:text-slate-300",
                      isOpen && "rotate-180 text-amber-500"
                    )}
                  />
                </button>

                {isOpen ? (
                  <div className="border-t border-slate-100 px-6 pb-6 pt-4 dark:border-slate-700 sm:px-8">
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                      {t(item.a)}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
