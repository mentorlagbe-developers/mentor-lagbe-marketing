"use client";

import { useState, useSyncExternalStore } from "react";
import { AuthModal } from "@/app/components/ui/auth-modal";
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

type AuthEntryView = "login" | "register";

export function LandingPageShell() {
  const [authView, setAuthView] = useState<AuthEntryView>("login");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const user = useSyncExternalStore<AuthUser | null>(
    subscribeAuthStore,
    readAuthSnapshot,
    () => null
  );

  function openAuth(view: AuthEntryView) {
    setAuthView(view);
    setIsModalOpen(true);
  }

  return (
    <>
      <div className="min-h-screen bg-white text-slate-900">
        <LandingHeader
          user={user}
          onAuthClick={() => openAuth("login")}
          onDashboardClick={() => {}}
          onContactClick={() => setIsContactModalOpen(true)}
        />

        <main>
          <HeroSection
            user={user}
            onPrimaryAction={() => openAuth(user ? "login" : "register")}
          />

          <LiveSupportSection onCtaClick={() => openAuth("register")} />
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
          onClose={() => setIsModalOpen(false)}
          onAuthSuccess={() => {
            setIsModalOpen(false);
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
