"use client";

import { useState } from "react";
import { useFormik } from "formik";
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
import {
  authenticateUser,
  normalizePhone,
  registerUser,
  setCurrentUser,
  userExists,
} from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

type AuthView = "login" | "register";
type ActivePanel = AuthView | "success";

type AuthModalProps = {
  open: boolean;
  initialView?: AuthView;
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
  password: string;
  confirmPassword: string;
};

type LoginFormValues = {
  phone: string;
  password: string;
};

const registerInitialValues: RegisterFormValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const loginInitialValues: LoginFormValues = {
  phone: "",
  password: "",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhoneNumber(phone: string) {
  const normalized = normalizePhone(phone).replace(/[^\d]/g, "");
  return normalized.length >= 10 && normalized.length <= 14;
}

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

function HeroSidePanel() {
  return (
    <div className="relative hidden w-[44%] overflow-hidden bg-[linear-gradient(180deg,#43b7ff,#2f9fe8)] text-white lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_24%)]" />
      <div className="absolute -top-12 left-10 h-48 w-48 rounded-full bg-white/8 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

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
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="space-y-2.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

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
    <div className="relative">
      <TextInput
        {...props}
        hasError={hasError}
        type={visible ? "text" : "password"}
        iconRight={
          visible ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )
        }
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const modalTitle = activePanel === "register" ? "register" : "login";

  function pushToast(type: ToastItem["type"], message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3000);
  }

  const loginForm = useFormik<LoginFormValues>({
    initialValues: loginInitialValues,
    validate(values) {
      const errors: Partial<Record<keyof LoginFormValues, string>> = {};

      if (!values.phone.trim()) {
        errors.phone = "Phone number is required.";
      } else if (!isValidPhoneNumber(values.phone)) {
        errors.phone = "Enter a valid phone number.";
      }

      if (!values.password) {
        errors.password = "Password is required.";
      }

      return errors;
    },
    onSubmit(values) {
      const user = authenticateUser(values.phone, values.password);

      if (!user) {
        pushToast("danger", "Invalid phone number or password.");
        return;
      }

      pushToast("success", "Login successful. Redirecting to your dashboard.");
      window.setTimeout(() => {
        onAuthSuccess(user);
        closeModal();
      }, 700);
    },
  });

  const registerForm = useFormik<RegisterFormValues>({
    initialValues: registerInitialValues,
    validate(values) {
      const errors: Partial<Record<keyof RegisterFormValues, string>> = {};
      const normalizedPhone = normalizePhone(values.phone);

      if (!values.fullName.trim()) {
        errors.fullName = "Full name is required.";
      } else if (values.fullName.trim().length < 3) {
        errors.fullName = "Full name must be at least 3 characters.";
      }

      if (!values.email.trim()) {
        errors.email = "Email is required.";
      } else if (!isValidEmail(values.email)) {
        errors.email = "Enter a valid email address.";
      }

      if (!values.phone.trim()) {
        errors.phone = "Phone number is required.";
      } else if (!isValidPhoneNumber(values.phone)) {
        errors.phone = "Enter a valid phone number.";
      } else if (userExists(normalizedPhone)) {
        errors.phone = "An account with this phone number already exists.";
      }

      if (!values.password) {
        errors.password = "Password is required.";
      } else if (!isStrongPassword(values.password)) {
        errors.password =
          "Use at least 8 chars with uppercase, lowercase, and a number.";
      }

      if (!values.confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
      } else if (values.confirmPassword !== values.password) {
        errors.confirmPassword = "Passwords do not match.";
      }

      return errors;
    },
    onSubmit(values) {
      try {
        registerUser({
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone,
          password: values.password,
        });

        // Registration should not auto-login in this flow.
        setCurrentUser(null);
        setActivePanel("success");

        window.setTimeout(() => {
          loginForm.setValues({
            phone: normalizePhone(values.phone),
            password: "",
          });
          setActivePanel("login");
        }, 1200);
      } catch (error) {
        pushToast(
          "danger",
          error instanceof Error ? error.message : "Registration failed."
        );
      }
    },
  });

  function resetAllState() {
    loginForm.resetForm();
    registerForm.resetForm();
    setToasts([]);
    setActivePanel(initialView);
  }

  function closeModal() {
    resetAllState();
    onClose();
  }

  function openView(nextView: ActivePanel, options?: { keepToasts?: boolean }) {
    if (!(options?.keepToasts ?? false)) {
      setToasts([]);
    }

    setActivePanel(nextView);
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
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-5 pb-5 sm:px-7">
          <div className="mx-auto flex h-full w-full max-w-136 flex-col justify-center py-2">
            {activePanel === "login" && (
              <form className="space-y-6" onSubmit={loginForm.handleSubmit}>
                <SectionTitle
                  title="Welcome Back"
                  description="Log in to continue your learning journey."
                />

                <div className="space-y-4">
                  <Field label="Phone Number" htmlFor="login-phone">
                    <TextInput
                      id="login-phone"
                      name="phone"
                      type="tel"
                      placeholder="+880XXXXXXXXXX"
                      value={loginForm.values.phone}
                      onChange={loginForm.handleChange}
                      onBlur={loginForm.handleBlur}
                      hasError={Boolean(loginForm.touched.phone && loginForm.errors.phone)}
                    />
                    <FieldError
                      message={
                        loginForm.touched.phone ? loginForm.errors.phone : undefined
                      }
                    />
                  </Field>

                  <Field label="Password" htmlFor="login-password">
                    <PasswordInput
                      id="login-password"
                      name="password"
                      placeholder="Enter your password"
                      value={loginForm.values.password}
                      onChange={loginForm.handleChange}
                      onBlur={loginForm.handleBlur}
                      hasError={Boolean(
                        loginForm.touched.password && loginForm.errors.password
                      )}
                    />
                    <FieldError
                      message={
                        loginForm.touched.password
                          ? loginForm.errors.password
                          : undefined
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
              <form className="space-y-4" onSubmit={registerForm.handleSubmit}>
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full Name" htmlFor="register-name">
                      <TextInput
                        id="register-name"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={registerForm.values.fullName}
                        onChange={registerForm.handleChange}
                        onBlur={registerForm.handleBlur}
                        hasError={Boolean(
                          registerForm.touched.fullName &&
                            registerForm.errors.fullName
                        )}
                      />
                      <FieldError
                        message={
                          registerForm.touched.fullName
                            ? registerForm.errors.fullName
                            : undefined
                        }
                      />
                    </Field>

                    <Field label="WhatsApp Phone Number" htmlFor="register-phone">
                      <TextInput
                        id="register-phone"
                        name="phone"
                        type="tel"
                        placeholder="+880XXXXXXXXXX"
                        value={registerForm.values.phone}
                        onChange={registerForm.handleChange}
                        onBlur={registerForm.handleBlur}
                        hasError={Boolean(
                          registerForm.touched.phone && registerForm.errors.phone
                        )}
                      />
                      <FieldError
                        message={
                          registerForm.touched.phone
                            ? registerForm.errors.phone
                            : undefined
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Email Address" htmlFor="register-email">
                    <TextInput
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerForm.values.email}
                      onChange={registerForm.handleChange}
                      onBlur={registerForm.handleBlur}
                      hasError={Boolean(
                        registerForm.touched.email && registerForm.errors.email
                      )}
                    />
                    <FieldError
                      message={
                        registerForm.touched.email
                          ? registerForm.errors.email
                          : undefined
                      }
                    />
                  </Field>

                  <Field label="Password" htmlFor="register-password">
                    <PasswordInput
                      id="register-password"
                      name="password"
                      placeholder="Create a strong password"
                      value={registerForm.values.password}
                      onChange={registerForm.handleChange}
                      onBlur={registerForm.handleBlur}
                      hasError={Boolean(
                        registerForm.touched.password && registerForm.errors.password
                      )}
                    />
                    <FieldError
                      message={
                        registerForm.touched.password
                          ? registerForm.errors.password
                          : undefined
                      }
                    />
                  </Field>

                  <Field
                    label="Confirm Password"
                    htmlFor="register-confirm-password"
                  >
                    <PasswordInput
                      id="register-confirm-password"
                      name="confirmPassword"
                      placeholder="Re-enter your password"
                      value={registerForm.values.confirmPassword}
                      onChange={registerForm.handleChange}
                      onBlur={registerForm.handleBlur}
                      hasError={Boolean(
                        registerForm.touched.confirmPassword &&
                          registerForm.errors.confirmPassword
                      )}
                    />
                    <FieldError
                      message={
                        registerForm.touched.confirmPassword
                          ? registerForm.errors.confirmPassword
                          : undefined
                      }
                    />
                  </Field>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Create Account
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

            {activePanel === "success" && (
              <div className="space-y-7 text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 shadow-[0_20px_50px_-24px_rgba(16,185,129,0.55)]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500 text-emerald-500">
                    <CheckIcon className="h-9 w-9" />
                  </div>
                </div>

                <SectionTitle
                  title="Account Created Successfully!"
                  description="Welcome to Mentor Lagbe! Your account has been created. Redirecting you to login."
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
