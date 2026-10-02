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
import { isComingSoonMode } from "@/lib/coming-soon";
import { HeroSection } from "@/app/sections/landing/hero-section";
import { LandingHeader } from "@/app/sections/landing/landing-header";
import { LiveSupportSection } from "@/app/sections/landing/live-support-section";
import { ConfusionClaritySection } from "@/app/sections/landing/confusion-clarity-section";
import { TopicExpertGridSection } from "@/app/sections/landing/topic-expert-grid-section";
import { HowItWorksSection } from "@/app/sections/landing/how-it-works-section";
import { FaqSection } from "@/app/sections/landing/faq-section";
import { WhatsAppChatWidget } from "@/app/dashboard/_components/whatsapp-chat-widget";
import { InterimLearningSection } from "@/app/sections/landing/interim-learning-section";
import Footer from "@/app/components/ui/Footer";

type AuthEntryView = "login" | "register" | "verify" | "forgot" | "reset";

export function LandingPageShell() {
  const router = useRouter();
  const comingSoon = isComingSoonMode();
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
    !comingSoon &&
    (queryAuth === "login" ||
    queryAuth === "register" ||
    queryAuth === "verify" ||
    queryAuth === "forgot" ||
    queryAuth === "reset")
      ? queryAuth
      : null;
  const authUserId = query.get("userId") ?? "";
  const authEmail = query.get("email") ?? "";
  const isModalOpen = !comingSoon && (manualModalOpen || Boolean(queryAuthView));
  const authView = queryAuthView ?? manualAuthView;

  function openAuth(view: AuthEntryView) {
    if (comingSoon) return;
    setManualAuthView(view);
    setManualModalOpen(true);
  }

  function scrollToLearnNow() {
    document.getElementById("learn-now")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <LandingHeader
          user={user}
          comingSoon={comingSoon}
          onAuthClick={() => openAuth("login")}
          onDashboardClick={() => router.push("/dashboard")}
          onContactClick={() => setIsContactModalOpen(true)}
          onLearnNowClick={scrollToLearnNow}
        />

        <main className="space-y-0 overflow-x-hidden">
          <HeroSection
            user={user}
            comingSoon={comingSoon}
            onPrimaryAction={() =>
              comingSoon
                ? scrollToLearnNow()
                : user
                  ? router.push("/dashboard")
                  : openAuth("register")
            }
          />
          <InterimLearningSection />
          <LiveSupportSection
            comingSoon={comingSoon}
            onCtaClick={() => (comingSoon ? scrollToLearnNow() : openAuth("register"))}
          />

          <ConfusionClaritySection />
          <HowItWorksSection />
          <TopicExpertGridSection />
          <FaqSection comingSoon={comingSoon} />

          <Footer />
        </main>
      </div>
      {/* BACKEND_LIVE — auth modal (register / WhatsApp OTP via API) */}
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
      {/* BACKEND_LIVE — wa.me widget (session purchase copy); OpenWA OTP is in auth-modal + backend */}
      {!comingSoon ? <WhatsAppChatWidget /> : null}
    </>
  );
}
