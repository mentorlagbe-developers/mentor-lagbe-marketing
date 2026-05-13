"use client";

import { useState } from "react";
import { Bell, History, KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/mock-auth";
import { useProfileStatus } from "@/app/dashboard/_components/profile-status-context";
import { Button } from "@/app/components/ui/button";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

type SettingsTab = "alerts" | "security";

const tabItems: Array<{ id: SettingsTab; label: string }> = [
  { id: "alerts", label: "Alerts" },
  { id: "security", label: "Security" },
];

export function SettingsSection({ role }: { role: UserRole }) {
  const router = useRouter();
  const auth = useAuth();
  const { profile } = useProfileStatus();
  const [activeTab, setActiveTab] = useState<SettingsTab>("security");
  const [status, setStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [channels, setChannels] = useState({
    courseUpdates: { email: true, push: false, sms: false },
    liveSessionReminders: { email: true, push: true, sms: true },
    paymentStatus: { email: true, push: true, sms: false },
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const loginActivity = [
    { event: "Latest successful login", time: profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "N/A" },
    { event: "Email verification", time: profile?.emailVerifiedAt ? new Date(profile.emailVerifiedAt).toLocaleString() : "Not verified yet" },
    { event: "Profile last updated", time: profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : "N/A" },
  ];

  const toggleChannel = (key: keyof typeof channels, channel: "email" | "push" | "sms") => {
    setChannels((prev) => {
      const next = {
        ...prev,
        [key]: { ...prev[key], [channel]: !prev[key][channel] },
      };
      console.log("[alerts-preference-changed]", { type: key, channel, enabled: next[key][channel], preferences: next });
      return next;
    });
  };

  async function handleUpdatePassword() {
    setStatus(null);
    setPasswordError(null);
    if (!passwordForm.currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
      setPasswordError("New password must include one uppercase letter and one number.");
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Confirm password does not match.");
      return;
    }

    try {
      setIsSavingPassword(true);
      await apiFetch<Record<string, unknown>>("/users/me/change-password", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setStatus("Password updated successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      await auth.logout();
      router.push("/?auth=login");
    } catch (error) {
      setPasswordError(error instanceof ApiError ? error.message : "Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Settings Workspace</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings & Security</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage security, alerts, and account preferences for <span className="capitalize">{role}</span>.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Signed in as {profile?.email ?? "N/A"} ({profile?.readableId ?? "N/A"})
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl rounded-full border border-sky-100 bg-linear-to-r from-sky-100 to-cyan-100 p-1.5 shadow-[0_16px_36px_-24px_rgba(14,116,144,0.45)]">
        <div className="grid grid-cols-2 gap-1">
          {tabItems.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border border-sky-500 bg-white text-slate-900 shadow-[0_10px_18px_-12px_rgba(14,116,144,0.55)]"
                    : "text-slate-600 hover:bg-white/70"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "security" ? (
        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-sky-500 p-2 text-white">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Password</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Use a strong, unique password.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Current password</span>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">New password</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3"
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium">Confirm new password</span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleUpdatePassword} disabled={isSavingPassword}>
                {isSavingPassword ? "Updating..." : "Update password"}
              </Button>
            </div>
            {passwordError ? <p className="mt-2 text-sm text-rose-500">{passwordError}</p> : null}
            {status ? <p className="mt-2 text-sm text-emerald-600">{status}</p> : null}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-sky-500 p-2 text-white">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Login activity</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Recent sign-in events on your account.</p>
              </div>
            </div>
            <div className="space-y-2">
              {loginActivity.map((item) => (
                <div key={item.event} className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-2.5 text-sm">
                  <span className="text-slate-800">{item.event}</span>
                  <span className="text-slate-500">{item.time}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === "alerts" ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-sky-500 p-2 text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Notification matrix</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pick a channel for each type of update.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <div className="hidden grid-cols-4 bg-sky-100 px-4 py-3 text-sm font-semibold text-slate-700 md:grid">
              <span>Type</span><span>Email</span><span>Push</span><span>SMS</span>
            </div>
            {Object.entries(channels).map(([key, value]) => (
              <div key={key} className="border-t border-slate-100 px-4 py-3 text-sm">
                <div className="mb-2 font-medium capitalize text-slate-800">{key.replace(/([A-Z])/g, " $1")}</div>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:items-center">
                  {(["email", "push", "sms"] as const).map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium md:justify-self-start ${
                        value[channel]
                          ? "border-sky-500 bg-sky-500 text-white"
                          : "border-sky-200 bg-white text-slate-600"
                      }`}
                      onClick={() => toggleChannel(key as keyof typeof channels, channel)}
                    >
                      {channel.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Toggle actions are currently logged to console only. API persistence will be added next.
          </p>
        </article>
      ) : null}

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-sky-500 p-2 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 capitalize">More settings coming</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Account, learning, and billing integrations will be connected to backend APIs next.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

