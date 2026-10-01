"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { AuthModal } from "@/app/components/ui/auth-modal";
import { LandingHeader } from "@/app/sections/landing/landing-header";
import { ContactModal } from "@/app/components/ui/contact-modal";
import Footer from "@/app/components/ui/Footer";
import { AboutHeroSection } from "@/app/sections/about/about-hero-section";
import { AboutMissionSection } from "@/app/sections/about/about-mission-section";
import { AboutTimelineSection } from "@/app/sections/about/about-timeline-section";
import { AboutTeamSection } from "@/app/sections/about/about-team-section";
import { AboutGrowthMetricsSection } from "@/app/sections/about/about-growth-metrics-section";
import {
  aboutHero,
  coreValues,
  growthMetrics,
  journeyMilestones,
  mission,
  teamMembers,
} from "@/app/sections/about/about-data";
import type { AuthUser } from "@/lib/mock-auth";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import { isComingSoonMode } from "@/lib/coming-soon";

export function AboutPageShell() {
  const router = useRouter();
  const comingSoon = isComingSoonMode();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const user = useSyncExternalStore<AuthUser | null>(
    subscribeAuthStore,
    readAuthSnapshot,
    () => null
  );

  function handleBookSessionClick() {
    if (comingSoon) {
      router.push("/#learn-now");
      return;
    }
    if (user?.role === "student") {
      router.push("/dashboard/live-session-book");
      return;
    }
    setIsAuthModalOpen(true);
  }

  function scrollToLearnOnHome() {
    router.push("/#learn-now");
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <LandingHeader
        user={user}
        comingSoon={comingSoon}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onDashboardClick={() => router.push("/dashboard")}
        onContactClick={() => setIsContactModalOpen(true)}
        onLearnNowClick={scrollToLearnOnHome}
      />
      <main>
        <AboutHeroSection
          data={aboutHero}
          onPrimaryCtaClick={handleBookSessionClick}
          hideCtAs={comingSoon}
        />
        <AboutMissionSection
          heading={mission.heading}
          description={mission.description}
          imageCaption={mission.imageCaption}
          values={coreValues}
        />
        <AboutTimelineSection milestones={journeyMilestones} />
        <AboutTeamSection members={teamMembers} />
        <AboutGrowthMetricsSection metrics={growthMetrics} />
      </main>
      <Footer />
      <ContactModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
      {/* BACKEND_LIVE — auth modal */}
      {!comingSoon && isAuthModalOpen ? (
        <AuthModal
          open={isAuthModalOpen}
          initialView="login"
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(authUser) => {
            setIsAuthModalOpen(false);
            if (authUser.role === "student") {
              router.push("/dashboard/live-session-book");
            }
          }}
        />
      ) : null}
    </div>
  );
}
