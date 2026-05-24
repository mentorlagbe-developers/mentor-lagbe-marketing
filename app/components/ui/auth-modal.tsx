"use client";

import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  FacebookIcon,
  GoogleIcon,
} from "@/app/components/ui/icons";
import { Modal } from "@/app/components/ui/modal";
import { ToastCenter } from "@/app/components/ui/toast-center";
import type { AuthUser } from "@/lib/mock-auth";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

type AuthView = "login" | "register" | "verify" | "forgot" | "reset";
type ActivePanel = AuthView | "success";

type AuthModalProps = {
  open: boolean;
  initialView?: AuthView;
  initialUserId?: string;
  initialEmail?: string;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
};

type ToastItem = {
  id: number;
  type: "success" | "danger" | "warning" | "info";
  message: string;
};

type RegisterFormValues = {
  fullName: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  password: string;
  confirmPassword: string;
};

type LoginFormValues = {
  email: string;
  password: string;
};

const registerInitialValues: RegisterFormValues = {
  fullName: "",
  email: "",
  phone: "",
  whatsappOptIn: true,
  password: "",
  confirmPassword: "",
};

const loginInitialValues: LoginFormValues = {
  email: "",
  password: "",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhoneNumber(phone: string) {
  const value = phone.trim();
  return /^(\+8801[3-9]\d{8}|8801[3-9]\d{8}|01[3-9]\d{8})$/.test(value);
}

function toBdPhoneE164(phone: string) {
  const value = phone.trim().replace(/\s+/g, "");
  if (!value) return "";
  if (value.startsWith("+880")) return value;
  if (value.startsWith("880")) return `+${value}`;
  if (value.startsWith("01")) return `+88${value}`;
  return value;
}

function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

function isValidOtp(otp: string) {
  return /^\d{6}$/.test(otp.trim());
}

function extractOtpForDevLog(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const source = payload as Record<string, unknown>;
  if (typeof source.otp === "string" && source.otp.trim()) return source.otp;
  if (source.data && typeof source.data === "object") {
    const nested = source.data as Record<string, unknown>;
    if (typeof nested.otp === "string" && nested.otp.trim()) return nested.otp;
  }
  if (source.meta && typeof source.meta === "object") {
    const meta = source.meta as Record<string, unknown>;
    if (typeof meta.otp === "string" && meta.otp.trim()) return meta.otp;
  }
  return null;
}

function HeroSidePanel() {
  return (
    <div className="relative hidden min-h-[200px] w-full shrink-0 overflow-hidden bg-linear-to-br from-[#3b82f6] via-sky-400 to-cyan-300 text-white lg:flex lg:min-h-0 lg:w-1/2 lg:flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.35),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.12),transparent_45%)]" />

      <div className="relative flex h-full min-h-0 flex-1 flex-col justify-center px-8 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-10">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
          <div className="mb-6 flex h-22 w-22 items-center justify-center rounded-full border-2 border-white/90 bg-white shadow-[0_20px_50px_-18px_rgba(15,23,42,0.45)]">
            <Image src="/images/logo-3.png" alt="Mentor Lagbe" width={64} height={64} className="h-14 w-14 object-contain" priority />
          </div>

          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-[2rem] lg:text-[1.75rem] lg:leading-snug xl:text-4xl xl:leading-[1.15]">
            Start Your Learning Journey
          </h2>
          <p className="mt-4 max-w-88 text-sm font-normal leading-relaxed text-white/95 sm:text-[0.9375rem] lg:mt-3">
            Join thousands of students and mentors in Bangladesh&apos;s growing one-to-one learning platform.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="space-y-2.5">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-500">{message}</p>;
}

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    hasError?: boolean;
    iconRight?: React.ReactNode;
  }
) {
  const { className, hasError, iconRight, ...rest } = props;

  return (
    <div className="relative">
      <input
        className={cn(
          "h-11 w-full rounded-xl border border-slate-200/95 bg-slate-50/90 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#3b82f6] focus:bg-white focus:ring-2 focus:ring-[#3b82f6]/15 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/20",
          hasError ? "border-rose-300" : "",
          iconRight ? "pr-12" : "",
          className
        )}
        {...rest}
      />
      {iconRight ? (
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
          {iconRight}
        </span>
      ) : null}
    </div>
  );
}

function PasswordInput({
  hasError,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { hasError?: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(
          "h-11 w-full rounded-xl border border-slate-200/95 bg-slate-50/90 px-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#3b82f6] focus:bg-white focus:ring-2 focus:ring-[#3b82f6]/15 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/20",
          hasError ? "border-rose-300" : ""
        )}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 z-1 flex w-11 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
}

function SectionTitle({
  title,
  description,
  compact,
}: {
  title: string;
  description: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-2 text-center" : "space-y-2.5 text-center"}>
      <h2
        className={cn(
          "font-bold tracking-tight text-slate-900 dark:text-slate-50",
          compact ? "text-xl sm:text-2xl sm:leading-snug" : "text-2xl sm:text-[1.75rem] sm:leading-snug"
        )}
      >
        {title}
      </h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function SocialButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3.5" : "space-y-5"}>
      <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
        <span className="shrink-0 uppercase tracking-wide">or</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <GoogleIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <FacebookIcon className="h-5 w-5 text-[#1877F2]" />
        </button>
      </div>
    </div>
  );
}

export function AuthModal({
  open,
  initialView = "login",
  initialUserId,
  initialEmail,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const router = useRouter();
  const auth = useAuth();
  const [activePanel, setActivePanel] = useState<ActivePanel>(initialView);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [verifyUserId, setVerifyUserId] = useState(initialUserId ?? "");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [forgotEmail, setForgotEmail] = useState(initialEmail ?? "");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resendWait, setResendWait] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  function pushToast(type: ToastItem["type"], message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3000);
  }

  function applyValidationDetails(error: ApiError, setFieldError: (field: string, message: string | undefined) => void) {
    if (error.code !== "VALIDATION_ERROR" || !error.details) return;
    error.details.forEach((detail) => {
      if (detail.field) setFieldError(detail.field, detail.message ?? "Invalid value.");
    });
  }

  useEffect(() => {
    if (activePanel !== "verify" || resendWait <= 0) return;
    const timer = window.setInterval(() => {
      setResendWait((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activePanel, resendWait]);

  const loginForm = useFormik<LoginFormValues>({
    initialValues: loginInitialValues,
    validate(values) {
      const errors: Partial<Record<keyof LoginFormValues, string>> = {};
      if (!values.email.trim()) errors.email = "Email is required.";
      else if (!isValidEmail(values.email)) errors.email = "Enter a valid email.";
      if (!values.password) errors.password = "Password is required.";
      return errors;
    },
    async onSubmit(values, helpers) {
      try {
        const user = await auth.login({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        });
        pushToast("success", "Login successful.");
        onAuthSuccess(user);
        closeModal();
        router.push(auth.roleHomePath(user.role));
      } catch (error) {
        if (error instanceof ApiError) {
          applyValidationDetails(error, helpers.setFieldError);
          pushToast("danger", error.message);
          return;
        }
        pushToast("danger", "Login failed.");
      }
    },
  });

  const registerForm = useFormik<RegisterFormValues>({
    initialValues: registerInitialValues,
    validate(values) {
      const errors: Partial<Record<keyof RegisterFormValues, string>> = {};
      if (!values.fullName.trim()) errors.fullName = "Full name is required.";
      else if (values.fullName.trim().length < 2 || values.fullName.trim().length > 150) errors.fullName = "Full name must be between 2 and 150.";
      if (!values.email.trim()) errors.email = "Email is required.";
      else if (!isValidEmail(values.email)) errors.email = "Enter a valid email.";
      if (!values.phone.trim()) errors.phone = "WhatsApp phone number is required.";
      else if (!isValidPhoneNumber(values.phone)) errors.phone = "Phone must be 014... or +88014... format.";
      if (!values.whatsappOptIn) errors.whatsappOptIn = "WhatsApp consent is required to receive your OTP.";
      if (!values.password) errors.password = "Password is required.";
      else if (!isStrongPassword(values.password)) errors.password = "Password must be 8+ chars with 1 uppercase and 1 number.";
      if (!values.confirmPassword) errors.confirmPassword = "Confirm password is required.";
      else if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords do not match.";
      return errors;
    },
    async onSubmit(values, helpers) {
      try {
        const data = await auth.register({
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          phone: toBdPhoneE164(values.phone),
          whatsappOptIn: values.whatsappOptIn,
          password: values.password,
        });
        const registerOtp = extractOtpForDevLog(data);
        if (registerOtp) {
          console.info("[DEV OTP][register]", registerOtp);
        }
        const nextUserId =
          (data as { userId?: string; id?: string; user?: { id?: string } })?.userId ??
          (data as { userId?: string; id?: string; user?: { id?: string } })?.id ??
          (data as { userId?: string; id?: string; user?: { id?: string } })?.user?.id ??
          "";
        setVerifyUserId(nextUserId);
        setForgotEmail(values.email.trim().toLowerCase());
        setActivePanel("verify");
        pushToast("success", "Check WhatsApp for your OTP. Enter the 6-digit code to continue.");
      } catch (error) {
        if (error instanceof ApiError) {
          applyValidationDetails(error, helpers.setFieldError);
          pushToast("danger", error.message);
          return;
        }
        pushToast("danger", "Registration failed.");
      }
    },
  });

  function resetAllState() {
    loginForm.resetForm();
    registerForm.resetForm();
    setToasts([]);
    setOtpDigits(Array(6).fill(""));
    setResetOtp("");
    setResetPassword("");
    setResendWait(0);
    setLockedUntil(null);
    setActivePanel(initialView);
  }

  function closeModal() {
    resetAllState();
    onClose();
  }

  function openView(nextView: ActivePanel, options?: { keepToasts?: boolean }) {
    if (!(options?.keepToasts ?? false)) setToasts([]);
    setActivePanel(nextView);
  }

  const verifyOtp = otpDigits.join("");

  function handleOtpDigitChange(index: number, value: string) {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = nextValue;
      return next;
    });
    if (nextValue && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  return (
    <Modal
      variant="glass"
      open={open}
      onClose={closeModal}
      className="h-[min(96dvh,calc(100dvh-0.35rem))] max-w-6xl"
    >
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden lg:flex-row lg:items-stretch">
        <HeroSidePanel />

        <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white lg:w-1/2 dark:bg-slate-900">
          <div className="shrink-0 px-6 pb-3 pt-12 sm:px-10 sm:pb-4 sm:pt-14">
            <div className="inline-flex rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1 text-sm font-semibold text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:shadow-none">
              <button
                type="button"
                onClick={() => openView("login")}
                className={cn(
                  "rounded-xl px-5 py-2.5 transition",
                  activePanel === "login"
                    ? "border border-slate-200/80 bg-white text-[#2563eb] shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-sky-400"
                    : "border border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => openView("register")}
                className={cn(
                  "rounded-xl px-5 py-2.5 transition",
                  activePanel === "register"
                    ? "border border-slate-200/80 bg-white text-[#2563eb] shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-sky-400"
                    : "border border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                Signup
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-6 pb-6 pt-0 sm:px-10 sm:pb-8">
            <div className="mx-auto w-full max-w-2xl py-0.5 sm:py-1">
            {activePanel === "login" && (
              <form className="space-y-6" onSubmit={loginForm.handleSubmit}>
                <SectionTitle title="Welcome Back" description="Log in to continue your learning journey." />
                <div className="space-y-4">
                  <Field label="Email" htmlFor="login-email">
                    <TextInput id="login-email" name="email" type="email" placeholder="you@example.com" value={loginForm.values.email} onChange={loginForm.handleChange} onBlur={loginForm.handleBlur} hasError={Boolean(loginForm.touched.email && loginForm.errors.email)} />
                    <FieldError message={loginForm.touched.email ? loginForm.errors.email : undefined} />
                  </Field>
                  <Field label="Password" htmlFor="login-password">
                    <PasswordInput id="login-password" name="password" placeholder="Enter your password" value={loginForm.values.password} onChange={loginForm.handleChange} onBlur={loginForm.handleBlur} hasError={Boolean(loginForm.touched.password && loginForm.errors.password)} />
                    <FieldError message={loginForm.touched.password ? loginForm.errors.password : undefined} />
                  </Field>
                </div>
                <Button type="submit" className="w-full" size="lg">Log In</Button>
                <button
                  type="button"
                  onClick={() => openView("forgot")}
                  className="w-full text-center text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                >
                  Forgot Password?
                </button>
                <SocialButtons />
              </form>
            )}

            {activePanel === "register" && (
              <form className="space-y-3" onSubmit={registerForm.handleSubmit}>
                <SectionTitle
                  compact
                  title="Create Your Account"
                  description={
                    <>
                      Join <span className="font-semibold text-[#2563eb]">Mentor Lagbe</span> and start your journey
                    </>
                  }
                />
                <div className="space-y-3">
                  <div className="mb-0">
                    <Field label="Full Name" htmlFor="register-name">
                      <TextInput id="register-name" name="fullName" placeholder="Enter your full name" value={registerForm.values.fullName} onChange={registerForm.handleChange} onBlur={registerForm.handleBlur} hasError={Boolean(registerForm.touched.fullName && registerForm.errors.fullName)} />
                      <FieldError message={registerForm.touched.fullName ? registerForm.errors.fullName : undefined} />
                    </Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</span>
                      <TextInput id="register-email" name="email" type="email" placeholder="you@example.com" value={registerForm.values.email} onChange={registerForm.handleChange} onBlur={registerForm.handleBlur} hasError={Boolean(registerForm.touched.email && registerForm.errors.email)} />
                      <FieldError message={registerForm.touched.email ? registerForm.errors.email : undefined} />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">WhatsApp Phone</span>
                      <TextInput id="register-phone" name="phone" type="tel" placeholder="014XXXXXXXX" value={registerForm.values.phone} onChange={registerForm.handleChange} onBlur={registerForm.handleBlur} hasError={Boolean(registerForm.touched.phone && registerForm.errors.phone)} />
                      <FieldError message={registerForm.touched.phone ? registerForm.errors.phone : undefined} />
                    </div>
                  </div>
                  <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800/50">
                    <input
                      type="checkbox"
                      name="whatsappOptIn"
                      checked={registerForm.values.whatsappOptIn}
                      onChange={registerForm.handleChange}
                      className="mt-0.5"
                    />
                    <span className="text-slate-600 dark:text-slate-300">
                      I agree to receive OTP and session updates on WhatsApp. Password reset stays email-only.
                    </span>
                  </label>
                  <FieldError message={registerForm.touched.whatsappOptIn ? registerForm.errors.whatsappOptIn : undefined} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Password" htmlFor="register-password">
                      <PasswordInput id="register-password" name="password" placeholder="Create a strong password" value={registerForm.values.password} onChange={registerForm.handleChange} onBlur={registerForm.handleBlur} hasError={Boolean(registerForm.touched.password && registerForm.errors.password)} />
                      <FieldError message={registerForm.touched.password ? registerForm.errors.password : undefined} />
                    </Field>
                    <Field label="Confirm Password" htmlFor="register-confirm-password">
                      <PasswordInput id="register-confirm-password" name="confirmPassword" placeholder="Re-enter your password" value={registerForm.values.confirmPassword} onChange={registerForm.handleChange} onBlur={registerForm.handleBlur} hasError={Boolean(registerForm.touched.confirmPassword && registerForm.errors.confirmPassword)} />
                      <FieldError message={registerForm.touched.confirmPassword ? registerForm.errors.confirmPassword : undefined} />
                    </Field>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg">Create Account</Button>
                <SocialButtons compact />
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => openView("login")}
                    className="font-semibold text-[#2563eb] transition hover:text-[#1d4ed8]"
                  >
                    Log In
                  </button>
                </p>
              </form>
            )}

            {activePanel === "verify" && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-medium text-slate-900">Mentor Lagbe</p>
                  <div className="mx-auto mt-2 h-1 w-20 rounded bg-slate-900" />
                </div>

                <button
                  type="button"
                  onClick={() => openView("register")}
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  <span aria-hidden>←</span> Back
                </button>

                <div className="space-y-2 text-center">
                  <h3 className="text-4xl font-semibold text-slate-900">Verify on WhatsApp</h3>
                  <p className="text-base text-slate-500">Enter the 6-digit code sent to your WhatsApp number</p>
                  <p className="text-xl font-medium text-slate-900">
                    {registerForm.values.phone.trim()
                      ? toBdPhoneE164(registerForm.values.phone)
                      : "your phone"}
                  </p>
                </div>

                <div className="flex justify-center gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(node) => {
                        otpRefs.current[index] = node;
                      }}
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      className="h-14 w-12 rounded-xl border border-slate-300 bg-slate-50 text-center text-2xl font-semibold outline-none focus:border-brand-primary focus:bg-white"
                    />
                  ))}
                </div>

                {!isValidOtp(verifyOtp) && verifyOtp ? <FieldError message="OTP must be 6 digits." /> : null}
                {lockedUntil ? <p className="text-xs text-rose-500">OTP locked until {lockedUntil}</p> : null}

                <div className="space-y-1 text-center">
                  <p className="text-sm text-slate-600">
                    Didn&apos;t receive the code?{" "}
                    <button
                      type="button"
                      disabled={resendWait > 0}
                      className={cn(
                        "font-medium",
                        resendWait > 0 ? "text-slate-400" : "text-sky-600 hover:text-sky-700"
                      )}
                      onClick={async () => {
                        if (!verifyUserId) {
                          pushToast("danger", "Session expired. Please register again.");
                          return;
                        }
                        try {
                          const resendData = await auth.resendOtp({ userId: verifyUserId, purpose: "verify_email" });
                          const resendOtp = extractOtpForDevLog(resendData);
                          if (resendOtp) {
                            console.info("[DEV OTP][resend]", resendOtp);
                          }
                          setResendWait(180);
                          pushToast("success", "OTP sent again on WhatsApp.");
                        } catch (error) {
                          if (error instanceof ApiError) {
                            if (error.code === "RESEND_TOO_SOON") {
                              const wait = Number(error.meta?.waitSeconds ?? 0);
                              setResendWait(wait);
                            }
                            if (error.code === "OTP_LOCKED") setLockedUntil(String(error.meta?.unlocksAt ?? ""));
                            pushToast("danger", error.message);
                            return;
                          }
                          pushToast("danger", "Resend failed.");
                        }
                      }}
                    >
                      {resendWait > 0 ? `Resend Code (${resendWait}s)` : "Resend Code"}
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={() => openView("register")}
                    className="text-sm font-medium text-sky-600 hover:text-sky-700"
                  >
                    Change phone number
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      if (!isValidOtp(verifyOtp)) {
                        pushToast("danger", "Provide valid 6-digit OTP.");
                        return;
                      }
                      if (!verifyUserId) {
                        pushToast("danger", "Session expired. Please register again.");
                        return;
                      }
                      try {
                        await auth.verifyEmail({ userId: verifyUserId, otp: verifyOtp.trim() });
                        pushToast("success", "Email verified. Please login.");
                        openView("login", { keepToasts: true });
                      } catch (error) {
                        if (error instanceof ApiError) {
                          if (error.code === "OTP_LOCKED") setLockedUntil(String(error.meta?.unlocksAt ?? ""));
                          pushToast("danger", error.message);
                          return;
                        }
                        pushToast("danger", "Verification failed.");
                      }
                    }}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {activePanel === "forgot" && (
              <div className="space-y-5">
                <SectionTitle title="Forgot Password" description="We will send OTP to your email." />
                <Field label="Email" htmlFor="forgot-email">
                  <TextInput id="forgot-email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} />
                </Field>
                <Button
                  className="w-full"
                  onClick={async () => {
                    if (!isValidEmail(forgotEmail)) {
                      pushToast("danger", "Enter a valid email.");
                      return;
                    }
                    try {
                      const forgotData = await auth.forgotPassword({ email: forgotEmail.trim().toLowerCase() });
                      const forgotOtp = extractOtpForDevLog(forgotData);
                      if (forgotOtp) {
                        console.info("[DEV OTP][forgot]", forgotOtp);
                      }
                      pushToast("success", "OTP sent to your email.");
                      openView("reset", { keepToasts: true });
                    } catch (error) {
                      if (error instanceof ApiError) {
                        pushToast("danger", error.message);
                        return;
                      }
                      pushToast("danger", "Request failed.");
                    }
                  }}
                >
                  Send OTP
                </Button>
              </div>
            )}

            {activePanel === "reset" && (
              <div className="space-y-5">
                <SectionTitle title="Reset Password" description="Enter OTP and your new password." />
                <Field label="Email" htmlFor="reset-email">
                  <TextInput id="reset-email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} />
                </Field>
                <Field label="OTP" htmlFor="reset-otp">
                  <TextInput id="reset-otp" value={resetOtp} onChange={(event) => setResetOtp(event.target.value)} />
                </Field>
                <Field label="New Password" htmlFor="reset-password">
                  <PasswordInput id="reset-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
                </Field>
                <Button
                  className="w-full"
                  onClick={async () => {
                    if (!isValidEmail(forgotEmail) || !isValidOtp(resetOtp) || !isStrongPassword(resetPassword)) {
                      pushToast("danger", "Provide valid email, 6 digit OTP, and strong password.");
                      return;
                    }
                    try {
                      await auth.resetPassword({
                        email: forgotEmail.trim().toLowerCase(),
                        otp: resetOtp.trim(),
                        newPassword: resetPassword,
                      });
                      setActivePanel("success");
                    } catch (error) {
                      if (error instanceof ApiError) {
                        pushToast("danger", error.message);
                        return;
                      }
                      pushToast("danger", "Reset failed.");
                    }
                  }}
                >
                  Reset Password
                </Button>
              </div>
            )}

            {activePanel === "success" && (
              <div className="space-y-7 text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 shadow-[0_20px_50px_-24px_rgba(16,185,129,0.55)]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500 text-emerald-500">
                    <CheckIcon className="h-9 w-9" />
                  </div>
                </div>
                <SectionTitle title="Success!" description="Operation completed. Please login again." />
                <Button className="w-full" onClick={() => openView("login")}>Back to Login</Button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      <ToastCenter
        toasts={toasts.map((item) => ({
          id: item.id,
          variant: item.type,
          message: item.message,
        }))}
      />
    </Modal>
  );
}
