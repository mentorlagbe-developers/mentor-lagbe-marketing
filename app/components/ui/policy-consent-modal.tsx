"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { PolicyConsentConfig, PolicyConsentTone } from "@/lib/policy-consents";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

type PolicyConsentModalProps = {
  open: boolean;
  config: PolicyConsentConfig;
  onClose: () => void;
  onContinue: () => void | Promise<void>;
  busy?: boolean;
  errorMessage?: string | null;
};

const toneHeader: Record<PolicyConsentTone, string> = {
  brand:
    "border-brand-primary/25 bg-linear-to-br from-sky-50 via-white to-sky-50/80 dark:border-brand-primary/30 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/40",
  neutral: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60",
  warning:
    "border-amber-200 bg-linear-to-br from-amber-50 via-white to-amber-50/70 dark:border-amber-800/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30",
};

const toneIcon: Record<PolicyConsentTone, string> = {
  brand: "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-sky-300",
  neutral: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export function PolicyConsentModal({
  open,
  config,
  onClose,
  onContinue,
  busy = false,
  errorMessage = null,
}: PolicyConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const tone = config.tone ?? "brand";

  useEffect(() => {
    if (!open) {
      setAgreed(false);
    }
  }, [open, config.id]);

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg rounded-2xl">
      <div className="flex max-h-[min(85vh,640px)] flex-col overflow-hidden">
        <div className={cn("shrink-0 border-b px-5 py-4 sm:px-6", toneHeader[tone])}>
          <div className="flex items-start gap-3">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneIcon[tone])}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              {config.eyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {config.eyebrow}
                </p>
              ) : null}
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{config.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{config.intro}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {config.sections.map((section, index) => (
            <section
              key={`${config.id}-section-${index}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
            >
              {section.title ? (
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{section.title}</h3>
              ) : null}
              {section.body ? (
                <p className={cn("text-sm leading-relaxed text-slate-600 dark:text-slate-300", section.title && "mt-1.5")}>
                  {section.body}
                </p>
              ) : null}
              {section.bullets?.length ? (
                <ul className={cn("space-y-2 text-sm text-slate-600 dark:text-slate-300", section.title && "mt-2")}>
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2 leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/50">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/30"
            />
            <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{config.checkboxLabel}</span>
          </label>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {config.cancelLabel ?? "Cancel"}
          </Button>
          <Button type="button" disabled={!agreed || busy} onClick={() => void onContinue()}>
            {busy ? "Please wait…" : config.continueLabel ?? "Continue"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
