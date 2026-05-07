"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { KeyRound, Mail, Phone, UserPlus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ApiError } from "@/lib/api";
import { createMentorByAdmin } from "@/lib/profile-api";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidBdPhone(phone: string) {
  return /^\+8801[3-9]\d{8}$/.test(phone.trim());
}

function isStrongTemporaryPassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

export function MentorRegistrationPanel() {
  const [status, setStatus] = useState<string | null>(null);

  const form = useFormik({
    initialValues: {
      email: "",
      phone: "",
      temporaryPassword: "",
    },
    validate(values) {
      const errors: Partial<Record<keyof typeof values, string>> = {};
      if (!values.email.trim()) errors.email = "Email is required.";
      else if (!isValidEmail(values.email)) errors.email = "Enter a valid email.";

      if (!values.phone.trim()) errors.phone = "Phone is required.";
      else if (!isValidBdPhone(values.phone)) errors.phone = "Use +8801XXXXXXXXX format.";

      if (!values.temporaryPassword) errors.temporaryPassword = "Temporary password is required.";
      else if (!isStrongTemporaryPassword(values.temporaryPassword)) {
        errors.temporaryPassword = "Use 8+ chars with at least 1 uppercase and 1 number.";
      }
      return errors;
    },
    async onSubmit(values, helpers) {
      try {
        setStatus(null);
        await createMentorByAdmin({
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
          temporaryPassword: values.temporaryPassword,
        });
        setStatus("Mentor created successfully. Mentor can complete rest of profile after first login.");
        helpers.resetForm();
      } catch (error) {
        if (error instanceof ApiError) {
          setStatus(error.message);
          return;
        }
        setStatus("Mentor registration failed.");
      }
    },
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <UserPlus className="h-5 w-5 text-brand-primary" />
          Register Mentor (Admin)
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          For now, only provide email, phone, and temporary password. Mentor updates remaining profile after login.
        </p>
      </div>

      <form className="grid gap-4 md:grid-cols-3" onSubmit={form.handleSubmit}>
        <label className="space-y-1 text-sm">
          <span className="inline-flex items-center gap-1 font-medium"><Mail className="h-4 w-4" /> Email</span>
          <input
            name="email"
            value={form.values.email}
            onChange={form.handleChange}
            className="h-11 w-full rounded-xl border border-slate-200 px-3"
            placeholder="mentor@example.com"
          />
          {form.errors.email ? <p className="text-xs text-rose-500">{form.errors.email}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="inline-flex items-center gap-1 font-medium"><Phone className="h-4 w-4" /> Phone</span>
          <input
            name="phone"
            value={form.values.phone}
            onChange={form.handleChange}
            className="h-11 w-full rounded-xl border border-slate-200 px-3"
            placeholder="+8801XXXXXXXXX"
          />
          {form.errors.phone ? <p className="text-xs text-rose-500">{form.errors.phone}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="inline-flex items-center gap-1 font-medium"><KeyRound className="h-4 w-4" /> Temporary Password</span>
          <input
            type="password"
            name="temporaryPassword"
            value={form.values.temporaryPassword}
            onChange={form.handleChange}
            className="h-11 w-full rounded-xl border border-slate-200 px-3"
            placeholder="TempPass123"
          />
          {form.errors.temporaryPassword ? <p className="text-xs text-rose-500">{form.errors.temporaryPassword}</p> : null}
        </label>

        <div className="md:col-span-3 flex justify-end">
          <Button type="submit">Create Mentor</Button>
        </div>
      </form>

      {status ? <p className="mt-3 text-sm text-brand-primary">{status}</p> : null}
    </section>
  );
}
