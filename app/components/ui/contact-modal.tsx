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
    <div className="modal-overlay-animate fixed inset-0 z-60 flex items-center justify-center bg-black/45 px-4 py-5 backdrop-blur-md">
      <button
        type="button"
        aria-label={t("contact.closeOverlay")}
        className="absolute inset-0"
        onClick={closeWithReset}
      />

      <div className="modal-pop-animate relative z-10 w-full max-w-5xl rounded-[30px] border border-white/40 bg-linear-to-br from-white/50 via-sky-100/20 to-white/40 p-1.5 shadow-[0_30px_90px_-36px_rgba(14,165,233,0.45)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -left-3 -top-3 h-8 w-8 rounded-full border border-white/50 bg-white/30" />
        <div className="pointer-events-none absolute -bottom-3 -right-3 h-8 w-8 rounded-full border border-white/50 bg-white/30" />
        <div className="relative h-[min(520px,calc(100vh-40px))] overflow-hidden rounded-[24px] border border-white/45 bg-white shadow-[0_30px_90px_-36px_rgba(15,23,42,0.7)]">
        <button
          type="button"
          onClick={closeWithReset}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 transition hover:text-slate-800"
          aria-label={t("contact.close")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid h-full grid-cols-1 lg:grid-cols-2">
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

          <div className="flex min-h-0 flex-col justify-center overflow-y-auto bg-[#f8f8f8] px-6 py-5 sm:px-7">
            {!isSubmitted ? (
              <form className="space-y-3.5" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {t("contact.title")}{" "}
                    <span className="text-sky-500">{t("contact.titleHighlight")}</span>
                  </h2>
                  <p className="text-sm text-slate-500">{t("contact.intro")}</p>
                  <p className="text-sm text-slate-600">
                    {t("contact.emailDirect")}{" "}
                    <a
                      href={SITE_CONTACT.emailHref}
                      className="font-medium text-sky-600 underline-offset-2 hover:underline"
                    >
                      {SITE_CONTACT.email}
                    </a>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="text-sm font-medium text-slate-700">
                    {t("contact.labelName")}
                  </label>
                  <input
                    id="contact-name"
                    placeholder={t("contact.placeholderName")}
                    value={form.name}
                    onChange={(event) => setForm((curr) => ({ ...curr, name: event.target.value }))}
                    className={cn(
                      "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-amber-400",
                      errors.name ? "border-rose-300" : "border-slate-200"
                    )}
                  />
                  {errors.name ? <p className="text-xs text-rose-500">{errors.name}</p> : null}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-sm font-medium text-slate-700">
                      {t("contact.labelEmail")}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder={t("contact.placeholderEmail")}
                      value={form.email}
                      onChange={(event) => setForm((curr) => ({ ...curr, email: event.target.value }))}
                      className={cn(
                        "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-amber-400",
                        errors.email ? "border-rose-300" : "border-slate-200"
                      )}
                    />
                    {errors.email ? <p className="text-xs text-rose-500">{errors.email}</p> : null}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="text-sm font-medium text-slate-700">
                      {t("contact.labelPhone")}
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder={t("contact.placeholderPhone")}
                      value={form.phone}
                      onChange={(event) => setForm((curr) => ({ ...curr, phone: event.target.value }))}
                      className={cn(
                        "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-amber-400",
                        errors.phone ? "border-rose-300" : "border-slate-200"
                      )}
                    />
                    {errors.phone ? <p className="text-xs text-rose-500">{errors.phone}</p> : null}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-description" className="text-sm font-medium text-slate-700">
                    {t("contact.labelMessage")}
                  </label>
                  <textarea
                    id="contact-description"
                    rows={4}
                    placeholder={t("contact.placeholderMessage")}
                    value={form.description}
                    onChange={(event) => setForm((curr) => ({ ...curr, description: event.target.value }))}
                    className={cn(
                      "w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-amber-400",
                      errors.description ? "border-rose-300" : "border-slate-200"
                    )}
                  />
                  {errors.description ? <p className="text-xs text-rose-500">{errors.description}</p> : null}
                </div>

                <button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-linear-to-r from-blue-500 to-sky-400 text-sm font-semibold text-white shadow-[0_12px_30px_-14px_rgba(249,115,22,0.55)] transition hover:brightness-105"
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
  );
}
