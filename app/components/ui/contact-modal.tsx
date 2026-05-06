"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
      nextErrors.name = "Enter a valid name (min 3 chars).";
    }

    if (!form.email.trim() || !isValidEmail(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.phone.trim() || !isValidPhone(form.phone)) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    if (!form.description.trim() || form.description.trim().length < 12) {
      nextErrors.description = "Description should be at least 12 characters.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitted(true);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay-animate fixed inset-0 z-60 flex items-center justify-center bg-black/45 px-4 py-5 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close contact modal overlay"
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
          aria-label="Close contact modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid h-full grid-cols-1 lg:grid-cols-2">
          <div className="relative hidden bg-[#f4efe7] lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_42%)]" />
            <div className="relative flex h-full items-center justify-center p-8">
              <Image
                src="/images/live-img.svg"
                alt="Contact support illustration"
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
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Contact <span className="text-sky-500">Mentor Lagbe</span></h2>
                  <p className="text-sm text-slate-500">
                    Share your details and our support team will contact you soon.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    placeholder="Enter your full name"
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
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
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
                      Phone number
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
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
                    Reason for contact
                  </label>
                  <textarea
                    id="contact-description"
                    rows={4}
                    placeholder="Write your message..."
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
                  Send mail
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <h3 className="text-2xl font-semibold text-slate-900">Thanks for contacting us!</h3>
                <p className="text-sm text-slate-600">
                  We received your message and will get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={closeWithReset}
                  className="h-11 w-full rounded-xl bg-linear-to-r from-orange-500 to-amber-400 text-sm font-semibold text-white"
                >
                  Close
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
