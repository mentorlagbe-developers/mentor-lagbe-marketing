"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  FacebookIcon,
  GoogleIcon,
} from "@/app/components/ui/icons";
import { Modal } from "@/app/components/ui/modal";
import type { AuthUser } from "@/lib/mock-auth";
import {
  authenticateUser,
  normalizePhone,
  registerUser,
  updateUserPassword,
  userExists,
} from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

type AuthView = "login" | "register" | "forgot";
type ActivePanel = AuthView | "verify-register" | "reset" | "success";

type AuthModalProps = {
  open: boolean;
  initialView?: AuthView;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
};

type RegisterFormState = {
  fullName: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type LoginFormState = {
  phone: string;
  password: string;
};

type ForgotFormState = {
  phone: string;
};

type ResetFormState = {
  code: string;
  password: string;
  confirmPassword: string;
};

type ToastItem = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

const registerInitialState: RegisterFormState = {
  fullName: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const loginInitialState: LoginFormState = {
  phone: "",
  password: "",
};

const resetInitialState: ResetFormState = {
  code: "",
  password: "",
  confirmPassword: "",
};

const forgotInitialState: ForgotFormState = {
  phone: "",
};

const AUTH_WHATSAPP_NUMBER = "8801409365577";

function generateOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function toWaMePhone(phone: string) {
  const normalized = normalizePhone(phone).replace(/[^\d]/g, "");

  if (normalized.startsWith("0")) {
    return `88${normalized}`;
  }

  return normalized;
}

function triggerWhatsAppOtp(phone: string, code: string, purpose: string) {
  const recipient = toWaMePhone(AUTH_WHATSAPP_NUMBER);
  const targetPhone = toWaMePhone(phone);
  const text = encodeURIComponent(
    `Mentor Lagbe OTP request\nPurpose: ${purpose}\nTarget: ${targetPhone}\nCode: ${code}\n\n(Frontend demo with wa.me link)`
  );

  window.open(`https://wa.me/${recipient}?text=${text}`, "_blank");
}

function maskPhone(phone: string) {
  if (phone.length < 5) {
    return phone;
  }

  return `${phone.slice(0, 4)}••••${phone.slice(-3)}`;
}

function HeroSidePanel() {
  return (
    <div className="relative hidden w-[44%] overflow-hidden bg-[linear-gradient(180deg,#43b7ff,#2f9fe8)] text-white lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_24%)]" />
      <div className="absolute -top-12 left-10 h-48 w-48 rounded-full bg-white/8 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      {[
        "left-12 top-14",
        "right-16 top-28 rotate-[35deg]",
        "left-20 bottom-28 rotate-[45deg]",
        "right-12 bottom-16 rotate-[42deg]",
      ].map((className) => (
        <span
          key={className}
          className={`absolute ${className} block h-1.5 w-16 rounded-full bg-white/45 shadow-[0_0_12px_rgba(255,255,255,0.35)]`}
        />
      ))}

      <div className="relative flex h-full flex-col justify-center px-7 xl:px-9">
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white text-xl font-black text-sky-500 shadow-[0_24px_60px_-26px_rgba(15,23,42,0.45)]">
            ML
          </div>

          <h2 className="text-3xl font-semibold leading-tight xl:text-4xl">
            Start Your Learning Journey
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/90">
            Join thousands of students and mentors in Bangladesh&apos;s growing
            one-to-one learning platform for quality education and skill
            development.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  rightSlot,
  children,
}: {
  label: string;
  htmlFor: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="space-y-3">
      <span className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        {rightSlot}
      </span>
      {children}
    </label>
  );
}

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    hasError?: boolean;
    iconRight?: React.ReactNode;
  }
) {
  const { className, hasError, iconRight, ...rest } = props;

  return (
    <div className="relative mb-1.5">
      <input
        className={cn(
          "h-10 w-full rounded-xl border bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white",
          hasError ? "border-rose-300" : "border-slate-200",
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
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  hasError?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mb-1.5">
      <TextInput
        {...props}
        hasError={hasError}
        type={visible ? "text" : "password"}
        iconRight={visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
      />
    </div>
  );
}

function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(
    () => Array.from({ length: 6 }, (_, index) => value[index] ?? ""),
    [value]
  );

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          onChange={(event) => {
            const nextDigit = event.target.value.replace(/\D/g, "").slice(-1);
            const nextValue = digits.map((item, itemIndex) =>
              itemIndex === index ? nextDigit : item
            );

            onChange(nextValue.join(""));

            if (nextDigit && index < 5) {
              inputsRef.current[index + 1]?.focus();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit && index > 0) {
              inputsRef.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, 6);

            if (!pasted) {
              return;
            }

            onChange(pasted);
            const focusIndex = Math.min(pasted.length, 5);
            inputsRef.current[focusIndex]?.focus();
          }}
          className="h-12 w-10 rounded-xl border border-slate-200 bg-slate-50 text-center text-base font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white sm:h-13 sm:w-12"
        />
      ))}
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="space-y-2 text-center">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      <p className="mx-auto max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function SocialButtons() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <GoogleIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
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
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(initialView);
  const [registerForm, setRegisterForm] =
    useState<RegisterFormState>(registerInitialState);
  const [loginForm, setLoginForm] = useState<LoginFormState>(loginInitialState);
  const [forgotForm, setForgotForm] =
    useState<ForgotFormState>(forgotInitialState);
  const [resetForm, setResetForm] = useState<ResetFormState>(resetInitialState);
  const [registerOtp, setRegisterOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [passwordResetOtp, setPasswordResetOtp] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [countdown, setCountdown] = useState(54);

  useEffect(() => {
    if (!open || countdown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, open]);

  const modalTitle = useMemo(() => {
    if (activePanel === "register" || activePanel === "verify-register") {
      return "register";
    }

    if (activePanel === "forgot" || activePanel === "reset") {
      return "forgot";
    }

    return "login";
  }, [activePanel]);

  function pushToast(type: ToastItem["type"], message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3000);
  }

  function resetAllState() {
    setRegisterForm(registerInitialState);
    setLoginForm(loginInitialState);
    setForgotForm(forgotInitialState);
    setResetForm(resetInitialState);
    setRegisterOtp("");
    setGeneratedOtp("");
    setPasswordResetOtp("");
    setCountdown(54);
    setToasts([]);
  }

  function closeModal() {
    resetAllState();
    onClose();
  }

  function openView(
    nextView: ActivePanel,
    options?: { keepToasts?: boolean }
  ) {
    if (!(options?.keepToasts ?? false)) {
      setToasts([]);
    }

    setActivePanel(nextView);
  }

  function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const user = authenticateUser(loginForm.phone, loginForm.password);

    if (!user) {
      pushToast("error", "Invalid phone number or password.");
      return;
    }

    pushToast("success", "Login successful. Redirecting to your dashboard.");
    window.setTimeout(() => {
      onAuthSuccess(user);
      closeModal();
    }, 700);
  }

  function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPhone = normalizePhone(registerForm.phone);

    if (
      !registerForm.fullName ||
      !registerForm.phone ||
      !registerForm.password ||
      !registerForm.confirmPassword
    ) {
      pushToast("error", "Please fill in all required registration fields.");
      return;
    }

    if (registerForm.password.length < 8) {
      pushToast("error", "Password must be at least 8 characters long.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      pushToast("error", "Passwords do not match.");
      return;
    }

    if (userExists(normalizedPhone)) {
      pushToast("error", "An account with this phone number already exists.");
      return;
    }

    const otp = generateOtp();
    setGeneratedOtp(otp);
    setRegisterOtp("");
    setCountdown(54);
    triggerWhatsAppOtp(registerForm.phone, otp, "registration");
    pushToast("info", `Code sent via WhatsApp. Demo code: ${otp}`);
    openView("verify-register", { keepToasts: true });
  }

  function handleVerifyRegistration() {
    if (registerOtp.length !== 6) {
      pushToast("error", "Enter the 6-digit verification code sent to WhatsApp.");
      return;
    }

    if (registerOtp !== generatedOtp) {
      pushToast("error", "Verification code does not match.");
      return;
    }

    try {
      const user = registerUser({
        fullName: registerForm.fullName.trim(),
        phone: registerForm.phone,
        password: registerForm.password,
      });

      openView("success");

      window.setTimeout(() => {
        onAuthSuccess(user);
        closeModal();
      }, 1600);
    } catch (error) {
      pushToast(
        "error",
        error instanceof Error ? error.message : "Registration failed."
      );
    }
  }

  function handleForgotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!forgotForm.phone) {
      pushToast("error", "Enter your WhatsApp phone number.");
      return;
    }

    if (!userExists(forgotForm.phone)) {
      pushToast("error", "No account found with this phone number.");
      return;
    }

    const otp = generateOtp();
    setPasswordResetOtp(otp);
    setResetForm({ ...resetInitialState, code: "" });
    setCountdown(54);
    triggerWhatsAppOtp(forgotForm.phone, otp, "password-reset");
    pushToast("info", `Reset code sent via WhatsApp. Demo code: ${otp}`);
    openView("reset", { keepToasts: true });
  }

  function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (resetForm.code !== passwordResetOtp) {
      pushToast("error", "Incorrect reset code.");
      return;
    }

    if (resetForm.password.length < 8) {
      pushToast("error", "New password must be at least 8 characters.");
      return;
    }

    if (resetForm.password !== resetForm.confirmPassword) {
      pushToast("error", "Passwords do not match.");
      return;
    }

    try {
      updateUserPassword(forgotForm.phone, resetForm.password);
      pushToast("success", "Password updated. You can now log in.");
      setLoginForm({
        phone: forgotForm.phone,
        password: resetForm.password,
      });
      openView("login", { keepToasts: true });
    } catch (error) {
      pushToast(
        "error",
        error instanceof Error ? error.message : "Unable to reset password."
      );
    }
  }

  function resendCode(kind: "register" | "reset") {
    const nextOtp = generateOtp();
    setCountdown(54);

    if (kind === "register") {
      setGeneratedOtp(nextOtp);
      setRegisterOtp("");
      triggerWhatsAppOtp(registerForm.phone, nextOtp, "registration-resend");
      pushToast("info", `New code sent via WhatsApp. Demo code: ${nextOtp}`);
      return;
    }

    setPasswordResetOtp(nextOtp);
    setResetForm((current) => ({ ...current, code: "" }));
    triggerWhatsAppOtp(forgotForm.phone, nextOtp, "password-reset-resend");
    pushToast("info", `New reset code sent via WhatsApp. Demo code: ${nextOtp}`);
  }

  return (
    <Modal open={open} onClose={closeModal}>
      <HeroSidePanel />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="px-5 pb-3 pt-4 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <button
                type="button"
                onClick={() => openView("login")}
                className={cn(
                  "rounded-lg border border-transparent px-4 py-2 transition",
                  modalTitle === "login"
                    ? "border-sky-200 bg-white text-sky-600 shadow-sm"
                    : "hover:border-slate-200 hover:bg-white hover:text-slate-900"
                )}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => openView("register")}
                className={cn(
                  "rounded-lg border border-transparent px-4 py-2 transition",
                  modalTitle === "register"
                    ? "border-sky-200 bg-white text-sky-600 shadow-sm"
                    : "hover:border-slate-200 hover:bg-white hover:text-slate-900"
                )}
              >
                Signup
              </button>
            </div>

            {(activePanel === "verify-register" ||
              activePanel === "forgot" ||
              activePanel === "reset") && (
              <button
                type="button"
                onClick={() =>
                  openView(
                    activePanel === "verify-register"
                      ? "register"
                      : activePanel === "forgot"
                        ? "login"
                        : "forgot"
                  )
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-5 pb-5 sm:px-7">
          <div className="mx-auto flex h-full w-full max-w-116 flex-col justify-center py-2">
            {activePanel === "login" && (
              <form className="space-y-6" onSubmit={handleLoginSubmit}>
                <SectionTitle
                  title="Welcome Back"
                  description="Log in to continue your learning journey."
                />

                <div className="space-y-4">
                  <Field label="Phone Number" htmlFor="login-phone">
                    <TextInput
                      id="login-phone"
                      type="tel"
                      placeholder="+880XXXXXXXXXX"
                      value={loginForm.phone}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field
                    label="Password"
                    htmlFor="login-password"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => openView("forgot")}
                        className="text-xs font-semibold text-rose-500 transition hover:text-rose-600"
                      >
                        Forgot Password?
                      </button>
                    }
                  >
                    <PasswordInput
                      id="login-password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Log In
                </Button>

                <SocialButtons />

                <p className="text-center text-sm text-slate-500">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => openView("register")}
                    className="font-semibold text-sky-500 transition hover:text-sky-600"
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {activePanel === "register" && (
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <SectionTitle
                  title="Create Your Account"
                  description={
                    <>
                      Join <span className="text-sky-500">Mentor Lagbe</span> and
                      start your learning journey
                    </>
                  }
                />

                <div className="space-y-4">
                  <Field label="Full Name" htmlFor="register-name">
                    <TextInput
                      id="register-name"
                      placeholder="Enter your full name"
                      value={registerForm.fullName}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="WhatsApp Phone Number" htmlFor="register-phone">
                    <TextInput
                      id="register-phone"
                      type="tel"
                      placeholder="+880XXXXXXXXXX"
                      value={registerForm.phone}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Password" htmlFor="register-password">
                    <PasswordInput
                      id="register-password"
                      placeholder="Create a strong password"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field
                    label="Confirm Password"
                    htmlFor="register-confirm-password"
                  >
                    <PasswordInput
                      id="register-confirm-password"
                      placeholder="Re-enter your password"
                      value={registerForm.confirmPassword}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Continue
                </Button>

                <SocialButtons />

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => openView("login")}
                    className="font-semibold text-sky-500 transition hover:text-sky-600"
                  >
                    Log In
                  </button>
                </p>
              </form>
            )}

            {activePanel === "verify-register" && (
              <div className="space-y-8 text-center">
                <SectionTitle
                  title="Verify Your Phone"
                  description={
                    <>
                      Check your WhatsApp for the verification code sent to{" "}
                      <span className="font-semibold text-slate-700">
                        {maskPhone(normalizePhone(registerForm.phone))}
                      </span>
                      .
                    </>
                  }
                />

                <div className="space-y-5">
                  <OtpInput value={registerOtp} onChange={setRegisterOtp} />

                    <div className="space-y-2 text-sm text-slate-500">
                      <p>
                        Didn&apos;t receive the code?{" "}
                        <button
                          type="button"
                          disabled={countdown > 0}
                          onClick={() => resendCode("register")}
                          className="font-semibold text-sky-500 transition hover:text-sky-600 disabled:text-slate-300"
                        >
                          Resend {countdown > 0 ? `(${countdown}s)` : ""}
                        </button>
                      </p>
                    </div>
                </div>

                <Button
                  type="button"
                  onClick={handleVerifyRegistration}
                  className="w-full"
                  size="lg"
                >
                  Verify & Create Account
                </Button>
              </div>
            )}

            {activePanel === "forgot" && (
              <form className="space-y-5" onSubmit={handleForgotSubmit}>
                <SectionTitle
                  title="Forgot Password?"
                  description="Enter your registered WhatsApp number and we&apos;ll send a verification code to reset your password."
                />

                <Field label="Registered Phone Number" htmlFor="forgot-phone">
                  <TextInput
                    id="forgot-phone"
                    type="tel"
                    placeholder="+880XXXXXXXXXX"
                    value={forgotForm.phone}
                    onChange={(event) =>
                      setForgotForm({ phone: event.target.value })
                    }
                  />
                </Field>

                <Button type="submit" className="w-full" size="lg">
                  Send Verification Code
                </Button>
              </form>
            )}

            {activePanel === "reset" && (
              <form className="space-y-4" onSubmit={handleResetSubmit}>
                <SectionTitle
                  title="Create New Password"
                  description={
                    <>
                      Create a new password for{" "}
                      <span className="font-semibold text-slate-700">
                        {maskPhone(normalizePhone(forgotForm.phone))}
                      </span>
                      .
                    </>
                  }
                />

                <div className="space-y-4">
                  <Field label="Reset Code" htmlFor="reset-code">
                    <TextInput
                      id="reset-code"
                      inputMode="numeric"
                      placeholder="Enter the 6-digit code"
                      value={resetForm.code}
                      onChange={(event) =>
                        setResetForm((current) => ({
                          ...current,
                          code: event.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="New Password" htmlFor="reset-password">
                      <PasswordInput
                        id="reset-password"
                        placeholder="Create a strong password"
                        value={resetForm.password}
                        onChange={(event) =>
                          setResetForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field
                      label="Confirm Password"
                      htmlFor="reset-confirm-password"
                    >
                      <PasswordInput
                        id="reset-confirm-password"
                        placeholder="Re-enter your password"
                        value={resetForm.confirmPassword}
                        onChange={(event) =>
                          setResetForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>

                  <p className="text-sm text-slate-500">
                    Need a new code?{" "}
                    <button
                      type="button"
                      disabled={countdown > 0}
                      onClick={() => resendCode("reset")}
                      className="font-semibold text-sky-500 transition hover:text-sky-600 disabled:text-slate-300"
                    >
                      Resend {countdown > 0 ? `(${countdown}s)` : ""}
                    </button>
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Reset Password
                </Button>
              </form>
            )}

            {activePanel === "success" && (
              <div className="space-y-7 text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 shadow-[0_20px_50px_-24px_rgba(16,185,129,0.55)]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500 text-emerald-500">
                    <CheckIcon className="h-9 w-9" />
                  </div>
                </div>

                <SectionTitle
                  title="Account Created Successfully!"
                  description="Welcome to Mentor Lagbe! Your account has been created and verified. Redirecting to your dashboard."
                />

                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-70 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-[0_18px_35px_-22px_rgba(15,23,42,0.55)] backdrop-blur",
              toast.type === "success" &&
                "border-emerald-200 bg-emerald-50/90 text-emerald-700",
              toast.type === "error" &&
                "border-rose-200 bg-rose-50/90 text-rose-700",
              toast.type === "info" &&
                "border-sky-200 bg-sky-50/90 text-sky-700"
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </Modal>
  );
}
