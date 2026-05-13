"use client";

import { useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

const faqItems = [
  {
    question: "How long does the registration process take?",
    answer:
      "Most learners complete registration in under five minutes. Identity checks and account activation are typically fast.",
  },
  {
    question: "Is my data safe and compliant?",
    answer:
      "Yes. We use secure API communication, access controls, and privacy-first account handling across onboarding and dashboard actions.",
  },
  {
    question: "Can I choose mentors based on my course?",
    answer:
      "Absolutely. You can select department, course, topic, and then book sessions with mentors who match your learning goals.",
  },
  {
    question: "What happens if I miss a session?",
    answer:
      "You can review your session status from the dashboard. For schedule conflicts, update early and follow the platform session policy.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="px-4 py-12 transition-colors dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-semibold text-sky-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">
            <CircleHelp className="h-3.5 w-3.5 text-blue-500" />
            FAQ
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Questions, answered <span className="text-blue-500">with care.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300 sm:text-base">
            Everything you need to know before getting started. Can&apos;t find what you&apos;re looking for?
            Our team is one message away.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <article
                key={item.question}
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
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 dark:text-slate-300",
                      isOpen && "rotate-180 text-amber-500"
                    )}
                  />
                </button>

                {isOpen ? (
                  <div className="border-t border-slate-100 px-6 pb-6 pt-4 dark:border-slate-700 sm:px-8">
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">{item.answer}</p>
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

