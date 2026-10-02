"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_CONTACT } from "@/lib/site-contact";
import { useT } from "@/lib/locale/locale-provider";

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
};

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  description: string;
};

const initialState: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  description: "",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string) {
  const cleaned = phone.replace(/[^\d]/g, "");
  return cleaned.length >= 10 && cleaned.length <= 14;
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  const t = useT();
  const [form, setForm] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormState, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  function resetState() {
    setForm(initialState);
    setErrors({});
    setIsSubmitted(false);
  }

  function closeWithReset() {
    resetState();
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof ContactFormState, string>> = {};

    if (!form.name.trim() || form.name.trim().length < 3) {
      nextErrors.name = t("contact.errorName");
    }

    if (!form.email.trim() || !isValidEmail(form.email)) {
      nextErrors.email = t("contact.errorEmail");
    }

    if (!form.phone.trim() || !isValidPhone(form.phone)) {
      nextErrors.phone = t("contact.errorPhone");
    }

    if (!form.description.trim() || form.description.trim().length < 12) {
      nextErrors.description = t("contact.errorDescription");
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const subject = encodeURIComponent(`${t("contact.mailSubject")} — ${form.name.trim()}`);
    const body = encodeURIComponent(
      `Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\nPhone: ${form.phone.trim()}\n\n${form.description.trim()}`
    );
    window.location.href = `${SITE_CONTACT.emailHref}?subject=${subject}&body=${body}`;
    setIsSubmitted(true);
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay-animate fixed inset-0 z-60 flex items-center justify-center overflow-hidden bg-black/45 p-3 backdrop-blur-md sm:p-5"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        aria-label={t("contact.closeOverlay")}
        className="absolute inset-0"
        onClick={closeWithReset}
      />

      <div className="modal-pop-animate relative z-10 flex w-full max-w-5xl max-h-full min-h-0 flex-col sm:max-h-[min(540px,calc(100dvh-2.5rem))]">
        <div className="pointer-events-none absolute -left-3 -top-3 hidden h-8 w-8 rounded-full border border-white/50 bg-white/30 sm:block" />
        <div className="pointer-events-none absolute -bottom-3 -right-3 hidden h-8 w-8 rounded-full border border-white/50 bg-white/30 sm:block" />
        <div
          className={cn(
            "relative flex min-h-0 max-h-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/45 bg-white shadow-[0_30px_90px_-36px_rgba(15,23,42,0.7)] sm:rounded-[24px]",
            "max-sm:border-slate-200/80",
            "sm:rounded-[30px] sm:border-white/40 sm:bg-linear-to-br sm:from-white/50 sm:via-sky-100/20 sm:to-white/40 sm:p-1.5 sm:shadow-[0_30px_90px_-36px_rgba(14,165,233,0.45)] sm:backdrop-blur-xl"
          )}
        >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden sm:rounded-[24px] sm:border sm:border-white/45 sm:bg-white">
        <button
          type="button"
          onClick={closeWithReset}
          className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 transition hover:text-slate-800 sm:right-3 sm:top-3"
          aria-label={t("contact.close")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
          <div className="relative hidden bg-[#f4efe7] lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_42%)]" />
            <div className="relative flex h-full items-center justify-center p-8">
              <Image
                src="/images/live-img.svg"
                alt={t("contact.imageAlt")}
                width={450}
                height={380}
                className="h-auto w-full max-w-md object-contain"
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col justify-center bg-[#f8f8f8] px-4 py-3.5 pr-11 sm:overflow-y-auto sm:px-7 sm:py-5">
            {!isSubmitted ? (
              <form className="space-y-2 sm:space-y-3.5" onSubmit={handleSubmit}>
                <div className="space-y-0.5 sm:space-y-1">
                  <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
                    {t("contact.title")}{" "}
                    <span className="text-sky-500">{t("contact.titleHighlight")}</span>
                  </h2>
                  <p className="hidden text-sm text-slate-500 sm:block">{t("contact.intro")}</p>
                  <p className="text-[11px] leading-snug text-slate-600 sm:text-sm">
                    {t("contact.emailDirect")}{" "}
                    <a
                      href={SITE_CONTACT.emailHref}
                      className="font-medium text-sky-600 underline-offset-2 hover:underline"
                    >
                      {SITE_CONTACT.email}
                    </a>
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-name" className="text-xs font-medium text-slate-700 sm:text-sm">
                    {t("contact.labelName")}
                  </label>
                  <input
                    id="contact-name"
                    placeholder={t("contact.placeholderName")}
                    value={form.name}
                    onChange={(event) => setForm((curr) => ({ ...curr, name: event.target.value }))}
                    className={cn(
                      "h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-400 sm:h-11 sm:rounded-xl sm:px-3.5",
                      errors.name ? "border-rose-300" : "border-slate-200"
                    )}
                  />
                  {errors.name ? <p className="text-[11px] text-rose-500 sm:text-xs">{errors.name}</p> : null}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <div className="space-y-1">
                    <label htmlFor="contact-email" className="text-xs font-medium text-slate-700 sm:text-sm">
                      {t("contact.labelEmail")}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder={t("contact.placeholderEmail")}
                      value={form.email}
                      onChange={(event) => setForm((curr) => ({ ...curr, email: event.target.value }))}
                      className={cn(
                        "h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-400 sm:h-11 sm:rounded-xl sm:px-3.5",
                        errors.email ? "border-rose-300" : "border-slate-200"
                      )}
                    />
                    {errors.email ? <p className="text-[11px] text-rose-500 sm:text-xs">{errors.email}</p> : null}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="contact-phone" className="text-xs font-medium text-slate-700 sm:text-sm">
                      {t("contact.labelPhone")}
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder={t("contact.placeholderPhone")}
                      value={form.phone}
                      onChange={(event) => setForm((curr) => ({ ...curr, phone: event.target.value }))}
                      className={cn(
                        "h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-400 sm:h-11 sm:rounded-xl sm:px-3.5",
                        errors.phone ? "border-rose-300" : "border-slate-200"
                      )}
                    />
                    {errors.phone ? <p className="text-[11px] text-rose-500 sm:text-xs">{errors.phone}</p> : null}
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-description" className="text-xs font-medium text-slate-700 sm:text-sm">
                    {t("contact.labelMessage")}
                  </label>
                  <textarea
                    id="contact-description"
                    rows={2}
                    placeholder={t("contact.placeholderMessage")}
                    value={form.description}
                    onChange={(event) => setForm((curr) => ({ ...curr, description: event.target.value }))}
                    className={cn(
                      "min-h-[3.25rem] w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 sm:min-h-0 sm:rounded-xl sm:px-3.5 sm:py-3",
                      errors.description ? "border-rose-300" : "border-slate-200"
                    )}
                  />
                  {errors.description ? <p className="text-[11px] text-rose-500 sm:text-xs">{errors.description}</p> : null}
                </div>

                <button
                  type="submit"
                  className="h-9 w-full rounded-lg bg-linear-to-r from-blue-500 to-sky-400 text-sm font-semibold text-white shadow-[0_12px_30px_-14px_rgba(249,115,22,0.55)] transition hover:brightness-105 sm:h-11 sm:rounded-xl"
                >
                  {t("contact.submit")}
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <h3 className="text-2xl font-semibold text-slate-900">{t("contact.successTitle")}</h3>
                <p className="text-sm text-slate-600">
                  {t("contact.successBody")} {SITE_CONTACT.email}.
                </p>
                <button
                  type="button"
                  onClick={closeWithReset}
                  className="h-11 w-full rounded-xl bg-linear-to-r from-orange-500 to-amber-400 text-sm font-semibold text-white"
                >
                  {t("contact.closeButton")}
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
