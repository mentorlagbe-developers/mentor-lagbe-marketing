"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "../../components/ui/auth-modal";
import { ContactModal } from "@/app/components/ui/contact-modal";
import type { AuthUser } from "@/lib/mock-auth";
import {
  readAuthSnapshot,
  subscribeAuthStore,
} from "@/lib/mock-auth";
import { HeroSection } from "@/app/sections/landing/hero-section";
import { LandingHeader } from "@/app/sections/landing/landing-header";
import { LiveSupportSection } from "@/app/sections/landing/live-support-section";
import { ConfusionClaritySection } from "@/app/sections/landing/confusion-clarity-section";
import { TopicExpertGridSection } from "@/app/sections/landing/topic-expert-grid-section";
import { HowItWorksSection } from "@/app/sections/landing/how-it-works-section";
import Footer from "@/app/components/ui/Footer";

type AuthEntryView = "login" | "register" | "verify" | "forgot" | "reset";

export function LandingPageShell() {
  const router = useRouter();
  const [manualAuthView, setManualAuthView] = useState<AuthEntryView>("login");
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const user = useSyncExternalStore<AuthUser | null>(
    subscribeAuthStore,
    readAuthSnapshot,
    () => null
  );
  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => ""
  );
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const queryAuth = query.get("auth");
  const queryAuthView: AuthEntryView | null =
    queryAuth === "login" ||
    queryAuth === "register" ||
    queryAuth === "verify" ||
    queryAuth === "forgot" ||
    queryAuth === "reset"
      ? queryAuth
      : null;
  const authUserId = query.get("userId") ?? "";
  const authEmail = query.get("email") ?? "";
  const isModalOpen = manualModalOpen || Boolean(queryAuthView);
  const authView = queryAuthView ?? manualAuthView;

  function openAuth(view: AuthEntryView) {
    setManualAuthView(view);
    setManualModalOpen(true);
  }

  return (
    <>
      <div className="min-h-screen bg-white text-slate-900">
        <LandingHeader
          user={user}
          onAuthClick={() => openAuth("login")}
          onDashboardClick={() => router.push("/dashboard")}
          onContactClick={() => setIsContactModalOpen(true)}
        />

        <main>
        <LiveSupportSection onCtaClick={() => openAuth("register")} />

          <HeroSection
            user={user}
            onPrimaryAction={() => (user ? router.push("/dashboard") : openAuth("register"))}
          />

          <ConfusionClaritySection />
          <TopicExpertGridSection />
          <HowItWorksSection />
          <Footer/>
        </main>
      </div>

      {isModalOpen ? (
        <AuthModal
          key={authView}
          open={isModalOpen}
          initialView={authView}
          initialUserId={authUserId}
          initialEmail={authEmail}
          onClose={() => {
            setManualModalOpen(false);
            if (queryAuthView) {
              router.replace("/");
            }
          }}
          onAuthSuccess={() => {
            setManualModalOpen(false);
          }}
        />
      ) : null}

      <ContactModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
}
