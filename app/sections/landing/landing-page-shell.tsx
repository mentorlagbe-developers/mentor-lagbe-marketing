"use client";

import { useState, useSyncExternalStore } from "react";
import { AuthModal } from "@/app/components/ui/auth-modal";
import type { AuthUser } from "@/lib/mock-auth";
import {
  readAuthSnapshot,
  setCurrentUser,
  subscribeAuthStore,
} from "@/lib/mock-auth";
import { HeroSection } from "@/app/sections/landing/hero-section";
import { LandingHeader } from "@/app/sections/landing/landing-header";
import { LiveSupportSection } from "@/app/sections/landing/live-support-section";

type AuthEntryView = "login" | "register" | "forgot";

export function LandingPageShell() {
  const [authView, setAuthView] = useState<AuthEntryView>("login");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useSyncExternalStore<AuthUser | null>(
    subscribeAuthStore,
    readAuthSnapshot,
    () => null
  );

  function openAuth(view: AuthEntryView) {
    setAuthView(view);
    setIsModalOpen(true);
  }

  function handleLogout() {
    setCurrentUser(null);
  }

  return (
    <>
      <div className="min-h-screen bg-white text-slate-900">
        <LandingHeader
          user={user}
          onSignupClick={() => openAuth("login")}
          onLogoutClick={handleLogout}
        />

        <main>
          <HeroSection
            user={user}
            onPrimaryAction={() => openAuth(user ? "login" : "register")}
          />

          <LiveSupportSection onCtaClick={() => openAuth("register")} />
        </main>
      </div>

      {isModalOpen ? (
        <AuthModal
          key={authView}
          open={isModalOpen}
          initialView={authView}
          onClose={() => setIsModalOpen(false)}
          onAuthSuccess={() => {
            setIsModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
